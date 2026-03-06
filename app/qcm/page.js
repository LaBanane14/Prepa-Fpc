'use client'
import React, { useState, useEffect } from 'react'

const quizData = [
  { category: "Calcul de dose", question: "Vous devez préparer 1,5g de Clamoxyl. Vous disposez de flacons de 500mg à diluer dans 5ml. Combien de ml prélevez-vous ?", options: ["5 ml", "10 ml", "15 ml", "20 ml"], correct: 2, explanation: "Conversion : 1,5 g = 1500 mg<br/><br/>Si 500 mg → 5 ml<br/>Alors 1500 mg → <strong>x</strong> ml<br/><br/>Calcul : <strong>(1500 × 5) / 500 = 15 ml</strong><br/><br/><em>Astuce : 1500 est le triple de 500, donc 3 × 5 ml = 15 ml</em>" },
  { category: "Calcul de dose", question: "Vous devez passer 1 litre de soluté physiologique en 8 heures. Quel est le débit en gouttes/minute ? (1 ml = 20 gouttes)", options: ["35 gouttes/min", "42 gouttes/min", "50 gouttes/min", "60 gouttes/min"], correct: 1, explanation: "Volume : 1 L = 1000 ml<br/>En gouttes : 1000 × 20 = 20 000 gouttes<br/>Temps : 8h × 60 = 480 minutes<br/><br/>Débit = Volume / Temps<br/>Débit = <strong>20 000 / 480 ≈ 41,66</strong><br/><br/><em>On arrondit par excès à 42 gouttes/min.</em>" },
  { category: "Produit en croix", question: "Pour réaliser un pansement complexe, 3 infirmières mettent 45 minutes. Combien de temps mettrait 1 seule infirmière travaillant au même rythme ?", options: ["15 minutes", "90 minutes", "135 minutes", "105 minutes"], correct: 2, explanation: "<strong>Proportionnalité inverse</strong> : moins il y a d'infirmières, plus c'est long.<br/><br/>Si 3 infirmières mettent 45 minutes, 1 seule infirmière mettra 3 fois plus de temps.<br/><br/>Calcul : <strong>45 × 3 = 135 minutes</strong>." },
  { category: "Calcul de dose", question: "Un enfant de 12 kg doit recevoir un sirop antipyrétique à la posologie de 15 mg/kg/jour réparti en 3 prises. Le sirop est dosé à 10 mg/ml. Combien de ml par prise ?", options: ["2 ml", "4 ml", "6 ml", "8 ml"], correct: 2, explanation: "Dose totale/jour : 12 kg × 15 mg = 180 mg<br/>Dose par prise (3 prises) : 180 / 3 = <strong>60 mg</strong><br/><br/>Concentration : 10 mg → 1 ml<br/>Donc pour obtenir 60 mg : <strong>60 / 10 = 6 ml</strong>." },
  { category: "Pourcentage", question: "Le poids d'un patient est passé de 80 kg à 72 kg suite à un traitement diurétique. Quel est le pourcentage de perte de poids ?", options: ["8%", "10%", "12%", "15%"], correct: 1, explanation: "Perte de poids : 80 - 72 = <strong>8 kg</strong><br/><br/>Formule : (Perte / Poids initial) × 100<br/>Calcul : <strong>(8 / 80) × 100 = 10%</strong>" },
  { category: "Pourcentage", question: "Vous disposez d'un flacon de 500 ml de Glucosé à 5% (G5). Combien de grammes de glucose contient ce flacon ?", options: ["5 g", "25 g", "50 g", "2,5 g"], correct: 1, explanation: "G5 signifie : 5 g de glucose pour 100 ml.<br/><br/>Pour 500 ml (qui est 5 fois plus grand que 100 ml) :<br/>Calcul : <strong>5 g × 5 = 25 g</strong>." },
  { category: "Pourcentage", question: "Un service hospitalier compte 50 lits. Aujourd'hui, 42 lits sont occupés. Quel est le taux d'occupation du service ?", options: ["84%", "78%", "88%", "82%"], correct: 0, explanation: "Formule : (Lits occupés / Total lits) × 100<br/>Calcul : (42 / 50) × 100<br/><br/>Astuce : multiplier par 2 en haut et en bas pour ramener à 100 :<br/><strong>(42 × 2) / 100 = 84 / 100 = 84%</strong>." },
  { category: "Calcul mental", question: "Diviser une dose médicamenteuse par 0,25 revient à la :", options: ["Multiplier par 4", "Diviser par 4", "Multiplier par 2,5", "Soustraire de 25%"], correct: 0, explanation: "0,25 correspond à la fraction <strong>1/4</strong>.<br/><br/>Règle : diviser par une fraction revient à multiplier par son inverse.<br/>L'inverse de 1/4 est 4.<br/><br/>Donc diviser par 0,25 = <strong>Multiplier par 4</strong>." },
  { category: "Calcul mental", question: "Calculez de tête : 1,5 x 0,6", options: ["0,09", "0,9", "9", "0,96"], correct: 1, explanation: "Astuce de calcul mental :<br/>1) On calcule sans les virgules : 15 × 6 = 90<br/>2) On compte les chiffres après la virgule : 1 pour 1,5 et 1 pour 0,6 (soit 2 au total).<br/><br/>3) On décale la virgule de 2 rangs vers la gauche : <strong>0,90 (soit 0,9)</strong>." },
  { category: "Calcul mental", question: "L'équipe de nuit utilise 0,8 litre de solution désinfectante par chambre. Combien de litres pour 15 chambres ?", options: ["10 litres", "12 litres", "14 litres", "15 litres"], correct: 1, explanation: "Calcul : 15 × 0,8<br/><br/>Astuce :<br/>15 × 1 = 15<br/>On soustrait 15 × 0,2 (qui fait 3)<br/><strong>15 - 3 = 12 litres</strong>." },
  { category: "Équation", question: "Résoudre l'équation suivante pour trouver la valeur de x : 5x - 7 = 18", options: ["x = 3", "x = 4", "x = 5", "x = 6"], correct: 2, explanation: "1) Isoler x :<br/>5x = 18 + 7<br/>5x = 25<br/><br/>2) Diviser par 5 :<br/>x = 25 / 5<br/><strong>x = 5</strong>" },
  { category: "Équation", question: "Résoudre : 3(x + 2) = 21", options: ["x = 5", "x = 7", "x = 9", "x = 15"], correct: 0, explanation: "1) Diviser par 3 des deux côtés :<br/>x + 2 = 21 / 3<br/>x + 2 = 7<br/><br/>2) Soustraire 2 :<br/>x = 7 - 2<br/><strong>x = 5</strong>" },
  { category: "Calcul de dose", question: "Prescription : Héparine 500 UI/h en seringue électrique. Flacon de 25 000 UI dans 50 ml de NaCl. Quel débit en ml/h ?", options: ["0,5 ml/h", "1 ml/h", "2 ml/h", "5 ml/h"], correct: 1, explanation: "Concentration : 25 000 UI dans 50 ml<br/>Soit 25 000 / 50 = <strong>500 UI par ml</strong>.<br/><br/>Pour 500 UI/h, il faut <strong>1 ml/h</strong>." },
  { category: "Conversion", question: "Convertir 0,075 g en milligrammes.", options: ["0,75 mg", "7,5 mg", "75 mg", "750 mg"], correct: 2, explanation: "1 g = 1000 mg<br/><br/>0,075 g × 1000 = <strong>75 mg</strong>.<br/><br/><em>Astuce : déplacer la virgule de 3 rangs vers la droite.</em>" },
  { category: "Calcul de dose", question: "Prescription de Doliprane 1g toutes les 6h. Quelle est la dose quotidienne totale ?", options: ["2 g", "3 g", "4 g", "6 g"], correct: 2, explanation: "24h / 6h = 4 prises par jour.<br/><br/>Dose totale : 4 × 1 g = <strong>4 g/jour</strong>.<br/><br/><em>Attention : la dose max de paracétamol est de 4g/jour chez l'adulte.</em>" },
  { category: "Pourcentage", question: "Un flacon de Bétadine contient 10% de povidone iodée. Combien de grammes dans un flacon de 250 ml ?", options: ["10 g", "25 g", "50 g", "100 g"], correct: 1, explanation: "10% signifie 10 g pour 100 ml.<br/><br/>Pour 250 ml : (10 × 250) / 100 = <strong>25 g</strong>." },
  { category: "Calcul de dose", question: "Un nourrisson de 8 kg doit recevoir du Nurofen à 10 mg/kg/prise. Le sirop est dosé à 20 mg/ml. Combien de ml par prise ?", options: ["2 ml", "4 ml", "6 ml", "8 ml"], correct: 1, explanation: "Dose par prise : 8 kg × 10 mg = 80 mg<br/><br/>Concentration : 20 mg → 1 ml<br/>Pour 80 mg : 80 / 20 = <strong>4 ml</strong>." },
  { category: "Produit en croix", question: "Si 250 ml de perfusion passent en 2h, combien de ml passent en 30 minutes ?", options: ["31,25 ml", "62,5 ml", "75 ml", "125 ml"], correct: 1, explanation: "2h = 120 minutes<br/><br/>Si 250 ml → 120 min<br/>Alors x ml → 30 min<br/><br/>x = (250 × 30) / 120 = 7500 / 120 = <strong>62,5 ml</strong>." },
  { category: "Conversion", question: "Convertir 2500 µg en milligrammes.", options: ["0,25 mg", "2,5 mg", "25 mg", "250 mg"], correct: 1, explanation: "1 mg = 1000 µg<br/><br/>2500 µg / 1000 = <strong>2,5 mg</strong>." },
  { category: "Calcul de dose", question: "Prescription : Morphine 0,1 mg/kg en IV pour un patient de 70 kg. Ampoule de 10 mg/ml. Combien de ml injectez-vous ?", options: ["0,7 ml", "1 ml", "3,5 ml", "7 ml"], correct: 0, explanation: "Dose : 0,1 × 70 = 7 mg<br/><br/>Ampoule : 10 mg dans 1 ml<br/>Pour 7 mg : 7 / 10 = <strong>0,7 ml</strong>." }
]

