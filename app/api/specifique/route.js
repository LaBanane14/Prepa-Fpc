import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const apiKey = process.env.GEMINI_API_KEY

let annalesBase64 = null
try {
  const pdfPath = join(process.cwd(), 'data', 'annales-maths.pdf')
  const pdfBuffer = readFileSync(pdfPath)
  annalesBase64 = pdfBuffer.toString('base64')
} catch (e) {
  console.error('Impossible de charger le PDF des annales maths:', e.message)
}

async function callGeminiWithPdf(prompt) {
  const parts = []
  if (annalesBase64) {
    parts.push({ inlineData: { mimeType: 'application/pdf', data: annalesBase64 } })
  }
  parts.push({ text: prompt })

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.8, topP: 0.95, maxOutputTokens: 4096, responseMimeType: 'application/json' }
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

async function callGemini(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 4096, responseMimeType: 'application/json' }
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

const JSON_FORMAT = `
IMPORTANT : Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "famille": "NOM_FAMILLE",
  "titre": "Titre de l'entraînement",
  "questions": [
    {
      "id": 1,
      "question": "L'énoncé de la question",
      "reponse": "La réponse attendue (courte, un nombre)",
      "explication": "Explication DÉTAILLÉE étape par étape du calcul. Montre chaque opération intermédiaire. Ex: Étape 1 : On identifie... | Étape 2 : On calcule 200 × 0.15 = 30 | Étape 3 : 200 - 30 = 170 | Résultat : 170€"
    }
  ]
}`

