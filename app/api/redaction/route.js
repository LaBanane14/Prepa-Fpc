import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { BASE_REDACTION, FORMAT_SORTIE_REDACTION } from '@/lib/prompts/base-redaction'
import { SYSTEM_CLASSIQUE, PROMPT_CLASSIQUE } from '@/lib/prompts/format-classique'
import { SYSTEM_MINI_TEXTE, PROMPT_MINI_TEXTE } from '@/lib/prompts/format-mini-texte'
import { SYSTEM_DISSERTATIF, PROMPT_DISSERTATIF } from '@/lib/prompts/format-dissertatif'

const apiKey = process.env.GEMINI_API_KEY

const FORMATS = {
  classique: { system: SYSTEM_CLASSIQUE, prompt: PROMPT_CLASSIQUE },
  mini_texte: { system: SYSTEM_MINI_TEXTE, prompt: PROMPT_MINI_TEXTE },
  dissertatif: { system: SYSTEM_DISSERTATIF, prompt: PROMPT_DISSERTATIF }
}

// Choix aléatoire pondéré du format (60% classique, 25% mini-texte, 15% dissertatif)
function pickRandomFormat() {
  const r = Math.random()
  if (r < 0.60) return 'classique'
  if (r < 0.85) return 'mini_texte'
  return 'dissertatif'
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
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip)) return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans quelques secondes.' }, { status: 429 })

    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API Gemini manquante.' }, { status: 500 })
    }

    const body = await request.json()
    const { action, sujet, redaction } = body

    // === GÉNÉRER UN SUJET ===
    if (action === 'generer') {
      const formatKey = pickRandomFormat()
      const config = FORMATS[formatKey]

      const systemInstruction = BASE_REDACTION + '\n\n' + config.system
      const userPrompt = config.prompt + '\n\n' + FORMAT_SORTIE_REDACTION

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.9, topP: 0.95, maxOutputTokens: 24000, responseMimeType: 'application/json' }
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

      // Mapper vers le format attendu par le front existant
      const consigne = raw.questions
        ? raw.questions.map((q, i) => `**Question ${q.numero || i + 1}** : ${q.consigne}`).join('\n\n')
        : ''
      const bareme = raw.questions
        ? raw.questions.map(q => `Q${q.numero || ''} : ${q.bareme_indicatif || ''}`).join(' | ')
        : ''

      const sujetData = {
        type: formatKey === 'dissertatif' ? 'dissertation' : 'questions',
        titre: raw.theme || 'Sujet de rédaction',
        source: 'original',
        annee: null,
        texte: raw.texte || '',
        consigne,
        bareme: bareme + (raw.conseil_methodologique ? '\n\nConseil : ' + raw.conseil_methodologique : ''),
        _questions: raw.questions,
        _source_fictive: raw.source_fictive
      }

      return NextResponse.json({ sujet: sujetData })
    }

    // === CORRIGER UNE RÉDACTION ===
    if (action === 'corriger') {
      if (!sujet || !redaction) {
        return NextResponse.json({ error: 'Sujet et rédaction requis.' }, { status: 400 })
      }

      const prompt = `Tu es un correcteur du concours IFSI FPC pour l'épreuve écrite de sous-admissibilité.
Tu dois corriger la copie d'un candidat (aide-soignant ou auxiliaire de puériculture) de manière détaillée, exigeante mais bienveillante. Le candidat disposait de 30 minutes.

VOICI LE SUJET (au format JSON) :
${JSON.stringify(sujet, null, 2)}

VOICI LA COPIE DU CANDIDAT :
${redaction}

MISSION D'ÉVALUATION (sur 10 points) :
Analyse la copie en te basant sur ces critères précis :
1. Qualités rédactionnelles et structure (introduction, développement, conclusion).
2. Pertinence du questionnement, de l'analyse et de l'argumentation face au texte.
3. Capacité de projection dans le rôle et les responsabilités du futur métier d'infirmier (IDE).

MISSION ORTHOGRAPHE (Pénalité) :
Repère TOUTES les fautes d'orthographe, de grammaire et de conjugaison.
Règle stricte : Chaque faute entraîne un retrait de 0.25 point sur la note finale.

FORMAT DE SORTIE :
Tu dois répondre UNIQUEMENT au format JSON strict, sans aucun texte avant ou après, en respectant cette structure :

{
  "note_fond": 8.5,
  "note_fond_max": 10,
  "fautes": [
    { "original": "mot avec erreur", "correction": "mot corrigé", "type": "orthographe/grammaire" }
  ],
  "penalite_orthographe": -0.5,
  "note_finale": 8.0,
  "noteMax": 10,
  "appreciation": "Appréciation globale sur la réflexion et la rédaction",
  "points_forts": ["Point fort 1", "Point fort 2"],
  "points_ameliorer": ["Axe d'amélioration 1", "Axe d'amélioration 2"],
  "conseil": "Un conseil pratique et encourageant pour progresser"
}`

      const raw = await callGemini(prompt)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Erreur de format. Réessayez.' }, { status: 500 })
      }
      const correction = JSON.parse(jsonMatch[0])
      const nbFautes = correction.fautes?.length || 0
      const penalite = nbFautes * 0.25
      const noteFond = correction.note_fond ?? correction.note_finale ?? 10
      correction.penalite_orthographe = -penalite
      correction.note_finale = Math.max(0, Math.round((noteFond - penalite) * 10) / 10)
      correction.noteMax = 10
      correction.note = correction.note_finale
      return NextResponse.json({ correction })
    }

    return NextResponse.json({ error: 'Action non reconnue.' }, { status: 400 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Erreur serveur : ' + error.message }, { status: 500 })
  }
}