const letters = ['A', 'B', 'C', 'D']

const catColors = {
  "Calcul de dose": { badge: "bg-red-50 text-red-600", wrapper: "bg-red-100/60" },
  "Pourcentage": { badge: "bg-purple-50 text-purple-600", wrapper: "bg-purple-100/60" },
  "Produit en croix": { badge: "bg-amber-50 text-amber-600", wrapper: "bg-amber-100/60" },
  "Calcul mental": { badge: "bg-blue-50 text-blue-600", wrapper: "bg-blue-100/60" },
  "Équation": { badge: "bg-emerald-50 text-emerald-600", wrapper: "bg-emerald-100/60" },
  "Conversion": { badge: "bg-orange-50 text-orange-600", wrapper: "bg-orange-100/60" }
}

export default function QuizPage() {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState(new Array(quizData.length).fill(null))
  const [state, setState] = useState('questioning')
  const [showResults, setShowResults] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  const data = quizData[current]
  const hasAnswered = answers[current] !== null
  const progress = ((current + 1) / quizData.length) * 100
  const colors = catColors[data.category] || catColors["Calcul de dose"]

  function selectOption(index) {
    if (state !== 'questioning') return
    setSelected(index)
  }

  function validate() {
    if (selected === null) return
    const newAnswers = [...answers]
    newAnswers[current] = selected
    setAnswers(newAnswers)
    setState('answered')
  }

  function goNext() {
    if (current < quizData.length - 1) {
      setCurrent(current + 1)
      setSelected(null)
      setState(answers[current + 1] !== null ? 'answered' : 'questioning')
    } else {
      setShowResults(true)
    }
  }

  function goPrev() {
    if (current > 0) {
      setCurrent(current - 1)
      setSelected(answers[current - 1])
      setState(answers[current - 1] !== null ? 'answered' : 'questioning')
    }
  }

  function handleAction() {
    if (state === 'questioning') validate()
    else goNext()
  }

  const isCorrect = hasAnswered && answers[current] === data.correct

  if (showResults) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Nav />
        <main className="flex-grow flex items-center justify-center px-4 py-8 sm:py-12">
          <div className="max-w-2xl w-full bg-white rounded-2xl sm:rounded-[3rem] shadow-2xl p-8 sm:p-16 text-center border border-slate-100 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 ring-8 ring-red-50/50">
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-4 sm:mb-6 tracking-tight">Découvrez votre score !</h2>
              <p className="text-slate-600 mb-8 sm:mb-10 font-medium text-base sm:text-xl leading-relaxed">Félicitations pour avoir terminé ce test de 20 questions. Pour découvrir votre résultat, identifier vos points faibles et accéder aux corrections illimitées, créez un compte gratuitement.</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                <a href="/signup" className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-4 sm:py-5 px-8 sm:px-10 rounded-2xl transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 text-base sm:text-lg transform hover:-translate-y-1">
                  Créer mon compte gratuit <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg>
                </a>
                <a href="/login" className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-bold py-4 sm:py-5 px-8 sm:px-10 rounded-2xl transition-all flex items-center justify-center gap-3 text-base sm:text-lg transform hover:-translate-y-1">
                  Me connecter
                </a>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px'}}>
      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-200/40 rounded-full mix-blend-multiply blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-rose-200/40 rounded-full mix-blend-multiply blur-3xl"></div>
      </div>

      <Nav />

      {/* Remplacement du conteneur max-w-3xl par max-w-6xl pour permettre un affichage côte à côte */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 overflow-hidden">
        
        {/* Conteneur Flex pour afficher la question et la réponse côte à côte sur PC */}
        <div className={`flex flex-col lg:flex-row gap-6 lg:gap-8 items-start transition-all duration-500 ease-in-out ${hasAnswered ? 'justify-start' : 'justify-center'}`}>
          
          {/* QCM CARD - S'adapte en largeur si on a répondu */}
          <div className={`w-full ${hasAnswered ? 'lg:w-1/2' : 'lg:w-2/3 lg:max-w-3xl'} transition-all duration-500 ${colors.wrapper} rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-6 shadow-sm mt-2 sm:mt-4`}>
            <div className="bg-white rounded-xl sm:rounded-[2rem] shadow-xl flex flex-col overflow-hidden relative">
              {/* Header */}
              <div className="relative flex flex-wrap justify-between items-center p-3 sm:p-5 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="text-slate-600 font-bold text-xs sm:text-sm tracking-wide">Question {current + 1}/{quizData.length}</span>
                  <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2 sm:px-3 py-1 rounded-lg font-bold text-slate-700 text-xs">
                    <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span className="tabular-nums">{mins}:{secs}</span>
                  </div>
                </div>
                <span className={`${colors.badge} px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide uppercase transition-colors duration-300`}>{data.category}</span>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50">
                  <div className="h-full bg-slate-900 transition-all duration-500" style={{width: `${progress}%`}}></div>
                </div>
              </div>

              {/* Question */}
              <div className="p-4 sm:p-6 flex-grow">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-5 leading-relaxed">{data.question}</h2>
                <div className="space-y-2 sm:space-y-3">
                  {data.options.map((option, index) => {
                    let optClass = 'p-3 sm:p-4 border rounded-xl flex justify-between items-center group transition-all '
                    let letterClass = 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold flex items-center justify-center text-xs sm:text-sm shrink-0 transition-all '
                    let circleContent = null

                    if (hasAnswered) {
                      if (index === data.correct) {
                        optClass += 'border-green-500 bg-green-50 '
                        letterClass += 'bg-green-500 text-white '
                        circleContent = <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500 flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>
                      } else if (index === answers[current]) {
                        optClass += 'border-red-500 bg-red-50 '
                        letterClass += 'bg-red-500 text-white '
                        circleContent = <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></div>
                      } else {
                        optClass += 'border-slate-200 opacity-50 '
                        letterClass += 'bg-slate-100 text-slate-500 '
                        circleContent = <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-300"></div>
                      }
                    } else if (selected === index) {
                      optClass += 'border-slate-900 bg-slate-50 shadow-[0_0_0_4px_rgba(15,23,42,0.05)] cursor-pointer '
                      letterClass += 'bg-slate-900 text-white '
                      circleContent = <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-900 flex items-center justify-center"><div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-slate-900 rounded-full"></div></div>
                    } else {
                      optClass += 'border-slate-200 cursor-pointer hover:bg-slate-50 '
                      letterClass += 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 '
                      circleContent = <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-300"></div>
                    }

                    return (
                      <div key={index} className={optClass} onClick={() => !hasAnswered && selectOption(index)}>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <span className={letterClass}>{letters[index]}</span>
                          <span className="font-bold text-slate-800 text-sm sm:text-base">{option}</span>
                        </div>
                        {circleContent}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 sm:p-5 pt-0 flex gap-3">
                {current > 0 && (
                  <button onClick={goPrev} className="bg-slate-100 text-slate-700 font-bold py-3 px-4 sm:px-5 rounded-xl transition-colors hover:bg-slate-200 flex items-center justify-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7-7 7 7 7"/></svg>
                    <span className="hidden sm:inline">Précédent</span>
                  </button>
                )}
                <button onClick={handleAction} className={`flex-grow bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-colors hover:bg-black flex items-center justify-center gap-2 text-sm sm:text-base shadow-md ${state === 'questioning' && selected === null ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}>
                  {state === 'questioning' ? (
                    <>Valider ma réponse <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></>
                  ) : current === quizData.length - 1 ? (
                    <>Voir mes résultats <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg></>
                  ) : (
                    <>Question suivante <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg></>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* EXPLANATION - À droite sur les écrans larges (lg), en dessous sur mobile */}
          {hasAnswered && (
            <div className="w-full lg:w-1/2 animate-fade-in mt-2 sm:mt-4 lg:mt-8">
              <div className={`rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col border-2 transition-colors duration-300 ${isCorrect ? 'bg-green-50 border-green-400 text-green-900' : 'bg-red-50 border-red-400 text-red-900'}`}>
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                    {isCorrect ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    )}
                  </div>
                  <span className="text-lg sm:text-xl font-black">{isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse'}</span>
                </div>
                <div className="leading-relaxed font-medium text-slate-900 bg-white/60 p-3 sm:p-5 rounded-xl border border-white/40 shadow-sm text-sm sm:text-base" dangerouslySetInnerHTML={{__html: data.explanation}}></div>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 sm:gap-3">
          <div className="bg-red-600 text-white p-1.5 sm:p-2 rounded-xl shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
          </div>
          <div>
            <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-900 block leading-none">Prépa <span className="text-red-600">FPC</span></span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 tracking-widest uppercase">La passerelle IFSI</span>
          </div>
        </a>
        <div className="hidden md:flex items-center gap-8 font-semibold text-slate-600">
          <a href="/" className="hover:text-red-600 transition">Accueil</a>
          <a href="/calculs-doses.html" className="hover:text-red-600 transition">Calculs de doses</a>
          <a href="/blog.html" className="hover:text-red-600 transition">Blog</a>
          <a href="/tarifs.html" className="hover:text-red-600 transition">Tarifs</a>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <a href="/login" className="hidden md:block text-slate-600 font-bold hover:text-slate-900 transition text-sm">Connexion</a>
          <a href="/signup" className="hidden md:inline-flex bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-slate-200 transition transform hover:-translate-y-0.5 text-sm">Inscription</a>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-8 sm:py-12 text-sm mt-auto">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-white font-bold text-lg">Prépa FPC</h4>
          </div>
          <p className="max-w-xs leading-relaxed">La plateforme d'entraînement de référence pour la réussite du concours infirmier (Aides-Soignants et Auxiliaires de Puériculture).</p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Ressources IFSI</h4>
          <ul className="space-y-3">
            <li><a href="/blog.html" className="hover:text-white transition">Dates concours FPC</a></li>
            <li><a href="/blog.html" className="hover:text-white transition">Dossier Passerelle AS/AP</a></li>
            <li><a href="/calculs-doses.html" className="hover:text-white transition">Formules calculs de doses</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Légal</h4>
          <ul className="space-y-3">
            <li><a href="#" className="hover:text-white transition">Mentions légales</a></li>
            <li><a href="#" className="hover:text-white transition">CGV &amp; CGU</a></li>
            <li><a href="mailto:contact@prepa-fpc.fr" className="hover:text-white transition">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-8 sm:mt-12 pt-8 border-t border-slate-800 text-center">
        <p>&copy; 2026 Prépa FPC (passerelle-fpc.fr). Tous droits réservés.</p>
      </div>
    </footer>
  )
}