const famillePrompts = {
  operations: `Tu es un générateur d'exercices de mathématiques pour le concours FPC (Formation Professionnelle Continue) d'entrée en IFSI. Tu génères exactement 10 questions sur le thème du PRODUIT EN CROIX, de la RÈGLE DE TROIS et de la PROPORTIONNALITÉ.

Le document PDF ci-joint contient des annales réelles du concours. Inspire-toi en.

## Niveau attendu
Niveau classe de 3ème / brevet des collèges. Les candidats sont des adultes en reconversion professionnelle. L'épreuve dure 30 minutes pour ~10 questions (toutes catégories confondues), donc chaque question doit être résoluble en 2-3 minutes max.

## Types de questions à couvrir (varier parmi ces sous-types)
1. **Proportionnalité directe simple** : "200g de farine pour 10 crêpes. Combien pour 20 crêpes ?"
2. **Calcul de doses médicamenteuses** : "Un patient de 70 kg doit recevoir 0,5 mg/kg. Quelle dose totale ?" — C'est LE type de question emblématique du concours FPC.
3. **Débit de perfusion** : "Une perfusion de 1 litre à 60 mL/h. Combien de temps durera-t-elle ?"
4. **Préparation de solutions** : "Préparer 200 mL d'une solution de glucose à 5%. Combien de grammes de glucose ?"
5. **Mise à l'échelle / approvisionnement** : "5 infirmiers utilisent 20 boîtes de gants/semaine. Avec 7 infirmiers, combien de boîtes ?"
6. **Provisions / besoins quotidiens** : "Paulette boit 1 500 mL d'eau/jour. Combien de litres pour le mois de janvier (31 jours) ?"
7. **Recette / cuisine** : "Pour 4 personnes il faut 300g de pâtes. Combien pour 7 personnes ?"
8. **Surface et matériaux** : "1 carton de parquet couvre 2 m². Pour une pièce de 48 m², combien de cartons ? Prix total à 30€/m² ?"
9. **Tableau de proportionnalité** : "Vérifier si un tableau est proportionnel et trouver le coefficient"
10. **Contre-exemple de proportionnalité** : "À 5 ans un garçon mesure 1,10m, à 10 ans 1,40m. La taille est-elle proportionnelle à l'âge ?"

## Contextes à utiliser (varier à chaque génération)
Privilégie les contextes médicaux et infirmiers : calculs de doses (mg/kg, mL/h), préparation de solutions, approvisionnement de service hospitalier, consommation de matériel médical, alimentation de patients (kcal, mL d'eau). Alterne avec des contextes quotidiens : courses, bricolage, cuisine, voyages. Utilise des prénoms français courants.

## Contraintes
- Exactement 10 questions, numérotées de 1 à 10
- Difficulté progressive : questions 1-3 faciles, 4-7 moyennes, 8-10 plus complexes
- Au moins 3 questions en contexte médical/infirmier (doses, perfusions, solutions)
- Au moins 1 question de type "contre-exemple" (non-proportionnalité)
- Les nombres doivent rester raisonnables
- Chaque question a UNE SEULE bonne réponse numérique (pas de QCM)
- Les réponses doivent tomber sur des nombres "propres" (arrondir à 2 décimales max si nécessaire)
- Ne JAMAIS inclure la réponse dans l'énoncé

${JSON_FORMAT.replace('NOM_FAMILLE', 'operations')}`,

  pourcentages: `Tu es un générateur d'exercices de mathématiques pour le concours FPC (Formation Professionnelle Continue) d'entrée en IFSI. Tu génères exactement 10 questions sur le thème des POURCENTAGES.

Le document PDF ci-joint contient des annales réelles du concours. Inspire-toi en.

## Niveau attendu
Niveau classe de 3ème / brevet des collèges. Les candidats sont des adultes en reconversion professionnelle. L'épreuve dure 30 minutes pour ~10 questions (toutes catégories confondues), donc chaque question doit être résoluble en 2-3 minutes max.

## Types de questions à couvrir (varier parmi ces sous-types)
1. **Calculer un pourcentage simple** : "X personnes sur Y font Z. Quel pourcentage ?" (ex : 4 infirmières sur 7 prennent un café, quel %)
2. **Appliquer un pourcentage** : "Il y a 70 millions d'habitants dont 13% de gauchers. Combien de gauchers ?"
3. **Augmentation en pourcentage** : "Un loyer de 1 200€ augmente de 7%. Quel est le nouveau prix ?"
4. **Diminution en pourcentage** : "Un article à 85€ est soldé à -30%. Quel est le prix soldé ?"
5. **Retrouver la valeur initiale** : "Après une augmentation de 30%, la production est de 558 330 unités. Quelle était la production initiale ?"
6. **Pourcentages successifs** : "Un prix augmente de 10% puis diminue de 10%. Retrouve-t-on le prix initial ?"
7. **Contexte santé/médical** : "40% des cancers sont liés aux habitudes de vie. Sur 350 000 cas, combien sont évitables ?"
8. **Calcul de TVA** : "Un appareil coûte 150€ HT. Avec une TVA à 20%, quel est le prix TTC ?"
9. **Taux d'intérêt** : "Un placement de 1 000€ à 2% par an rapporte combien la 1ère année ?"
10. **Pourcentage d'une fraction** : "Convertir 3/8 en pourcentage"

## Contextes à utiliser (varier à chaque génération)
Utilise des contextes réalistes et variés : hôpital, pharmacie, service infirmier, vie quotidienne (courses, loyer, vacances), données de santé publique (obésité, alcool, tabac), production industrielle, population française. Utilise des prénoms français courants.

## Contraintes
- Exactement 10 questions, numérotées de 1 à 10
- Difficulté progressive : questions 1-3 faciles, 4-7 moyennes, 8-10 plus complexes
- Les nombres doivent rester raisonnables (pas de calculs à 6 chiffres)
- Chaque question a UNE SEULE bonne réponse numérique (pas de QCM)
- Les réponses doivent tomber sur des nombres "propres" (pas de décimales infinies, arrondir à 2 décimales max si nécessaire)
- Ne JAMAIS inclure la réponse dans l'énoncé

${JSON_FORMAT.replace('NOM_FAMILLE', 'pourcentages')}`,

  conversions: `Tu es un générateur d'exercices de mathématiques pour le concours FPC (Formation Professionnelle Continue) d'entrée en IFSI. Tu génères exactement 10 questions sur le thème des CONVERSIONS D'UNITÉS et des OPÉRATIONS DE BASE (multiplications, divisions, fractions).

Le document PDF ci-joint contient des annales réelles du concours. Inspire-toi en.

## Niveau attendu
Niveau classe de 3ème / brevet des collèges. Les candidats sont des adultes en reconversion professionnelle. L'épreuve dure 30 minutes pour ~10 questions (toutes catégories confondues), donc chaque question doit être résoluble en 2-3 minutes max. Les divisions représentent environ 60% de l'épreuve de maths au concours FPC.

## Types de questions à couvrir (varier parmi ces sous-types)
1. **Conversion de masses** : "Convertir 2 500 microgrammes en milligrammes" (µg → mg, mg → g, g → kg)
2. **Conversion de volumes** : "Convertir 1,75 L en mL" (L → mL → cL)
3. **Conversion de longueurs** : "Convertir 256,77 m en décamètres"
4. **Conversion de surfaces** : "Convertir 48 m² en cm²"
5. **Conversion de durées** : "21h + 430 min = ? (exprimer en jours, heures, minutes)"
6. **Addition de fractions** : "(8/3) + (29/6) = ?"
7. **Simplification de fractions** : "Simplifier 45/6"
8. **Conversion fraction ↔ pourcentage** : "Convertir 1/4 en pourcentage" ou "50% = quelle fraction ?"
9. **Calcul d'IMC** : "Un patient pèse 85 kg et mesure 1,72 m. Calculez son IMC (poids/taille²)"
10. **Opérations avec décimaux** : Multiplications et divisions de nombres décimaux dans un contexte concret

## Contextes à utiliser (varier à chaque génération)
Contextes médicaux : prescriptions en µg/mg/g, volumes de perfusion en mL/L, poids de patients, IMC, durées d'administration de traitements. Contextes quotidiens : distances, surfaces de pièces, durées de trajet, recettes. Les conversions médicales (µg ↔ mg ↔ g) sont les plus fréquentes au concours. Utilise des prénoms français courants.

## Contraintes
- Exactement 10 questions, numérotées de 1 à 10
- Difficulté progressive : questions 1-3 faciles, 4-7 moyennes, 8-10 plus complexes
- Au moins 2 questions de conversion de masses (µg, mg, g, kg) — très fréquent au concours
- Au moins 1 question de fractions
- Au moins 1 question de conversion de durées
- Au moins 1 question d'IMC ou contexte médical direct
- Les nombres doivent rester raisonnables
- Chaque question a UNE SEULE bonne réponse numérique (pas de QCM)
- Les réponses doivent tomber sur des nombres "propres" (arrondir à 2 décimales max si nécessaire)
- Ne JAMAIS inclure la réponse dans l'énoncé

${JSON_FORMAT.replace('NOM_FAMILLE', 'conversions')}`,

  equations: `Tu es un générateur d'exercices de mathématiques pour le concours FPC (Formation Professionnelle Continue) d'entrée en IFSI. Tu génères exactement 10 questions sur le thème des ÉQUATIONS SIMPLES et des PROBLÈMES À RÉSOUDRE (mise en équation de situations concrètes).

Le document PDF ci-joint contient des annales réelles du concours. Inspire-toi en.

## Niveau attendu
Niveau classe de 3ème / brevet des collèges. Les candidats sont des adultes en reconversion professionnelle. L'épreuve dure 30 minutes pour ~10 questions (toutes catégories confondues), donc chaque question doit être résoluble en 2-3 minutes max. Les équations au concours FPC ne dépassent JAMAIS le 1er degré (pas de x², pas de systèmes complexes).

## Types de questions à couvrir (varier parmi ces sous-types)
1. **Problème d'âges** : "Pierre et Paul sont frères. En additionnant leurs âges, on obtient l'âge de leur père. Pierre a 4 ans de plus que Paul. Pierre est né quand son père avait son âge actuel. Quel est l'âge du père ?" — C'est un grand classique du concours FPC.
2. **Problème de moyenne** : "Trois femmes ont un âge moyen de 40 ans. L'aînée a 50 ans. Quel est l'âge moyen des deux autres ?"
3. **Problème de production / stock** : "Une usine produit X unités au 1er semestre et Y au 2ème. Le total représente 30% d'augmentation par rapport à l'année précédente. Quelle était la production précédente ?"
4. **Problème de placement / intérêts** : "Un placement rapporte 400€ la 1ère année et 416€ la 2ème année (intérêts composés). Quelle est la somme initiale et le taux ?"
5. **Problème de vitesse et rencontre** : "Deux voitures partent en sens inverse à des vitesses différentes. Quand se rencontrent-elles ?"
6. **Problème de répartition** : "Un héritage de X € est partagé entre 3 enfants. L'aîné reçoit le double du cadet, qui reçoit 500€ de plus que le benjamin."
7. **Problème de prix / achat** : "Marie achète 3 cahiers et 2 stylos pour 11,50€. Un cahier coûte 2,50€. Quel est le prix d'un stylo ?"
8. **Problème de remplissage / vidange** : "Un robinet remplit une baignoire en 10 min. Un autre la vide en 15 min. Si les deux fonctionnent ensemble, en combien de temps la baignoire est-elle pleine ?"
9. **Problème de distance / temps** : "Un trajet de 150 km est effectué en 2 parties : 90 km à 60 km/h et le reste à 80 km/h. Quelle est la durée totale ?"
10. **Raisonnement logique** : Questions de type vrai/faux avec justification mathématique (ex : "Un article soldé de 20% puis re-soldé de 20% a-t-il baissé de 40% au total ?")

## Contextes à utiliser (varier à chaque génération)
Mélanger contextes du quotidien (achats, voyages, partages, placements) et contextes professionnels/médicaux (planning d'infirmiers, répartition de patients, stocks de matériel). Utilise des prénoms français courants. Les problèmes doivent raconter une petite histoire concrète.

## Contraintes
- Exactement 10 questions, numérotées de 1 à 10
- Difficulté progressive : questions 1-4 faciles (équation directe), 5-7 moyennes (mise en équation), 8-10 plus complexes (raisonnement multi-étapes)
- Au moins 1 problème d'âges (classique du concours)
- Au moins 1 problème de moyenne
- Au moins 1 problème de vitesse ou de durée
- Les équations restent du 1er degré uniquement (ax + b = c ou ax + b = cx + d)
- Les nombres doivent rester raisonnables et les solutions être des nombres entiers ou des décimaux simples
- Chaque question a UNE SEULE bonne réponse numérique (pas de QCM)
- Ne JAMAIS inclure la réponse dans l'énoncé

${JSON_FORMAT.replace('NOM_FAMILLE', 'equations')}`
}

