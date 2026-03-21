import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { checkRateLimit } from '@/lib/rate-limit'
import { BASE_SYSTEM, FORMAT_SORTIE } from '@/lib/prompts/base-maths'
import { SYSTEM_POURCENTAGES, PROMPT_POURCENTAGES } from '@/lib/prompts/famille-pourcentages'
import { SYSTEM_PROPORTIONNALITE, PROMPT_PROPORTIONNALITE } from '@/lib/prompts/famille-proportionnalite'
import { SYSTEM_CONVERSIONS, PROMPT_CONVERSIONS } from '@/lib/prompts/famille-conversions'
import { SYSTEM_EQUATIONS, PROMPT_EQUATIONS } from '@/lib/prompts/famille-equations'

const apiKey = process.env.GEMINI_API_KEY

let annalesBase64 = null
try {
  const pdfPath = join(process.cwd(), 'data', 'annales-maths.pdf')
  const pdfBuffer = readFileSync(pdfPath)
  annalesBase64 = pdfBuffer.toString('base64')
} catch (e) {
  console.error('Impossible de charger le PDF des annales maths:', e.message)
}

const FAMILLES = {
  operations: { system: SYSTEM_PROPORTIONNALITE, prompt: PROMPT_PROPORTIONNALITE },
  pourcentages: { system: SYSTEM_POURCENTAGES, prompt: PROMPT_POURCENTAGES },
  conversions: { system: SYSTEM_CONVERSIONS, prompt: PROMPT_CONVERSIONS },
  equations: { system: SYSTEM_EQUATIONS, prompt: PROMPT_EQUATIONS }
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip)) return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans quelques secondes.' }, { status: 429 })

    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API Gemini manquante.' }, { status: 500 })
    }

    const body = await request.json()
    const { action, famille } = body

    if (action === 'generer') {
      if (!famille || !FAMILLES[famille]) {
        return NextResponse.json({ error: 'Famille non reconnue.' }, { status: 400 })
      }

      const config = FAMILLES[famille]
      const systemInstruction = BASE_SYSTEM + '\n\n' + config.system
      const userPrompt = config.prompt + '\n\n' + FORMAT_SORTIE

      // Construire les parts (PDF annales + prompt)
      const parts = []
      if (annalesBase64) {
        parts.push({ inlineData: { mimeType: 'application/pdf', data: annalesBase64 } })
      }
      parts.push({ text: userPrompt })

      const response = await fetch(
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

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Gemini API error:', response.status, errorText)
        return NextResponse.json({ error: `Erreur API Gemini (${response.status})` }, { status: 500 })
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) return NextResponse.json({ error: 'Réponse Gemini vide' }, { status: 500 })

      let sujetData
      try {
        sujetData = JSON.parse(text)
      } catch {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        sujetData = JSON.parse(cleaned)
      }

      // Mapper les champs pour compatibilité avec le front (numero→id, enonce→question)
      if (sujetData.questions) {
        sujetData.questions = sujetData.questions.map(q => ({
          id: q.numero || q.id,
          question: q.enonce || q.question,
          reponse: q.reponse,
          explication: q.explication || ''
        }))
      }

      return NextResponse.json({ sujet: sujetData })
    }

    return NextResponse.json({ error: 'Action non reconnue.' }, { status: 400 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Erreur serveur : ' + error.message }, { status: 500 })
  }
}
