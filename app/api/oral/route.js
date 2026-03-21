import { NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-check'
import { BASE_ORAL, FORMAT_SORTIE_ORAL } from '@/lib/prompts/base-oral'
import { SYSTEM_ORAL, PROMPT_ORAL } from '@/lib/prompts/simulation-oral'

const apiKey = process.env.GEMINI_API_KEY

const categoryMap = {
  parcours: 'Parcours professionnel',
  metier: 'Connaissance du métier',
  qualites: 'Qualités personnelles',
  mise_en_situation: 'Mise en situation',
  piege: 'Question piège'
}

export async function POST(request) {
  try {
    const user = await checkAuth()
    if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API Gemini manquante.' }, { status: 500 })
    }

    const formData = await request.formData()
    const pdfFile = formData.get('pdf')

    if (!pdfFile) {
      return NextResponse.json({ error: 'Veuillez télécharger votre CV au format PDF.' }, { status: 400 })
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())
    const pdfBase64 = pdfBuffer.toString('base64')

    // Assembler les prompts
    const systemInstruction = BASE_ORAL + '\n\n' + SYSTEM_ORAL
    const userPrompt = PROMPT_ORAL + '\n\n' + FORMAT_SORTIE_ORAL

    // Appel Gemini avec le PDF en inline
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{
            parts: [
              { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
              { text: userPrompt }
            ]
          }],
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

    // Mapper vers le format attendu par le front (numero→id, categorie→category)
    const questions = (raw.questions || []).map((q, i) => ({
      id: q.numero || i + 1,
      question: q.question || '',
      category: categoryMap[q.categorie] || q.categorie || 'Parcours professionnel'
    }))

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Erreur serveur : ' + error.message }, { status: 500 })
  }
}
