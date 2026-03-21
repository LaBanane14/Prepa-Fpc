import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { BASE_SYSTEM } from '@/lib/prompts/base-maths'
import { SYSTEM_EXAMEN_MATHS, PROMPT_EXAMEN_MATHS } from '@/lib/prompts/examen-maths'
import { checkAuth } from '@/lib/auth-check'

const apiKey = process.env.GEMINI_API_KEY

let annalesBase64 = null
try {
  const pdfPath = join(process.cwd(), 'data', 'annales-maths.pdf')
  const pdfBuffer = readFileSync(pdfPath)
  annalesBase64 = pdfBuffer.toString('base64')
} catch (e) {
  console.error('Impossible de charger le PDF des annales maths:', e.message)
}

async function callGemini(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 24000, responseMimeType: 'application/json' }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini API error:', response.status, errorText)
    throw new Error(`Erreur API Gemini (${response.status})`)
  }

  const data = await response.json()
  const allText = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('\n') || ''
  if (!allText) throw new Error('Réponse vide de Gemini')
  return allText.replace(/```json/g, '').replace(/```/g, '').trim()
}

export async function POST(request) {
  try {
    const user = await checkAuth()
    if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API Gemini manquante.' }, { status: 500 })
    }

    const body = await request.json()
    const { action, exercices, reponses } = body

    // === GÉNÉRER UN SUJET ===
    if (action === 'generer') {
      const systemInstruction = BASE_SYSTEM + '\n\n' + SYSTEM_EXAMEN_MATHS

      // Construire les parts (PDF annales + prompt)
      const parts = []
      if (annalesBase64) {
        parts.push({ inlineData: { mimeType: 'application/pdf', data: annalesBase64 } })
      }
      parts.push({ text: PROMPT_EXAMEN_MATHS })

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts }],
            generationConfig: { temperature: 0.85, topP: 0.95, maxOutputTokens: 12000, responseMimeType: 'application/json' }
          })
        }
      )

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text()
        console.error('Gemini error:', errorText)
        return NextResponse.json({ error: 'Erreur Gemini' }, { status: 500 })
      }

      const geminiData = await geminiResponse.json()
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) return NextResponse.json({ error: 'Réponse Gemini vide' }, { status: 500 })

      let raw
      try {
        raw = JSON.parse(text)
      } catch {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        raw = JSON.parse(cleaned)
      }

      // Mapper vers le format attendu par le front (numero→id, enonce→question)
      const sujetData = {
        source: raw.type === 'examen_blanc' ? 'original' : (raw.source || 'original'),
        titre: raw.theme || 'Épreuve de Mathématiques',
        annee: null,
        ville: null,
        duree: '30 minutes',
        calculatrice: false,
        noteMax: raw.total_points || 10,
        exercices: (raw.exercices || []).map((ex, idx) => ({
          numero: ex.numero || idx + 1,
          titre: ex.titre || `Exercice ${idx + 1}`,
          enonce: ex.consigne || ex.enonce || '',
          categorie: ex.questions?.[0]?.famille || 'operations',
          points: ex.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0,
          questions: (ex.questions || []).map((q, qIdx) => ({
            id: q.numero || `${idx + 1}${String.fromCharCode(97 + qIdx)}`,
            question: q.enonce || q.question || '',
            points: q.points || 0,
            reponse: q.reponse || ''
          }))
        }))
      }

      return NextResponse.json({ sujet: sujetData })
    }

    // === CORRIGER LES RÉPONSES ===
    if (action === 'corriger') {
      if (!exercices || !reponses) {
        return NextResponse.json({ error: 'Exercices et réponses requis.' }, { status: 400 })
      }

      const reponsesFormatted = Object.entries(reponses).map(([id, val]) => `- Question ${id} : "${val}"`).join('\n')

      const prompt = `Tu es un correcteur du concours IFSI FPC pour l'épreuve de mathématiques.
Tu dois corriger les réponses d'un candidat de manière détaillée, juste et bienveillante.
Rappel du contexte : le candidat disposait de 30 minutes, sans calculatrice.

VOICI LE SUJET ET LE BARÈME (au format JSON) :
${JSON.stringify(exercices, null, 2)}

VOICI LES RÉPONSES DU CANDIDAT :
${reponsesFormatted}

MISSION :
Corrige chaque réponse en :
1. Comparant avec la réponse attendue.
2. Expliquant la méthode de résolution étape par étape de manière pédagogique.
3. Attribuant les points avec justesse. Valorise les méthodes correctes même si le résultat final est faux en accordant des points partiels.
4. Rédigeant un bilan constructif (points forts, points à améliorer, conseil).

RÈGLE IMPORTANTE POUR "reponse_attendue" :
- Si la réponse du candidat est CORRECTE : mets simplement le résultat final (ex: "15 ml").
- Si la réponse du candidat est INCORRECTE ou PARTIELLE : mets le détail des calculs menant au résultat (ex: "1500 / 500 × 5 = 15 ml").

FORMAT DE SORTIE :
Tu dois répondre UNIQUEMENT au format JSON strict :

{
  "note": 7.5,
  "noteMax": 10,
  "appreciation": "Appréciation globale bienveillante sur le travail fourni",
  "corrections": [
    {
      "id": "1a",
      "question": "Rappel de la question",
      "reponse_candidat": "Ce qu'a répondu le candidat",
      "reponse_attendue": "La vraie réponse attendue",
      "correct": "true, false, ou partiel",
      "points_obtenus": 1.5,
      "points_max": 1.5,
      "explication": "Explication pédagogique de la correction"
    }
  ],
  "points_forts": ["Point fort 1", "Point fort 2"],
  "points_ameliorer": ["Axe d'amélioration 1", "Axe d'amélioration 2"],
  "conseil": "Un conseil pratique pour le concours"
}`

      const raw = await callGemini(prompt)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Erreur de format. Réessayez.' }, { status: 500 })
      }
      const correction = JSON.parse(jsonMatch[0])
      correction.note = typeof correction.note === 'number' ? correction.note : 0
      correction.noteMax = 10
      correction.appreciation = correction.appreciation || ''
      correction.points_forts = Array.isArray(correction.points_forts) ? correction.points_forts : []
      correction.points_ameliorer = Array.isArray(correction.points_ameliorer) ? correction.points_ameliorer : []
      correction.conseil = correction.conseil || ''
      correction.corrections = (correction.corrections || []).map(c => ({
        id: c.id || '',
        question: c.question || '',
        reponse_candidat: c.reponse_candidat || '',
        reponse_attendue: c.reponse_attendue || '',
        correct: c.correct === true || c.correct === 'true' ? true : c.correct === 'partiel' ? 'partiel' : false,
        points_obtenus: typeof c.points_obtenus === 'number' ? c.points_obtenus : 0,
        points_max: typeof c.points_max === 'number' ? c.points_max : 0,
        explication: c.explication || ''
      }))
      return NextResponse.json({ correction })
    }

    return NextResponse.json({ error: 'Action non reconnue.' }, { status: 400 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Erreur serveur : ' + error.message }, { status: 500 })
  }
}
