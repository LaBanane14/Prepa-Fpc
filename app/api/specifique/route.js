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
        generationConfig: { temperature: 0.8, maxOutputTokens: 16000 }
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
        generationConfig: { temperature: 0.7, maxOutputTokens: 16000 }
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
      "reponse": "La réponse attendue (courte)"
    }
  ]
}`

const famillePrompts = {
  operations: `Tu es un professeur de mathématiques spécialisé dans la préparation au concours FPC d'entrée en IFSI (concours infirmier pour la reconversion professionnelle).

Le document PDF ci-joint contient des annales réelles du concours. Inspire-toi en.

# CONTEXTE CONCOURS FPC
L'épreuve de maths dure 30 minutes, notée sur /10, calculatrice INTERDITE. Les candidats n'ont souvent pas fait de maths depuis 5 à 15 ans. Les sujets réels (ex : Marseille 2024) comportent : 658,63 ÷ 12,7 / 952,48 − 399,25 / 67,90 × 3,58.

Génère un entraînement de 10 à 15 questions UNIQUEMENT sur les opérations (additions, soustractions, multiplications, divisions).

# CATÉGORIES À COUVRIR (varier obligatoirement)

## 1. ADDITIONS
- **Facile** : 2 entiers de 3-4 chiffres (ex : 2 847 + 1 395)
- **Moyen** : 2 décimaux avec 2-3 décimales (ex : 347,85 + 1 294,67)
- **Difficile** : 3 nombres décimaux ou décimales différentes (ex : 45,78 + 1 203,9 + 387,06)

## 2. SOUSTRACTIONS
- **Facile** : 2 entiers (ex : 5 012 − 2 847)
- **Moyen** : 2 décimaux (ex : 952,48 − 399,25)
- **Difficile** : emprunts multiples sur zéros ou décimales différentes (ex : 1 000,00 − 387,65 / 84,3 − 27,856)

## 3. MULTIPLICATIONS
- **Facile** : nombre 3-4 chiffres × 1 chiffre (ex : 847 × 6)
- **Moyen** : décimal × décimal simple (ex : 67,90 × 3,58 / 245,5 × 2,4)
- **Difficile** : deux décimaux avec plusieurs chiffres (ex : 34,75 × 12,6)

## 4. DIVISIONS
- **Facile** : entier ÷ entier simple (ex : 846 ÷ 6)
- **Moyen** : décimal ÷ entier ou entier ÷ décimal (ex : 658,63 ÷ 12,7 / 892,50 ÷ 15)
- **Difficile** : décimal ÷ décimal (ex : 75,36 ÷ 3,14 / 1 243,8 ÷ 0,6)

## 5. ENCHAÎNEMENTS (DIFFICILE)
2-3 opérations avec priorités (ex : (45,3 + 12,7) × 3,5 / 1 200 − (350 × 2,5))

# DEUX MODES (alterner, environ 60% posé / 40% contexte)
- **"pose"** : opération brute (ex : "Calculez : 952,48 − 399,25")
- **"contexte"** : problème concret nécessitant l'opération (milieu hospitalier, courses, budget, recettes)

# RÈGLES
- SANS CALCULATRICE : faisable à la main en 2-4 min max, résultats exacts ou 2 décimales max
- NOMBRES RÉALISTES du concours FPC (entre 10 et 10 000, 0 à 3 décimales)
- PROGRESSION : environ 3 faciles, 4-5 moyens, 3 difficiles
- RÉPONSES : un nombre (entier ou décimal avec max 2 décimales)

${JSON_FORMAT.replace('NOM_FAMILLE', 'operations')}`,

  pourcentages: `Tu es un professeur de mathématiques spécialisé dans la préparation au concours FPC d'entrée en IFSI (concours infirmier pour la reconversion professionnelle).

Le document PDF ci-joint contient des annales réelles du concours. Inspire-toi en.

Génère un entraînement de 10 à 15 questions UNIQUEMENT sur les pourcentages et la proportionnalité.

# CATÉGORIES À COUVRIR (varier obligatoirement)

1. **Pourcentage simple** (FACILE) — Calculer X% d'un nombre.
   Ex : "Un service hospitalier de 80 lits a un taux d'occupation de 75%. Combien de lits sont occupés ?"

2. **Trouver le taux** (FACILE) — On donne la partie et le total, trouver le %.
   Ex : "Sur 250 patients admis aux urgences, 45 avaient plus de 75 ans. Quel pourcentage cela représente-t-il ?"

