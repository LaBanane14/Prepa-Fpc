'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Home, TrendingUp, RotateCcw, UserRound, BadgeCheck, LogOut, Stethoscope, Target, BookOpen, Sparkles, ClipboardCheck } from 'lucide-react'

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
    titre: 'Opérations décimales',
    description: 'Additions, soustractions, multiplications et divisions de nombres décimaux sans calculatrice.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    color: 'blue'
  },
  {
    id: 'pourcentages',
    titre: 'Pourcentages et proportionnalité',
    description: 'Pourcentages, augmentations, remises et problèmes de proportionnalité.',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
    color: 'amber'
  },
  {
    id: 'conversions',
    titre: 'Conversions d\'unités',
    description: 'Heures, masses, volumes, surfaces : maîtrisez les tableaux de conversion.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-9L21 12m0 0-4.5 4.5M21 12H7.5"/></svg>,
    color: 'emerald'
  },
  {
    id: 'equations',
    titre: 'Équations et problèmes',
    description: 'Mise en équation et résolution de problèmes concrets de logique.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12h16"/><path d="M4 6h16"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/></svg>,
    color: 'purple'
  }
]

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', hoverBorder: 'hover:border-blue-400', iconBg: 'bg-blue-100', gradient: 'from-blue-500 to-blue-600', light: 'bg-blue-50', ring: 'focus:ring-blue-300 focus:border-blue-400', badge: 'bg-blue-100 text-blue-700' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', hoverBorder: 'hover:border-amber-400', iconBg: 'bg-amber-100', gradient: 'from-amber-500 to-amber-600', light: 'bg-amber-50', ring: 'focus:ring-amber-300 focus:border-amber-400', badge: 'bg-amber-100 text-amber-700' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', hoverBorder: 'hover:border-emerald-400', iconBg: 'bg-emerald-100', gradient: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50', ring: 'focus:ring-emerald-300 focus:border-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', hoverBorder: 'hover:border-purple-400', iconBg: 'bg-purple-100', gradient: 'from-purple-500 to-purple-600', light: 'bg-purple-50', ring: 'focus:ring-purple-300 focus:border-purple-400', badge: 'bg-purple-100 text-purple-700' }
}

