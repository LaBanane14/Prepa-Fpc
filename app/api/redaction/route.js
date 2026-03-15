import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const apiKey = process.env.GEMINI_API_KEY

// Charger le PDF des annales au démarrage
let annalesBase64 = null
try {
  const pdfPath = join(process.cwd(), 'data', 'annales-redaction.pdf')
  const pdfBuffer = readFileSync(pdfPath)
  annalesBase64 = pdfBuffer.toString('base64')
} catch (e) {
  console.error('Impossible de charger le PDF des annales:', e.message)
}

async function callGeminiWithPdf(prompt) {
  const parts = []

  if (annalesBase64) {
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: annalesBase64
      }
    })
  }

  parts.push({ text: prompt })

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 8000 }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini API error:', response.status, errorText)
    throw new Error(`Erreur API Gemini (${response.status})`)
  }

  const data = await response.json()
  const allText = data.candidates?.[0]?.content?.parts
    ?.map(p => p.text || '')
    .join('\n') || ''

  if (!allText) throw new Error('Réponse vide de Gemini')
  return allText.replace(/```json/g, '').replace(/```/g, '').trim()
}

async function callGemini(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8000 }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini API error:', response.status, errorText)
    throw new Error(`Erreur API Gemini (${response.status})`)
  }

  const data = await response.json()
  const allText = data.candidates?.[0]?.content?.parts
    ?.map(p => p.text || '')
    .join('\n') || ''

  if (!allText) throw new Error('Réponse vide de Gemini')
  return allText.replace(/```json/g, '').replace(/```/g, '').trim()
}