3. **Augmentation en %** (MOYEN) — Calculer une valeur après augmentation de X%.
   Ex : "Le loyer d'un appartement est de 650€. Il augmente de 3,5%. Quel est le nouveau loyer ?"

4. **Diminution / Remise en %** (MOYEN) — Calculer une valeur après diminution de X%.
   Ex : "Un article à 89€ bénéficie d'une remise de 15%. Quel est le prix après remise ?"

5. **Retrouver la valeur initiale** (DIFFICILE) — On connaît la valeur finale et le taux, retrouver la valeur de départ.
   Ex : "Après une augmentation de 20%, une production atteint 2 700 unités. Quelle était la production initiale ?"

6. **Pourcentages enchaînés** (DIFFICILE) — Deux augmentations/diminutions successives.
   Ex : "Un prix augmente de 10% puis diminue de 10%. Le prix final est-il identique au prix initial ?"

7. **Contexte médical / calcul de doses** (MOYEN à DIFFICILE) — Pourcentages appliqués au milieu médical.
   Ex : "Un médicament est dosé à 5%. Combien de mg de principe actif dans un flacon de 200 mL ?", "Le taux de mortalité d'une pathologie est de 2,3% sur 15 000 cas. Combien de décès ?"

# RÈGLES

- VARIER les contextes : milieu hospitalier, vie quotidienne (courses, loyer, salaire), santé publique, annales réelles
- PROGRESSION : environ 3 faciles, 4-5 moyens, 3 difficiles
- NOMBRES RÉALISTES du concours FPC : pas toujours des nombres ronds. Ex : 847 patients, 3,5%, 1 253€
- SANS CALCULATRICE : calculs faisables à la main en 2-3 min max, pas de décimaux infinis
- RÉPONSES : un nombre (entier ou max 2 décimales)

${JSON_FORMAT.replace('NOM_FAMILLE', 'pourcentages')}`,

  conversions: `Tu es un professeur de mathématiques spécialisé dans la préparation au concours FPC d'entrée en IFSI (concours infirmier pour la reconversion professionnelle).

Le document PDF ci-joint contient des annales réelles du concours. Inspire-toi en.

# CONTEXTE CONCOURS FPC
Au concours de Marseille 2024 : 1 h 25 = ? min / 1 735 kg = ? g / 269 cm³ = ? mL / 106 L = ? hL.
Les candidats perdent souvent des points par inattention ou oubli du tableau de conversion.

Génère un entraînement de 10 à 15 questions UNIQUEMENT sur les conversions d'unités.

# CATÉGORIES À COUVRIR (varier obligatoirement)

## 1. MASSES (très fréquent)
Tableau : t | q | kg | hg | dag | g | dg | cg | mg (chaque colonne = ×10)
- **Facile** : 3 250 g = ? kg / 1 735 kg = ? g / 500 mg = ? g
- **Moyen** : 2,45 kg = ? mg / 0,075 g = ? mg / 1 250 000 mg = ? kg
- **Difficile** : 0,003 kg = ? mg / 45 µg = ? mg / 2,5 t = ? g
Pièges : oublier que 1 kg = 1 000 g (pas 100), confusion mg/µg

## 2. VOLUMES ET CAPACITÉS (très fréquent)
Capacités : hL | daL | L | dL | cL | mL (chaque colonne = ×10)
Volumes : m³ | dm³ | cm³ | mm³ (chaque colonne = ×1000, car unités cubiques !)
Équivalence fondamentale : 1 L = 1 dm³ = 1 000 mL = 1 000 cm³ / 1 mL = 1 cm³
- **Facile** : 106 L = ? hL / 269 cm³ = ? mL / 750 mL = ? L
- **Moyen** : 0,5 hL = ? cL / 1,2 dm³ = ? mL / 0,35 L = ? cm³
- **Difficile** : 0,025 m³ = ? L / 750 000 mm³ = ? dm³
Pièges : oublier que m³→dm³→cm³ = ×1000 (pas ×10), ne pas connaître 1L = 1dm³

## 3. LONGUEURS
Tableau : km | hm | dam | m | dm | cm | mm
- **Facile** : 3,5 km = ? m / 250 cm = ? m
- **Moyen** : 0,045 km = ? cm / 1,25 m = ? mm
- **Difficile** : 0,0032 km = ? mm / 45 678 cm = ? km
Pièges : confondre dm (décimètre) et dam (décamètre)