export default function SpecifiquePage() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [step, setStep] = useState('choix') // choix, loading, epreuve, correcting, resultat
  const [selectedFamille, setSelectedFamille] = useState(null)
  const [sujet, setSujet] = useState(null)
  const [reponses, setReponses] = useState({})
  const [correction, setCorrection] = useState(null)
  const [error, setError] = useState('')
  const [loadingStep, setLoadingStep] = useState(0)
  const [correctingStep, setCorrectingStep] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth'; return }
      setUser(session.user)
      setAuthLoading(false)
      const skipPopup = localStorage.getItem('specifique_skip_info') === 'true'
      if (!skipPopup) {
        setShowInfoPopup(true)
      }
    })
  }, [])

  useEffect(() => {
    if (step !== 'loading') return
    const interval = setInterval(() => {
      setLoadingStep(prev => prev < 3 ? prev + 1 : prev)
    }, 4000)
    return () => clearInterval(interval)
  }, [step])

  useEffect(() => {
    if (step !== 'correcting') return
    setCorrectingStep(0)
    const interval = setInterval(() => {
      setCorrectingStep(prev => prev < 3 ? prev + 1 : prev)
    }, 3000)
    return () => clearInterval(interval)
  }, [step])

  async function handleLogout() { await supabase.auth.signOut(); window.location.href = '/' }

  async function startExercice(famille) {
    setSelectedFamille(famille)
    setError('')
    setLoadingStep(0)
    setStep('loading')

    try {
      const res = await fetch('/api/specifique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generer', famille: famille.id })
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || 'Erreur lors de la génération.'); setStep('choix'); return }
      setSujet(data.sujet)
      setReponses({})
      setStep('epreuve')
    } catch (err) {
      setError('Erreur de connexion. Réessayez.')
      setStep('choix')
    }
  }

  async function handleSubmit() {
    const hasAnswers = Object.values(reponses).some(v => v.trim())
    if (!hasAnswers) { setError('Veuillez répondre à au moins une question.'); return }
    setError('')
    setStep('correcting')

    try {
      const startTime = Date.now()
      const res = await fetch('/api/specifique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'corriger', exercices: sujet.questions, reponses })
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || 'Erreur lors de la correction.'); setStep('epreuve'); return }
      const elapsed = Date.now() - startTime
      if (elapsed < 20000) await new Promise(r => setTimeout(r, 20000 - elapsed))
      setCorrection(data.correction)
      await supabase.from('historique').insert({
        user_id: user.id,
        type: 'Spécifique',
        label: selectedFamille.titre,
        note: data.correction.note,
        note_max: data.correction.noteMax || 10,
        nb_questions: sujet.questions?.length || 0,
        duration_minutes: null,
      })
      setStep('resultat')
    } catch (err) {
      setError('Erreur de connexion. Réessayez.')
      setStep('epreuve')
    }
  }

  function restart() {
    setStep('choix'); setSujet(null); setReponses({}); setCorrection(null); setError(''); setLoadingStep(0); setSelectedFamille(null)
  }

  function retryFamille() {
    if (selectedFamille) startExercice(selectedFamille)
    else restart()
  }

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || ''
  const isPremium = false
  const c = selectedFamille ? colorMap[selectedFamille.color] : colorMap.blue

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex" style={{backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px'}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes premiumScan { 0%, 80% { opacity: 1; } 85% { opacity: 0.4; transform: scale(1.15); } 90% { opacity: 1; transform: scale(1); filter: brightness(1.5); } 95% { filter: brightness(1); } 100% { opacity: 1; } }
        .premium-scan { animation: premiumScan 5s ease-in-out infinite; }
        @keyframes morph { 0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; } 33% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; } 66% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; } }
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
                      { icon: <BookOpen size={18} strokeWidth={2} />, title: '5-6 questions par session', text: 'Des exercices ciblés, sans calculatrice, pour progresser efficacement.' },
                      { icon: <Sparkles size={18} strokeWidth={2} />, title: 'Exercices générés par notre IA', text: 'Des exercices originaux basés sur les annales du concours FPC à chaque session.' },
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

                  <button onClick={() => { if (dontShowAgain) localStorage.setItem('specifique_skip_info', 'true'); setShowInfoPopup(false) }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-blue-200/50 text-sm flex items-center justify-center gap-2 cursor-pointer mb-4">
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

          {/* ===== CHOIX FAMILLE ===== */}
          {step === 'choix' && (
            <div className="animate-fade-in max-w-5xl mx-auto">

              {/* Cadre principal */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">

                {/* Croix fermeture */}
                <a href="/dashboard" className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 text-white transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </a>

                {/* Hero header */}
                <div className="bg-slate-900 p-8 sm:p-10 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4 pr-10">
                      <div className="w-11 h-11 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                      </div>
                      <div>
                        <h1 className="text-2xl font-black text-white">Entraînement spécifique</h1>
                        <p className="text-slate-400 font-medium text-sm">Travaillez une famille d'exercices avec corrections détaillées par l'IA</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-5">
                      <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium"><svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>5-6 questions par session</span>
                      <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium"><svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Sans calculatrice</span>
                      <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium"><svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/></svg>Explications pas à pas</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 font-bold text-sm px-5 py-3 rounded-xl mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    {error}
                  </div>
                )}

                <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-5 text-center">Choisissez une famille</p>

                <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
                  {familles.map(f => {
                    const fc = colorMap[f.color]
                    return (
                      <button key={f.id} onClick={() => startExercice(f)} className={`bg-white p-5 rounded-2xl border-2 ${fc.border} ${fc.hoverBorder} shadow-sm hover:shadow-md transition text-left cursor-pointer group`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-11 h-11 ${fc.iconBg} ${fc.text} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            {f.icon}
                          </div>
                          <h2 className="text-base font-black text-slate-900">{f.titre}</h2>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`text-xs font-black ${fc.text} ${fc.bg} px-3 py-1 rounded-full`}>5-6 questions</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                </div>
              </div>
            </div>
          )}

          {/* ===== LOADING ===== */}
          {step === 'loading' && selectedFamille && (
            <div className="animate-fade-in min-h-[calc(100vh-2.5rem)] flex items-center justify-center">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm max-w-xl w-full flex flex-col items-center justify-center py-12 px-8">
                <div className={`w-24 h-24 bg-gradient-to-br ${colorMap[selectedFamille.color].gradient} shadow-xl mb-8`} style={{animation: 'morph 4s ease-in-out infinite'}}></div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Génération des exercices...</h2>
                <p className="text-slate-500 font-medium text-sm text-center mb-8">Préparation de votre entraînement « {selectedFamille.titre} »</p>
                <div className="w-full max-w-md space-y-3">
                  {[
                    { label: 'Analyse des annales' },
                    { label: 'Sélection des exercices' },
                    { label: 'Préparation des explications' },
                    { label: 'Mise en forme' }
                  ].map((ls, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${i <= loadingStep ? `${colorMap[selectedFamille.color].light} border ${colorMap[selectedFamille.color].border}` : 'bg-slate-50 border border-slate-100 opacity-40'}`}>
                      <span className={`font-bold text-sm flex-grow ${i <= loadingStep ? colorMap[selectedFamille.color].text : 'text-slate-400'}`}>{ls.label}</span>
                      {i < loadingStep && <svg className={`w-5 h-5 ${colorMap[selectedFamille.color].text} shrink-0`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      {i === loadingStep && <div className={`w-4 h-4 border-2 ${colorMap[selectedFamille.color].text} border-t-transparent rounded-full animate-spin shrink-0`} style={{borderColor: undefined}}></div>}
                      <span className="text-xs font-bold text-slate-400">{i + 1}/4</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== ÉPREUVE ===== */}
          {step === 'epreuve' && sujet && selectedFamille && (
            <div className="animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[calc(100vh-2.5rem)] flex flex-col">

                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${colorMap[selectedFamille.color].badge}`}>
                      {selectedFamille.titre}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                      Sans calculatrice
                    </span>
                  </div>
                  <a href="/dashboard" className="bg-slate-900 hover:bg-black text-white font-bold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2">
                    Quitter l'exercice
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </a>
                </div>

                <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
                  <h2 className="text-lg font-black text-slate-900 mb-1">{sujet.titre}</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">Sans calculatrice — Prenez votre temps</p>

                  <div className="space-y-4">
                    {sujet.questions?.map((q, i) => (
                      <div key={i} className={`bg-slate-50 border border-slate-200 rounded-xl p-5`}>
                        <div className="flex items-start gap-3 mb-3">
                          <span className={`w-7 h-7 ${colorMap[selectedFamille.color].iconBg} ${colorMap[selectedFamille.color].text} rounded-lg flex items-center justify-center font-black text-xs shrink-0 mt-0.5`}>{q.id}</span>
                          <p className="text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-line flex-1">{q.question}</p>
                          <span className="text-xs font-bold text-slate-400 shrink-0">{q.points} pt{q.points > 1 ? 's' : ''}</span>
                        </div>
                        <input
                          type="text"
                          className={`w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 ${colorMap[selectedFamille.color].ring} transition placeholder:text-slate-400`}
                          placeholder="Votre réponse..."
                          value={reponses[q.id] || ''}
                          onChange={(e) => setReponses(prev => ({ ...prev, [q.id]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>

                  {error && <p className="text-red-600 font-bold text-sm mt-4">{error}</p>}

                  <div className="flex items-center justify-between mt-8 pb-4">
                    <button onClick={restart} className="text-slate-500 hover:text-slate-700 font-bold text-sm transition cursor-pointer">Abandonner</button>
                    <button onClick={handleSubmit} className={`bg-gradient-to-r ${colorMap[selectedFamille.color].gradient} text-white font-bold px-6 py-3 rounded-xl transition shadow-lg text-sm flex items-center gap-2 cursor-pointer`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                      Soumettre mes réponses
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== CORRECTING ===== */}
          {step === 'correcting' && selectedFamille && (
            <div className="animate-fade-in min-h-[calc(100vh-2.5rem)] flex items-center justify-center">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm max-w-xl w-full flex flex-col items-center justify-center py-12 px-8">
                <div className={`w-24 h-24 bg-gradient-to-br ${colorMap[selectedFamille.color].gradient} shadow-xl mb-8`} style={{animation: 'morph 4s ease-in-out infinite'}}></div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Correction en cours...</h2>
                <p className="text-slate-500 font-medium text-sm text-center mb-8">Notre IA analyse vos réponses et prépare les explications.</p>
                <div className="w-full max-w-md space-y-3">
                  {[
                    { label: 'Lecture de vos réponses' },
                    { label: 'Vérification des calculs' },
                    { label: 'Rédaction des explications détaillées' },
                    { label: 'Attribution de la note' }
                  ].map((ls, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${i <= correctingStep ? `${colorMap[selectedFamille.color].light} border ${colorMap[selectedFamille.color].border}` : 'bg-slate-50 border border-slate-100 opacity-40'}`}>
                      <span className={`font-bold text-sm flex-grow ${i <= correctingStep ? colorMap[selectedFamille.color].text : 'text-slate-400'}`}>{ls.label}</span>
                      {i < correctingStep && <svg className={`w-5 h-5 ${colorMap[selectedFamille.color].text} shrink-0`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      {i === correctingStep && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>}
                      <span className="text-xs font-bold text-slate-400">{i + 1}/4</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== RÉSULTAT ===== */}
          {step === 'resultat' && correction && selectedFamille && (
            <div className="animate-fade-in max-w-4xl mx-auto">

              {/* Note */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center mb-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Votre note — {selectedFamille.titre}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-6xl font-black ${colorMap[selectedFamille.color].text}`}>{correction.note}</span>
                  <span className="text-2xl font-black text-slate-300">/{correction.noteMax || 10}</span>
                </div>
                <p className="text-slate-600 font-medium text-sm mt-4 max-w-lg mx-auto">{correction.appreciation}</p>
              </div>

              {/* Corrections détaillées */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6">
                <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <div className={`w-7 h-7 ${colorMap[selectedFamille.color].iconBg} rounded-lg flex items-center justify-center`}>
                    <svg className={`w-4 h-4 ${colorMap[selectedFamille.color].text}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  Correction détaillée avec explications
                </h3>
                <div className="space-y-4">
                  {correction.corrections?.map((cr, i) => (
                    <div key={i} className={`border rounded-xl p-4 ${cr.correct === true ? 'bg-emerald-50 border-emerald-200' : cr.correct === 'partiel' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${cr.correct === true ? 'bg-emerald-100 text-emerald-700' : cr.correct === 'partiel' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{cr.id}</span>
                          <p className="text-sm font-bold text-slate-800">{cr.question}</p>
                        </div>
                        <span className={`text-xs font-black px-2 py-1 rounded-full shrink-0 ml-2 ${cr.correct === true ? 'bg-emerald-100 text-emerald-700' : cr.correct === 'partiel' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {cr.points_obtenus}/{cr.points_max} pt{cr.points_max > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <div className="bg-white/60 rounded-lg p-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Votre réponse</p>
                          <p className={`text-sm font-bold ${cr.correct === true ? 'text-emerald-700' : 'text-red-600'}`}>{cr.reponse_candidat || '(vide)'}</p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Réponse attendue</p>
                          <p className="text-sm font-bold text-emerald-700">{cr.reponse_attendue}</p>
                        </div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-4 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Explication détaillée</p>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{cr.explication}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conseil */}
              <div className={`${colorMap[selectedFamille.color].light} border ${colorMap[selectedFamille.color].border} rounded-2xl p-6 mb-6`}>
                <h3 className={`font-black ${colorMap[selectedFamille.color].text} text-sm mb-2 flex items-center gap-2`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/></svg>
                  Conseil pour progresser
                </h3>
                <p className={`${colorMap[selectedFamille.color].text} text-sm leading-relaxed`}>{correction.conseil}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-4 pb-8">
                <button onClick={retryFamille} className={`bg-gradient-to-r ${colorMap[selectedFamille.color].gradient} text-white font-bold px-6 py-3 rounded-xl transition shadow-lg text-sm flex items-center gap-2 cursor-pointer`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                  Recommencer cette famille
                </button>
                <button onClick={restart} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 rounded-xl transition text-sm cursor-pointer">Changer de famille</button>
                <a href="/dashboard" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 rounded-xl transition text-sm">Dashboard</a>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
