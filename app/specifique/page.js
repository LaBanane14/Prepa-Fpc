'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Home, TrendingUp, RotateCcw, UserRound, BadgeCheck, LogOut, Stethoscope, Target, BookOpen, Sparkles, ClipboardCheck, Sigma, Percent, ArrowLeftRight, Equal, ArrowRight } from 'lucide-react'

const sidebarItems = [
  { id: 'dashboard', label: 'Accueil', href: '/dashboard', icon: Home },
  { id: 'progression', label: 'Mes stats', href: '/dashboard?tab=progression', icon: TrendingUp },
  { id: 'historique', label: 'Historique', href: '/dashboard?tab=historique', icon: RotateCcw },
  { id: 'profil', label: 'Compte', href: '/dashboard?tab=profil', icon: UserRound },
  { id: 'abonnement', label: 'Devenir Premium', href: '/dashboard?tab=abonnement', icon: BadgeCheck, premium: true }
]

const familles = [
  {
    id: 'operations',
    titre: 'Produit en croix',
    description: 'Calculs de doses, débits de perfusion, recettes, approvisionnement — la proportionnalité du concours FPC.',
    icon: Sigma,
    color: 'blue',
    textColor: 'text-blue-600',
    bgIconColor: 'bg-blue-100',
    hoverShadow: 'hover:shadow-blue-500/20',
    borderColor: 'group-hover:border-blue-500/50',
    gradient: 'from-blue-400 to-blue-600'
  },
  {
    id: 'pourcentages',
    titre: 'Pourcentages',
    description: 'Augmentations, remises, TVA, taux d\'intérêt, contextes santé — tous les types de pourcentages du concours.',
    icon: Percent,
    color: 'blue',
    textColor: 'text-sky-600',
    bgIconColor: 'bg-sky-100',
    hoverShadow: 'hover:shadow-sky-500/20',
    borderColor: 'group-hover:border-sky-500/50',
    gradient: 'from-sky-400 to-blue-500'
  },
  {
    id: 'conversions',
    titre: 'Conversions & opérations',
    description: 'Masses (µg, mg, g), volumes, durées, fractions, IMC et opérations avec décimaux.',
    icon: ArrowLeftRight,
    color: 'blue',
    textColor: 'text-indigo-600',
    bgIconColor: 'bg-indigo-100',
    hoverShadow: 'hover:shadow-indigo-500/20',
    borderColor: 'group-hover:border-indigo-500/50',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'equations',
    titre: 'Équations et problèmes',
    description: 'Problèmes d\'âges, moyennes, vitesse, répartitions, achats — les classiques du concours FPC.',
    icon: Equal,
    color: 'blue',
    textColor: 'text-violet-600',
    bgIconColor: 'bg-violet-100',
    hoverShadow: 'hover:shadow-violet-500/20',
    borderColor: 'group-hover:border-violet-500/50',
    gradient: 'from-indigo-500 to-violet-600'
  }
]

const colorMap = {
  operations: { text: 'text-sky-600', iconBg: 'bg-sky-100', gradient: 'from-sky-400 to-sky-600', badge: 'bg-sky-50 text-sky-600', wrapper: 'bg-sky-100/60', progressBar: 'bg-sky-500', ring: 'focus:ring-sky-300 focus:border-sky-400' },
  conversions: { text: 'text-blue-600', iconBg: 'bg-blue-100', gradient: 'from-blue-500 to-blue-600', badge: 'bg-blue-50 text-blue-600', wrapper: 'bg-blue-100/60', progressBar: 'bg-blue-600', ring: 'focus:ring-blue-300 focus:border-blue-400' },
  pourcentages: { text: 'text-purple-600', iconBg: 'bg-purple-100', gradient: 'from-purple-500 to-purple-600', badge: 'bg-purple-50 text-purple-600', wrapper: 'bg-purple-100/60', progressBar: 'bg-purple-600', ring: 'focus:ring-purple-300 focus:border-purple-400' },
  equations: { text: 'text-fuchsia-600', iconBg: 'bg-fuchsia-100', gradient: 'from-fuchsia-500 to-fuchsia-600', badge: 'bg-fuchsia-50 text-fuchsia-600', wrapper: 'bg-fuchsia-100/60', progressBar: 'bg-fuchsia-500', ring: 'focus:ring-fuchsia-300 focus:border-fuchsia-400' }
}