## 4. DURÉES (très fréquent, système NON décimal !)
1 h = 60 min / 1 min = 60 s / 1 h = 3 600 s
PAS de tableau de conversion, on utilise ×60 ou ÷60.
- **Facile** : 1 h 25 = ? min / 180 s = ? min / 2 h 30 = ? min
- **Moyen** : 225 min = ? h ? min / 2,5 h = ? h ? min / durées de gardes
- **Difficile** : 5 000 s = ? h ? min ? s / 3h20 + 2h50 = ? / 8h10 − 5h45 = ?
Pièges : croire que 1,5 h = 1h50 (FAUX → 1h30) / croire que 1h25 = 1,25h (FAUX)

## 5. SURFACES (moins fréquent)
Tableau : km² | hm² | dam² | m² | dm² | cm² | mm² (chaque colonne = ×100, car unités carrées !)
- **Facile** : 48 m² = ? cm² / 5 m² = ? dm²
- **Moyen** : 2,5 m² = ? cm² / 350 000 cm² = ? m²
- **Difficile** : 0,004 km² = ? m²
Pièges : oublier que surfaces = ×100 par colonne (pas ×10)

## 6. CONVERSIONS MIXTES / CONTEXTUALISÉES (DIFFICILE)
Problèmes combinant conversion + calcul dans un contexte médical :
- "Un patient doit boire 1,5 L/jour. Combien de verres de 25 cL ?"
- "Une perfusion de 500 mL en 4h. Débit en mL/min ?"
- "Prescription de 0,75 g, comprimés de 500 mg. Combien de comprimés ?"

# DEUX MODES (alterner, 60% direct / 40% contexte)
- **"direct"** : conversion brute (ex : "Convertir 1 735 kg en grammes")
- **"contexte"** : problème médical/quotidien nécessitant une conversion

# RÈGLES
- SANS CALCULATRICE : faisable de tête ou avec tableau sur brouillon, résultats exacts
- NOMBRES RÉALISTES du concours FPC
- PROGRESSION : environ 3 faciles, 4-5 moyens, 3 difficiles
- RÉPONSES : un nombre exact, préciser l'unité attendue
- CONTEXTES MÉDICAUX à privilégier : doses (mg, g, mL), perfusions, poids patients, durées de soins/gardes

${JSON_FORMAT.replace('NOM_FAMILLE', 'conversions')}`,

  equations: `Tu es un professeur de mathématiques spécialisé dans la préparation au concours FPC d'entrée en IFSI (concours infirmier pour la reconversion professionnelle).

Le document PDF ci-joint contient des annales réelles du concours. Inspire-toi en.

# CONTEXTE CONCOURS FPC
Au concours FPC 2025, ces problèmes sont tombés :
- "Pierre et Paul sont frères. En additionnant leurs âges, on obtient l'âge de leur père. L'aîné Pierre a 4 ans de plus que son frère. Pierre est né quand son père avait son âge."
- "Paulette boit 1 500 mL d'eau/jour. Les packs = 6 bouteilles de 50 cL. Combien de packs pour janvier ?"
- "Une entreprise fabrique 2 700 gâteaux/semaine. Combien après une hausse de 20% ?" (Réunion 2024)
Ces problèmes testent la compréhension d'énoncé, l'extraction de données, la mise en équation et la résolution.

Génère un entraînement de 10 à 15 questions sur les équations et problèmes.

# CATÉGORIES À COUVRIR (varier obligatoirement, toucher au moins 4 catégories)

## 1. ÉQUATIONS SIMPLES (FACILE à MOYEN)
- **Facile** : x + 35 = 82 / 3x = 147 / x − 18 = 45
- **Moyen** : 2x + 15 = 63 / x/5 + 12 = 30 / 4x − 8 = 52
- **Difficile** : 3x + 7 = 2x + 25 / (x + 4) × 3 = 51 / 2(x − 5) + 3x = 40
Pièges : oublier de faire la même opération des deux côtés, se tromper de signe, oublier de distribuer les parenthèses

## 2. PROBLÈMES D'ÂGES (classique concours FPC)
- **Moyen** : "Marie a 3 fois l'âge de sa fille. Somme = 48 ans. Âge de chacune ?"
- **Moyen** : "Un père a 38 ans, son fils 10. Dans combien d'années le père aura le double de l'âge du fils ?"
- **Difficile** : type concours 2025 avec "est né quand son père avait son âge"
Pièges : ne pas savoir traduire "est né quand X avait son âge" (= âge du père = 2× âge de Pierre)