export async function POST(request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API Gemini manquante.' }, { status: 500 })
    }

    const body = await request.json()
    const { action, famille, exercices, reponses } = body

    if (action === 'generer') {
      if (!famille || !famillePrompts[famille]) {
        return NextResponse.json({ error: 'Famille non reconnue.' }, { status: 400 })
      }

      const prompt = famillePrompts[famille]

      // Streaming : envoyer les questions au fur et à mesure
      const parts = []
      if (annalesBase64) {
        parts.push({ inlineData: { mimeType: 'application/pdf', data: annalesBase64 } })
      }
      parts.push({ text: prompt })

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { temperature: 0.8, topP: 0.95, maxOutputTokens: 4096 }
          })
        }
      )

      if (!geminiRes.ok) {
        const errorText = await geminiRes.text()
        console.error('Gemini API error:', geminiRes.status, errorText)
        return NextResponse.json({ error: `Erreur API Gemini (${geminiRes.status})` }, { status: 500 })
      }

      // Lire le stream SSE et renvoyer en streaming
      const encoder = new TextEncoder()
      const reader = geminiRes.body.getReader()
      const decoder = new TextDecoder()

      const stream = new ReadableStream({
        async start(controller) {
          let fullText = ''
          let sentQuestions = 0
          let sseBuffer = ''

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              sseBuffer += decoder.decode(value, { stream: true })
              const sseLines = sseBuffer.split('\n')
              sseBuffer = sseLines.pop() || ''

              for (const line of sseLines) {
                if (!line.startsWith('data: ')) continue
                const jsonStr = line.slice(6).trim()
                if (jsonStr === '[DONE]' || !jsonStr) continue

                try {
                  const parsed = JSON.parse(jsonStr)
                  const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''
                  if (!text) continue
                  fullText += text

                  // Extraire les questions complètes — regex souple sur l'ordre des champs
                  const cleaned = fullText.replace(/```json/g, '').replace(/```/g, '')
                  const blocks = cleaned.match(/\{[^{}]*"id"\s*:\s*\d+[^{}]*"question"\s*:[^{}]*"reponse"\s*:[^{}]*"explication"\s*:[^{}]*\}/g) || []

                  for (let bi = sentQuestions; bi < blocks.length; bi++) {
                    try {
                      const q = JSON.parse(blocks[bi])
                      if (q.id && q.question && q.reponse) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'question', question: q })}\n\n`))
                        sentQuestions = bi + 1
                      }
                    } catch (e) { /* JSON partiel */ }
                  }
                } catch (e) { /* chunk SSE partiel */ }
              }
            }

            // Envoyer le signal de fin
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          } catch (err) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`))
          }
          controller.close()
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }

    if (action === 'corriger') {
      if (!exercices || !reponses) {
        return NextResponse.json({ error: 'Exercices et réponses requis.' }, { status: 400 })
      }

      const questionsFormatted = exercices.map((q, i) => `Question ${q.id} : "${q.question}" (Réponse attendue : ${q.reponse}) → Réponse du candidat : "${reponses[q.id] || '(vide)'}"`).join('\n')

      const prompt = `Tu es un professeur de mathématiques bienveillant et pédagogue. Tu corriges les réponses d'un candidat au concours IFSI FPC.

QUESTIONS ET RÉPONSES :
${questionsFormatted}

Pour CHAQUE question, tu DOIS fournir :
1. Si la réponse est correcte ou non
2. La réponse attendue
3. Une explication COMPLÈTE et DÉTAILLÉE du calcul, étape par étape, comme si tu posais le calcul au tableau. L'élève doit comprendre COMMENT arriver au résultat.

FORMAT DE L'EXPLICATION (en HTML) :
- Commence par rappeler la méthode/formule utilisée en gras
- Montre CHAQUE étape intermédiaire du calcul (pose l'opération, les retenues, les conversions...)
- Utilise <br/> pour les sauts de ligne, <strong> pour les résultats importants, <em> pour les astuces
- Termine par le résultat final en gras
- Si l'élève s'est trompé, explique où est l'erreur et comment l'éviter

Exemple d'explication attendue :
"<strong>Méthode : division décimale</strong><br/>On pose 658,63 ÷ 12,7<br/>On multiplie les deux par 10 : 6586,3 ÷ 127<br/>127 × 5 = 635 → on écrit 5, reste 6586,3 - 6350 = 236,3<br/>127 × 1 = 127 → reste 236,3 - 127 = 109,3<br/>...<br/><strong>Résultat : 51,86</strong>"

IMPORTANT : Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "note": 7,
  "noteMax": ${exercices.length},
  "appreciation": "Appréciation générale en 1-2 phrases",
  "corrections": [
    {
      "id": 1,
      "question": "La question",
      "reponse_candidat": "Ce que le candidat a répondu",
      "reponse_attendue": "La bonne réponse",
      "correct": true,
      "explication": "Explication DÉTAILLÉE étape par étape en HTML"
    }
  ]
}

Le champ "correct" est un booléen (true ou false). Accorde le point si la réponse est mathématiquement correcte même si la formulation diffère légèrement.`

      const raw = await callGemini(prompt)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Erreur de format. Réessayez.' }, { status: 500 })
      }
      const correction = JSON.parse(jsonMatch[0])
      return NextResponse.json({ correction })
    }

    return NextResponse.json({ error: 'Action non reconnue.' }, { status: 400 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Erreur serveur : ' + error.message }, { status: 500 })
  }
}