export async function POST(request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API Gemini manquante.' }, { status: 500 })
    }

    const body = await request.json()
    const { action, sujet, redaction } = body

    // === GÉNÉRER UN SUJET ===
    if (action === 'generer') {
      // 2 fois sur 5 : forcer une dissertation
      const forceDissertation = Math.random() < 0.4

      const prompt = `Tu es un examinateur du concours IFSI FPC (Formation Professionnelle Continue) pour l'épreuve écrite de sous-admissibilité.

Le document PDF ci-joint contient des annales réelles du concours IFSI FPC des dernières années. Tu dois t'en servir comme base principale.

Tu as DEUX possibilités (choisis-en une au hasard, avec une probabilité de 50/50) :

OPTION 1 — SUJET D'ANNALE :
Reprends un sujet tel quel ou très proche d'un sujet présent dans les annales du PDF. Mentionne l'année d'origine dans le titre (ex: "Annale 2024 — ..."). Reproduis fidèlement le texte source et les questions tels qu'ils apparaissent dans le document.

OPTION 2 — SUJET ORIGINAL INSPIRÉ DES ANNALES :
Crée un sujet original en t'inspirant des thèmes, du format et du niveau de difficulté des annales du PDF. Le sujet doit être réaliste et cohérent avec ce qui est demandé au concours.

${forceDissertation ? `CONSIGNE OBLIGATOIRE : Pour cette génération, tu DOIS créer un sujet de type "dissertation" (réflexion argumentée). Pas d'analyse de texte ni de questions. Le candidat doit rédiger une argumentation structurée sur un thème sanitaire et social lié au métier d'infirmier.` : ''}

Dans les deux cas :
- Le sujet s'adresse à des aides-soignants ou auxiliaires de puériculture qui veulent devenir infirmiers
- Le jury évalue : les qualités rédactionnelles, les aptitudes au questionnement, à l'analyse et à l'argumentation, ainsi que la capacité à se projeter dans le futur environnement professionnel
- Le format peut être : une analyse de texte avec questions, une dissertation/réflexion argumentée, ou une réponse à une ou plusieurs questions sur un thème sanitaire et social
- Le candidat dispose de 30 MINUTES seulement, adapte donc la quantité de travail demandé en conséquence (pas plus de 2-3 questions, ou 1 sujet de dissertation court)
- Si le sujet comporte un texte source, il doit faire entre 150 et 300 mots
- IMPORTANT : Le sujet est noté sur 10 points (PAS sur 20). Adapte le barème en conséquence pour que le total fasse 10 points.
- Précise dans le barème qu'un retrait de 0,25 point par faute d'orthographe est appliqué

IMPORTANT : Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "type": "analyse" ou "dissertation" ou "questions",
  "titre": "Titre du sujet (précise 'Annale 2024' si c'est un sujet d'annale)",
  "source": "annale" ou "original",
  "annee": "2024 (si annale, sinon null)",
  "texte": "Le texte source si analyse ou questions (null si dissertation)",
  "consigne": "La consigne complète et détaillée pour le candidat",
  "bareme": "Indication du barème (ex: argumentation 8pts, orthographe 4pts, etc.)"
}`

      const raw = await callGeminiWithPdf(prompt)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Erreur de format. Réessayez.' }, { status: 500 })
      }
      const sujetData = JSON.parse(jsonMatch[0])
      return NextResponse.json({ sujet: sujetData })
    }

    // === CORRIGER UNE RÉDACTION ===
    if (action === 'corriger') {
      if (!sujet || !redaction) {
        return NextResponse.json({ error: 'Sujet et rédaction requis.' }, { status: 400 })
      }

      const prompt = `Tu es un correcteur du concours IFSI FPC. Tu dois corriger la copie d'un candidat de manière détaillée et bienveillante. Le candidat disposait de 30 minutes.

SUJET :
Type : ${sujet.type}
Titre : ${sujet.titre}
${sujet.source === 'annale' ? `(Sujet d'annale ${sujet.annee})` : '(Sujet original)'}
${sujet.texte ? `Texte : ${sujet.texte}` : ''}
Consigne : ${sujet.consigne}
Barème : ${sujet.bareme}

COPIE DU CANDIDAT :
${redaction}

Le jury évalue : les qualités rédactionnelles, les aptitudes au questionnement, à l'analyse et à l'argumentation, ainsi que la capacité à se projeter dans le futur environnement professionnel.

Corrige cette copie en analysant :
1. Les qualités rédactionnelles (style, clarté, fluidité)
2. Les aptitudes au questionnement, à l'analyse et à l'argumentation
3. La capacité à se projeter dans le futur environnement professionnel d'infirmier(e)
4. La structure et l'organisation (introduction, développement, conclusion)
5. L'orthographe et la grammaire — IMPORTANT : applique un retrait de 0,25 point par faute d'orthographe. Liste TOUTES les fautes trouvées.

Sois juste mais bienveillant. Tiens compte du fait que le candidat n'avait que 30 minutes.

IMPORTANT : La note DOIT être sur 10 points (noteMax = 10). Quel que soit le barème du sujet, ramène toujours la note finale sur 10.

IMPORTANT : Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "note": 7,
  "noteMax": 10,
  "appreciation": "Appréciation générale en 2-3 phrases",
  "points_forts": ["point fort 1", "point fort 2", "..."],
  "points_ameliorer": ["point à améliorer 1", "point à améliorer 2", "..."],
  "fautes": [
    { "original": "le mot ou passage fautif", "correction": "la correction", "type": "orthographe/grammaire/syntaxe/conjugaison" }
  ],
  "conseil": "Un conseil personnalisé pour progresser"
}`

      const raw = await callGemini(prompt)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Erreur de format. Réessayez.' }, { status: 500 })
      }
      const correction = JSON.parse(jsonMatch[0])
      // Forcer la note sur 10 si Gemini a noté sur autre chose
      if (correction.noteMax && correction.noteMax !== 10) {
        correction.note = Math.round((correction.note / correction.noteMax) * 10 * 10) / 10
        correction.noteMax = 10
      }
      return NextResponse.json({ correction })
    }

    return NextResponse.json({ error: 'Action non reconnue.' }, { status: 400 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Erreur serveur : ' + error.message }, { status: 500 })
  }
}