## 3. PROPORTIONNALITÉ ET PRODUIT EN CROIX (FACILE à MOYEN)
- **Facile** : "200g de farine → 10 crêpes. Combien pour 25 crêpes ?"
- **Moyen** : "Médicament 15 mg/kg, patient 72 kg. Quelle dose ?" / "1500 mL/jour, packs de 6×50cL, combien pour janvier ?"
- **Difficile** : dilutions, trajets avec conversion temps
Pièges : inverser le produit en croix, oublier les conversions d'unités

## 4. PROBLÈMES À PLUSIEURS ÉTAPES (MOYEN à DIFFICILE)
- **Moyen** : "28 lits, taux 75%, coût 350€/jour/patient. Coût total ?"
- **Difficile** : "Loyer 1200€, augmentation 7%, prix pour 2 semaines en février ?" (Douai 2024)
- **Difficile** : commande avec remise sur total
Pièges : vouloir tout calculer d'un coup, oublier une étape

## 5. RÉPARTITION ET PARTAGE (MOYEN)
- "3 infirmières se partagent 24 patients : l'une en prend 2× plus, la 3ème autant que la 2ème"
- "Budget 500€ réparti : 40% médicaments, 35% matériel, reste divers"
- "180 patients répartis proportionnellement aux lits (45 et 30)"
Pièges : ne pas poser x = la part de base

## 6. VITESSE, DISTANCE, TEMPS (MOYEN à DIFFICILE)
- **Moyen** : "84 km en 1h10. Vitesse moyenne ?" / "60 km/h, 45 km, combien de temps ?"
- **Difficile** : "Aller 30 km à 40 km/h, retour à 60 km/h. Vitesse moyenne ?"
Pièges : croire que V moyenne = (V1+V2)/2 (FAUX), oublier de convertir min→h

## 7. CALCULS DE DOSES ET DÉBITS (MOYEN à DIFFICILE, spécifique médical)
- **Moyen** : "15 mg/kg, patient 72 kg" / "Flacon 200 mL à 5%, combien de mg ?"
- **Difficile** : "Perfusion 500 mL en 4h, perfuseur 20 gtt/mL → débit en gtt/min ?"
- **Difficile** : "1,2 g/jour en 3 prises, comprimés de 400 mg → combien par prise ?"
Formule débit : Débit(gtt/min) = Volume(mL) × gtt/mL ÷ Temps(min)
Pièges : confondre g/mg, oublier que 5% = 5g pour 100mL

## 8. BUDGET ET ACHATS (FACILE à MOYEN)
- **Facile** : "7 livres à 14,50€, paye 15,35€ par carte. Combien par chèque ?"
- **Moyen** : "12 boîtes à 8,75€ + 5 boîtes à 12,40€ + livraison 15€. Total ?"
Pièges : oublier les frais annexes, mal calculer une remise

# RÈGLES
- SANS CALCULATRICE : résultats exacts ou max 2 décimales, nombres qui "tombent juste"
- ÉNONCÉS COMPLETS : toutes les données nécessaires fournies
- 80% contextualisés (hôpital, vie quotidienne, professionnel, santé publique)
- PROGRESSION : environ 3 faciles, 4-5 moyens, 3 difficiles
- RÉPONSES : un nombre (entier ou décimal max 2 chiffres)

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

      const raw = await callGeminiWithPdf(prompt)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Erreur de format. Réessayez.' }, { status: 500 })
      }
      const sujetData = JSON.parse(jsonMatch[0])
      return NextResponse.json({ sujet: sujetData })
    }

    if (action === 'corriger') {
      if (!exercices || !reponses) {
        return NextResponse.json({ error: 'Exercices et réponses requis.' }, { status: 400 })
      }

      const questionsFormatted = exercices.map((q, i) => `Question ${q.id} : "${q.question}" (Réponse attendue : ${q.reponse}) → Réponse du candidat : "${reponses[q.id] || '(vide)'}"`).join('\n')

      const prompt = `Tu es un professeur de mathématiques bienveillant. Tu corriges les réponses d'un candidat au concours IFSI FPC.

QUESTIONS ET RÉPONSES :
${questionsFormatted}

Pour CHAQUE question, indique si la réponse est correcte ou incorrecte, et donne une explication détaillée en HTML (utilise <br/>, <strong>, <em>) de la méthode de résolution étape par étape. Sois pédagogue.

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
      "explication": "Explication détaillée en HTML avec <br/>, <strong>, <em>"
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
