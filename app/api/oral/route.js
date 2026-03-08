import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf')

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API Gemini manquante. Vérifiez GEMINI_API_KEY dans Vercel.' }, { status: 500 })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64
                  }
                },
                {
                  text: `Tu es un membre du jury d'admission en IFSI (Institut de Formation en Soins Infirmiers) pour l'épreuve orale du concours FPC (Formation Professionnelle Continue). Tu viens de recevoir le CV/parcours d'un candidat qui est actuellement Aide-Soignant(e) ou Auxiliaire de Puériculture.

Analyse attentivement ce document et génère exactement 10 questions personnalisées que le jury pourrait poser lors de l'entretien oral de 20 minutes. Les questions doivent couvrir ces 3 catégories :

CATÉGORIE 1 - PARCOURS PROFESSIONNEL (4 questions) :
- Questions sur les expériences mentionnées dans le CV
- Questions sur les compétences acquises
- Questions sur les choix de carrière et les transitions

CATÉGORIE 2 - MOTIVATION ET PROJET (3 questions) :
- Pourquoi vouloir devenir infirmier/infirmière
- Ce qui a déclenché cette envie de reconversion
- Le projet professionnel à moyen/long terme

CATÉGORIE 3 - CONNAISSANCES DU MÉTIER IDE (3 questions) :
- Questions sur le rôle propre de l'infirmier vs aide-soignant
- Questions sur l'éthique, la responsabilité, le cadre légal
- Questions sur les réalités du métier (gardes, charge émotionnelle, etc.)

IMPORTANT : Réponds UNIQUEMENT en JSON valide, sans backticks, sans markdown, avec cette structure exacte :
[
  {
    "id": 1,
    "category": "Parcours professionnel",
    "question": "La question ici",
    "tips": "Un conseil court pour bien répondre à cette question"
  }
]

Adapte chaque question au contenu réel du CV. Sois précis en faisant référence aux postes, formations ou expériences du candidat.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      return NextResponse.json({ error: `Erreur API Gemini (${response.status}). Vérifiez votre clé API.` }, { status: 500 })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      console.error('Gemini empty response:', JSON.stringify(data))
      return NextResponse.json({ error: 'Réponse vide de Gemini. Réessayez.' }, { status: 500 })
    }

    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()

    try {
      const questions = JSON.parse(cleaned)
      return NextResponse.json({ questions })
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw:', cleaned.substring(0, 500))
      return NextResponse.json({ error: 'Erreur de format. Réessayez.' }, { status: 500 })
    }
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Erreur serveur : ' + error.message }, { status: 500 })
  }
}