export default function SpecifiquePage() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [step, setStep] = useState('choix') // null, choix, epreuve, correcting, resultat
  const [selectedFamille, setSelectedFamille] = useState(null)
  const [sujet, setSujet] = useState(null)
  const [error, setError] = useState('')
  const [loadingFamille, setLoadingFamille] = useState(null)
  const [correction, setCorrection] = useState(null)
  const [streamingDone, setStreamingDone] = useState(false)

  // Question par question
  const [current, setCurrent] = useState(0)
  const [reponses, setReponses] = useState({})
  const [validated, setValidated] = useState({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth'; return }
      setUser(session.user)
      setAuthLoading(false)
      const skipPopup = localStorage.getItem('specifique_skip_info') === 'true'
      if (!skipPopup) {
        setShowInfoPopup(true)
        setStep(null)
      }
    })
  }, [])

  async function startExercice(famille) {
    setSelectedFamille(famille)
    setLoadingFamille(famille.id)
    setStep('loading')
    setError('')
    setSujet({ questions: [] })
    setReponses({})
    setValidated({})
    setCurrent(0)
    setStreamingDone(false)

    try {
      const res = await fetch('/api/specifique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generer', famille: famille.id })
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Erreur lors de la génération.')
        setLoadingFamille(null)
        setStep('choix')
        return
      }
      setSujet(data.sujet)
      setStreamingDone(true)
      setLoadingFamille(null)
      setStep('epreuve')
    } catch (err) {
      setError('Erreur de connexion. Réessayez.')
      setLoadingFamille(null)
      setStep('choix')
    }
  }

  function validateCurrent() {
    if (!data) return
    // Extraire uniquement la partie numérique des réponses
    const normalize = (val) => {
      let s = String(val).trim().replace(/,/g, '.').replace(/\s/g, '')
      // Extraire le dernier nombre (le résultat final si l'élève écrit son raisonnement)
      const matches = s.match(/-?\d+\.?\d*/g)
      return matches ? parseFloat(matches[matches.length - 1]) : NaN
    }
    const userNum = normalize(reponses[data.id] || '')
    const expectedNum = normalize(data.reponse)
    // Comparaison numérique avec tolérance pour les arrondis
    const isCorrect = !isNaN(userNum) && !isNaN(expectedNum) && Math.abs(userNum - expectedNum) < 0.01
    setValidated(prev => ({ ...prev, [data.id]: { correct: isCorrect, reponse_attendue: data.reponse, explication: data.explication || '' } }))
  }

  function goNext() {
    if (sujet && current < sujet.questions.length - 1) setCurrent(current + 1)
  }

  function goPrev() {
    if (current > 0) setCurrent(current - 1)
  }

  async function handleSubmitAll() {
    const totalQuestions = sujet.questions.length
    const correctCount = Object.values(validated).filter(v => v.correct).length
    setCorrection({ note: correctCount, noteMax: totalQuestions })
    await supabase.from('historique').insert({
      user_id: user.id,
      type: 'Spécifique',
      label: selectedFamille.titre,
      note: correctCount,
      note_max: totalQuestions,
      nb_questions: totalQuestions,
      duration_minutes: null,
    })
    setStep('resultat')
  }

  function restart() {
    setStep('choix'); setSujet(null); setReponses({}); setValidated({}); setError(''); setLoadingFamille(null); setSelectedFamille(null); setCurrent(0); setCorrection(null)
  }

  function retryFamille() {
    if (selectedFamille) startExercice(selectedFamille)
    else restart()
  }

  async function handleLogout() { await supabase.auth.signOut(); window.location.href = '/' }

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || ''
  const isPremium = false
  const c = selectedFamille ? colorMap[selectedFamille.id] : colorMap.operations
  const data = sujet?.questions?.[current]
  const progress = sujet ? ((current + 1) / sujet.questions.length) * 100 : 0
  const answeredCount = sujet ? sujet.questions.filter(q => reponses[q.id]?.trim()).length : 0

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex" style={{backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px', fontFamily: "'Nunito', sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-stagger { opacity: 0; transform: translateY(20px); animation: staggerIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes staggerIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes premiumScan { 0%, 80% { opacity: 1; } 85% { opacity: 0.4; transform: scale(1.15); } 90% { opacity: 1; transform: scale(1); filter: brightness(1.5); } 95% { filter: brightness(1); } 100% { opacity: 1; } }
        .premium-scan { animation: premiumScan 5s ease-in-out infinite; }
      `}</style>

      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-50 flex items-center pl-3 py-5 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <aside className="w-[72px] bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200/60 flex flex-col items-center py-5 h-[calc(100vh-2.5rem)]" style={{fontFamily: "'Nunito', sans-serif"}}>
          <a href="/" className="mb-4"><div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform"><Stethoscope size={20} strokeWidth={2.5} /></div></a>
          <div className="w-7 h-px bg-slate-200 mb-3"></div>
          <nav className="flex-1 flex flex-col items-center gap-0.5 w-full px-1.5">
            {sidebarItems.filter(item => !item.premium || !isPremium).map(item => (
              <a key={item.id} href={item.href} className={`w-full flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[11px] font-bold transition-all text-center group ${item.premium ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-600' : 'text-slate-900 hover:bg-blue-50 hover:text-blue-600'}`}>
                <item.icon size={21} strokeWidth={1.6} className={`transition-transform duration-200 group-hover:scale-125 ${item.premium ? 'premium-scan' : ''}`} />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
          <div className="flex flex-col items-center gap-2 mt-auto pt-3">
            <div className="w-7 h-px bg-slate-200 mb-1"></div>
            <a href="/dashboard?tab=profil" className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition">{firstName.charAt(0).toUpperCase()}</a>
            <button onClick={handleLogout} className="text-slate-900 hover:text-red-500 transition cursor-pointer p-1">
              <LogOut size={16} strokeWidth={1.8} />
            </button>
          </div>
        </aside>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-[90px]">
        <header className="lg:hidden h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg></button>
          <span className="font-black text-lg text-slate-900">Prépa <span className="text-red-600">FPC</span></span>
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">{firstName.charAt(0).toUpperCase()}</div>
        </header>

        <main className="flex-grow w-full mx-auto px-4 py-4 sm:py-5">

      {/* ===== POPUP INFO ===== */}
      {showInfoPopup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setShowInfoPopup(false); window.location.href = '/dashboard' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-900 px-6 py-5 relative">
              <button onClick={() => { setShowInfoPopup(false); window.location.href = '/dashboard' }} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 text-white transition cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              <h2 className="text-lg font-black text-white pr-8">Entraînement spécifique</h2>
              <p className="text-slate-400 text-sm font-medium mt-1">Avant de commencer, voici le déroulement de l'épreuve.</p>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                {[
                  { icon: <Target size={18} strokeWidth={2} />, title: 'Choisissez votre famille', text: 'Opérations, pourcentages, conversions ou équations : travaillez vos points faibles.' },
                  { icon: <BookOpen size={18} strokeWidth={2} />, title: '10-15 questions par session', text: 'Des exercices ciblés, sans calculatrice, pour progresser efficacement.' },
                  { icon: <Sparkles size={18} strokeWidth={2} />, title: 'Exercices générés par notre IA', text: 'Des exercices spécifiques et ciblées pour progresser rapidement !' },
                  { icon: <ClipboardCheck size={18} strokeWidth={2} />, title: 'Correction détaillée', text: 'Chaque réponse est corrigée avec une explication pas à pas pour comprendre la méthode.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => { if (dontShowAgain) localStorage.setItem('specifique_skip_info', 'true'); setShowInfoPopup(false); setStep('choix') }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-blue-200/50 text-sm flex items-center justify-center gap-2 cursor-pointer mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                C'est parti !
              </button>
              <label className="flex items-center gap-2 cursor-pointer justify-center">
                <input type="checkbox" checked={dontShowAgain} onChange={e => setDontShowAgain(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                <span className="text-xs text-slate-400 font-medium">Ne plus afficher ce message</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ===== CHOIX FAMILLE (Constellation) ===== */}
      {step === 'choix' && (() => {
        const constellationData = [
          { ...familles[0], top: '22%', left: '-8%', colorTheme: 'text-white border-sky-400 bg-sky-500', glowTheme: 'shadow-[0_0_60px_rgba(14,165,233,0.7)]', lineColor: '#0ea5e9', tooltipClass: 'top-full mt-6 left-1/2 -translate-x-1/2', labelColor: 'text-sky-700' },
          { ...familles[2], top: '82%', left: '30%', colorTheme: 'text-white border-blue-400 bg-blue-600', glowTheme: 'shadow-[0_0_60px_rgba(59,130,246,0.7)]', lineColor: '#3b82f6', tooltipClass: 'right-full mr-10 top-0 -translate-y-full', labelColor: 'text-blue-700' },
          { ...familles[1], top: '34%', left: '58%', colorTheme: 'text-white border-purple-400 bg-purple-600', glowTheme: 'shadow-[0_0_60px_rgba(147,51,234,0.7)]', lineColor: '#9333ea', tooltipClass: 'bottom-0 left-full ml-10 -translate-y-full', labelColor: 'text-purple-700' },
          { ...familles[3], top: '72%', left: '97%', colorTheme: 'text-white border-fuchsia-400 bg-fuchsia-600', glowTheme: 'shadow-[0_0_60px_rgba(192,38,211,0.7)]', lineColor: '#c026d3', tooltipClass: 'bottom-full mb-12 left-1/2 -translate-x-1/2', labelColor: 'text-fuchsia-700' }
        ]
        const edges = [
          { source: 0, target: 1 },
          { source: 1, target: 2 },
          { source: 2, target: 3 }
        ]
        return (
        <div className="animate-fade-in h-[calc(100vh-4rem)] flex items-center justify-center relative overflow-hidden" style={{fontFamily: "'Nunito', sans-serif"}}>

          <a href="/dashboard" className="absolute top-4 right-4 bg-slate-900 hover:bg-black text-white font-bold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 z-30 shadow-lg">
            Quitter l&apos;exercice
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </a>

          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2 z-30">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}

          {/* Titre */}
          <div className="absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 text-center z-20 pointer-events-none">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Choisissez votre entraînement</h1>
          </div>

          {/* Constellation avec parallaxe */}
          <div className="relative w-full max-w-4xl aspect-square md:aspect-video">

            {/* Lignes SVG avec flux lumineux */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                {edges.map((edge, i) => {
                  const s = constellationData[edge.source]
                  const t = constellationData[edge.target]
                  return (
                    <linearGradient key={`grad-${i}`} id={`flow-grad-${i}`} x1={s.left} y1={s.top} x2={t.left} y2={t.top} gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor={s.lineColor} />
                      <stop offset="100%" stopColor={t.lineColor} />
                    </linearGradient>
                  )
                })}
              </defs>
              {/* Lignes de base */}
              {edges.map((edge, i) => {
                const s = constellationData[edge.source]
                const t = constellationData[edge.target]
                return <line key={i} x1={s.left} y1={s.top} x2={t.left} y2={t.top} stroke={`url(#flow-grad-${i})`} strokeWidth="1.5" strokeOpacity={hoveredIndex !== null ? '0' : '0.15'} className="transition-all duration-300" />
              })}
              {/* Un seul point qui traverse tout le chemin */}
              {(() => {
                const pts = constellationData
                const xVals = pts.map(p => p.left).join(';')
                const yVals = pts.map(p => p.top).join(';')
                const colorVals = pts.map(p => p.lineColor).join(';')
                const totalDur = '8s'
                return (
                  <g style={{opacity: hoveredIndex !== null ? 0 : 1, transition: 'opacity 0.3s'}}>
                    <filter id="pulse-glow" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    {/* Halo */}
                    <circle r="12" opacity="0.2" filter="url(#pulse-glow)">
                      <animate attributeName="cx" values={xVals} dur={totalDur} repeatCount="indefinite" calcMode="linear" />
                      <animate attributeName="cy" values={yVals} dur={totalDur} repeatCount="indefinite" calcMode="linear" />
                      <animate attributeName="fill" values={colorVals} dur={totalDur} repeatCount="indefinite" calcMode="linear" />
                      <animate attributeName="r" values="10;16;10;16;10;16;10;16;10" dur="0.8s" repeatCount="indefinite" />
                    </circle>
                    {/* Point central */}
                    <circle r="5" opacity="0.9">
                      <animate attributeName="cx" values={xVals} dur={totalDur} repeatCount="indefinite" calcMode="linear" />
                      <animate attributeName="cy" values={yVals} dur={totalDur} repeatCount="indefinite" calcMode="linear" />
                      <animate attributeName="fill" values={colorVals} dur={totalDur} repeatCount="indefinite" calcMode="linear" />
                      <animate attributeName="r" values="4;7;4;7;4;7;4;7;4" dur="0.8s" repeatCount="indefinite" />
                    </circle>
                  </g>
                )
              })()}
            </svg>

            {/* Noeuds de compétences */}
            {constellationData.map((cat, idx) => {
              const Icon = cat.icon
              const isHovered = hoveredIndex === idx
              const isDimmed = hoveredIndex !== null && hoveredIndex !== idx
              const isLoading = loadingFamille === cat.id
              return (
                <div key={cat.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group" style={{top: cat.top, left: cat.left}} onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
                  <button
                    onClick={() => !loadingFamille && startExercice(cat)}
                    disabled={!!loadingFamille}
                    className={`relative w-22 h-22 md:w-28 md:h-28 flex items-center justify-center border-2 transition-all duration-500 cursor-pointer ${cat.colorTheme} ${isHovered ? `scale-125 ${cat.glowTheme}` : 'scale-100 hover:scale-110 shadow-lg'} ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100'} `}
                    style={{borderRadius: ['60% 40% 30% 70% / 60% 30% 70% 40%', '40% 60% 70% 30% / 50% 60% 40% 50%', '70% 30% 50% 50% / 30% 50% 50% 70%', '50% 50% 30% 70% / 40% 70% 30% 60%'][idx]}}
                  >
                    {isLoading ? (
                      <div className="w-8 h-8 rounded-full animate-spin" style={{borderWidth: '3px', borderStyle: 'solid', borderColor: 'currentColor', borderTopColor: 'transparent'}}></div>
                    ) : (
                      <Icon size={32} className="transition-transform duration-300 md:w-9 md:h-9" strokeWidth={isHovered ? 2.5 : 1.5} />
                    )}
                    <div className="absolute inset-3 border border-dashed border-white/40" style={{borderRadius: 'inherit'}} />
                  </button>

                  {/* Tooltip au survol */}
                  <div className={`absolute ${cat.tooltipClass} w-64 md:w-72 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xl pointer-events-none transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
                    <h3 className={`text-lg font-black mb-2 text-center ${cat.labelColor}`}>{cat.titre}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed text-center">{cat.description}</p>
                  </div>

                  {/* Label sous le noeud */}
                  <div className={`absolute ${idx === 0 || idx === 2 ? 'bottom-full mb-4' : 'top-full mt-4'} left-1/2 -translate-x-1/2 whitespace-nowrap text-center transition-opacity duration-300 ${isHovered || isDimmed ? 'opacity-0' : 'opacity-70'}`}>
                    <span className={`text-base font-black tracking-wide ${cat.labelColor}`}>{cat.titre}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        )
      })()}

      {/* ===== LOADING ===== */}
      {step === 'loading' && selectedFamille && (
        <div className="fixed inset-0 z-40 lg:pl-[90px] flex items-center justify-center bg-slate-100/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
              <div className={`absolute inset-0 rounded-full border-4 border-transparent ${colorMap[selectedFamille.id]?.text === 'text-sky-600' ? 'border-t-sky-500' : colorMap[selectedFamille.id]?.text === 'text-blue-600' ? 'border-t-blue-600' : colorMap[selectedFamille.id]?.text === 'text-purple-600' ? 'border-t-purple-600' : 'border-t-fuchsia-600'}`} style={{animation: 'spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite'}}></div>
            </div>
            <div className="text-center">
              <p className="text-slate-700 font-black text-base">Génération des exercices...</p>
              <p className="text-slate-400 font-medium text-sm mt-1">Encore quelques secondes</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== ÉPREUVE ===== */}
      {step === 'epreuve' && sujet && data && selectedFamille && (
        <div className={`fixed inset-0 z-40 lg:pl-[90px] ${c.wrapper} overflow-y-auto`}>
          <div className="flex items-center justify-between p-4">
            <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight" style={{fontFamily: "'Nunito', sans-serif"}}>Entraînement spécifique <span className={c.text}>— {selectedFamille.titre}</span></h1>
            <a href="/dashboard" className="bg-slate-900 hover:bg-black text-white font-bold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shrink-0 ml-4">
              Quitter l&apos;exercice
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </a>
          </div>
          <div className="w-full max-w-2xl mx-auto px-4 pb-8">
            <div className="rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-6">
              <div className="bg-white rounded-xl sm:rounded-[2rem] shadow-xl flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="relative flex flex-wrap justify-between items-center p-3 sm:p-5 border-b border-slate-100 gap-2">
                  <span className="text-slate-600 font-bold text-xs sm:text-sm tracking-wide">Question {current + 1}/{sujet.questions.length}</span>
                  <span className={`${c.badge} px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide uppercase`}>{selectedFamille.titre}</span>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50">
                    <div className={`h-full ${c.progressBar} transition-all duration-500`} style={{width: `${progress}%`}}></div>
                  </div>
                </div>

                {/* Question + input + résultat */}
                <div className="p-4 sm:p-6 flex-grow">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-5 leading-relaxed">{data.question}</h2>
                  <input
                    type="text"
                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 ${c.ring} transition placeholder:text-slate-400 ${validated[data.id] ? 'opacity-60 pointer-events-none' : ''}`}
                    placeholder="Votre réponse..."
                    value={reponses[data.id] || ''}
                    onChange={(e) => setReponses(prev => ({ ...prev, [data.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (!validated[data.id]) validateCurrent(); else if (current < sujet.questions.length - 1) goNext() } }}
                    disabled={!!validated[data.id]}
                  />

                  {/* Résultat après validation */}
                  {validated[data.id] && (
                    <div className={`mt-4 rounded-xl border overflow-hidden ${validated[data.id].correct ? 'border-green-200' : 'border-red-200'}`}>
                      <div className={`flex items-center justify-between px-4 py-2.5 ${validated[data.id].correct ? 'bg-green-500' : 'bg-red-500'}`}>
                        <div className="flex items-center gap-2">
                          {validated[data.id].correct ? (
                            <><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg><span className="text-white font-black text-sm">Correct</span></>
                          ) : (
                            <><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg><span className="text-white font-black text-sm">Incorrect</span></>
                          )}
                        </div>
                        <span className="text-white/90 font-bold text-sm">Réponse : {validated[data.id].reponse_attendue}</span>
                      </div>
                      {validated[data.id].explication && (
                        <div className={`px-4 py-3 ${validated[data.id].correct ? 'bg-green-50' : 'bg-red-50'}`}>
                          {validated[data.id].explication.split(/\s*\|\s*/).map((step, i) => (
                            <p key={i} className="text-sm text-slate-700 font-medium py-0.5">{step}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 sm:p-5 pt-0 flex gap-3">
                  {current > 0 && (
                    <button onClick={goPrev} className="bg-slate-100 text-slate-700 font-bold py-3 px-4 sm:px-5 rounded-xl transition-colors hover:bg-slate-200 flex items-center justify-center gap-2 text-sm cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7-7 7 7 7"/></svg>
                      <span className="hidden sm:inline">Précédent</span>
                    </button>
                  )}
                  {!validated[data.id] ? (
                    <button onClick={validateCurrent} className={`flex-grow bg-gradient-to-r ${c.gradient} text-white font-bold py-3 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer`}>
                      Valider <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </button>
                  ) : current < sujet.questions.length - 1 ? (
                    <button onClick={goNext} className="flex-grow bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-colors hover:bg-black flex items-center justify-center gap-2 text-sm sm:text-base shadow-md cursor-pointer">
                      Question suivante <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </button>
                  ) : !streamingDone ? (
                    <div className="flex-grow flex items-center justify-center gap-2 py-3 text-slate-400 text-sm font-bold">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Chargement des questions...
                    </div>
                  ) : (
                    <button onClick={handleSubmitAll} className={`flex-grow bg-gradient-to-r ${c.gradient} text-white font-bold py-3 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer`}>
                      Voir mes résultats ({Object.keys(validated).length}/{sujet.questions.length})
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation rapide */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {sujet.questions.map((q, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`w-8 h-8 rounded-lg font-bold text-xs transition cursor-pointer ${i === current ? 'bg-slate-900 text-white' : validated[q.id] ? (validated[q.id].correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : reponses[q.id]?.trim() ? `${c.iconBg} ${c.text}` : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== RÉSULTATS ===== */}
      {step === 'resultat' && correction && selectedFamille && (
        <div className="fixed inset-0 z-40 lg:pl-[90px] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 sm:p-12 max-w-md w-full text-center">
            <span className={`${c.badge} px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase`}>{selectedFamille.titre}</span>
            <div className="flex justify-center items-center my-5">
              <span className={`text-6xl sm:text-7xl font-black ${c.text} tracking-tighter`}>{correction.note}</span>
              <span className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tighter">/{correction.noteMax}</span>
            </div>
            <p className="text-slate-400 text-sm font-bold mb-8">Ne compte pas dans la moyenne</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={retryFamille} className={`bg-gradient-to-r ${c.gradient} text-white font-bold py-3 px-5 rounded-xl transition shadow-lg text-sm flex items-center gap-2 cursor-pointer`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                Recommencer
              </button>
              <a href="/dashboard" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-5 rounded-xl transition text-sm">Dashboard</a>
            </div>
          </div>
        </div>
      )}

        </main>
      </div>
    </div>
  )
}
