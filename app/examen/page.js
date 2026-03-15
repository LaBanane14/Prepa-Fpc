'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Home, TrendingUp, RotateCcw, UserRound, BadgeCheck, LogOut, Stethoscope, Timer, Ban, Sparkles, ClipboardCheck, PenLine, GraduationCap } from 'lucide-react'

const sidebarItems = [
  { id: 'dashboard', label: 'Accueil', href: '/dashboard', icon: Home },
  { id: 'progression', label: 'Mes stats', href: '/dashboard?tab=progression', icon: TrendingUp },
  { id: 'historique', label: 'Historique', href: '/dashboard?tab=historique', icon: RotateCcw },
  { id: 'profil', label: 'Compte', href: '/dashboard?tab=profil', icon: UserRound },
  { id: 'abonnement', label: 'Devenir Premium', href: '/dashboard?tab=abonnement', icon: BadgeCheck, premium: true }
]

export default function ExamenPage() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  // Steps: null (popup), loading, epreuve-maths, transition, epreuve-redaction, correcting, resultat
  const [step, setStep] = useState('loading')
  const [error, setError] = useState('')
  const [showBareme, setShowBareme] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [correctingStep, setCorrectingStep] = useState(0)

  // Maths state
  const [sujetMaths, setSujetMaths] = useState(null)
  const [reponses, setReponses] = useState({})
  const [correctionMaths, setCorrectionMaths] = useState(null)

  // Redaction state
  const [sujetRedaction, setSujetRedaction] = useState(null)
  const [redaction, setRedaction] = useState('')
  const [correctionRedaction, setCorrectionRedaction] = useState(null)

  // Chrono
  const [timeLeft, setTimeLeft] = useState(30 * 60)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef(null)
  const [currentPart, setCurrentPart] = useState('maths') // maths or redaction

  // Track time spent on each part
  const [mathsTimeUsed, setMathsTimeUsed] = useState(0)
  const [redactionTimeUsed, setRedactionTimeUsed] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth'; return }
      setUser(session.user)
      setAuthLoading(false)
      const skipPopup = localStorage.getItem('examen_skip_info') === 'true'
      if (skipPopup) {
        genererSujets()
      } else {
        setShowInfoPopup(true)
        setStep(null)
      }
    })
  }, [])

  // Loading animation
  useEffect(() => {
    if (step !== 'loading') return
    const interval = setInterval(() => {
      setLoadingStep(prev => prev < 4 ? prev + 1 : prev)
    }, 3000)
    return () => clearInterval(interval)
  }, [step])

  // Correcting animation
  useEffect(() => {
    if (step !== 'correcting') return
    setCorrectingStep(0)
    const interval = setInterval(() => {
      setCorrectingStep(prev => prev < 5 ? prev + 1 : prev)
    }, 3000)
    return () => clearInterval(interval)
  }, [step])

  // Timer
  useEffect(() => {
    if (!timerActive) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setTimerActive(false)
          if (currentPart === 'maths') {
            handleSubmitMaths(true)
          } else {
            handleSubmitRedaction(true)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timerActive, currentPart])

  async function handleLogout() { await supabase.auth.signOut(); window.location.href = '/' }

  function handleStartFromPopup() {
    if (dontShowAgain) localStorage.setItem('examen_skip_info', 'true')
    setShowInfoPopup(false)
    genererSujets()
  }

  async function genererSujets() {
    setError('')
    setLoadingStep(0)
    setStep('loading')

    try {
      const startTime = Date.now()
      const [resMaths, resRedaction] = await Promise.all([
        fetch('/api/maths', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generer' })
        }),
        fetch('/api/redaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generer' })
        })
      ])
      const [dataMaths, dataRedaction] = await Promise.all([resMaths.json(), resRedaction.json()])
      if (!resMaths.ok || dataMaths.error) { setError(dataMaths.error || 'Erreur lors de la génération du sujet maths.'); window.location.href = '/dashboard'; return }
      if (!resRedaction.ok || dataRedaction.error) { setError(dataRedaction.error || 'Erreur lors de la génération du sujet rédaction.'); window.location.href = '/dashboard'; return }
      const elapsed = Date.now() - startTime
      if (elapsed < 25000) await new Promise(r => setTimeout(r, 25000 - elapsed))
      setSujetMaths(dataMaths.sujet)
      setSujetRedaction(dataRedaction.sujet)
      setReponses({})
      setRedaction('')
      setTimeLeft(30 * 60)
      setCurrentPart('maths')
      setStep('epreuve-maths')
      setTimerActive(true)
    } catch (err) {
      setError('Erreur de connexion.')
      window.location.href = '/dashboard'
    }
  }

  function handleSubmitMaths(autoSubmit = false) {
    setTimerActive(false)
    if (timerRef.current) clearInterval(timerRef.current)
    if (!autoSubmit) {
      const hasAnswers = Object.values(reponses).some(v => v.trim())
      if (!hasAnswers) { setError('Veuillez répondre à au moins une question avant de soumettre.'); return }
    }
    setError('')
    setMathsTimeUsed(Math.round((30 * 60 - timeLeft) / 60))
    setStep('transition')
  }

  function startRedaction() {
    setTimeLeft(30 * 60)
    setCurrentPart('redaction')
    setStep('epreuve-redaction')
    setTimerActive(true)
  }

  async function handleSubmitRedaction(autoSubmit = false) {
    setTimerActive(false)
    if (timerRef.current) clearInterval(timerRef.current)
    if (!autoSubmit && !redaction.trim()) { setError('Veuillez rédiger votre réponse avant de soumettre.'); return }
    setError('')
    setRedactionTimeUsed(Math.round((30 * 60 - timeLeft) / 60))
    setCorrectingStep(0)
    setStep('correcting')

    try {
      const startTime = Date.now()
      const [resCorrMaths, resCorrRedaction] = await Promise.all([
        fetch('/api/maths', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'corriger', exercices: sujetMaths.exercices, reponses })
        }),
        fetch('/api/redaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'corriger', sujet: sujetRedaction, redaction })
        })
      ])
      const [dataMaths, dataRedaction] = await Promise.all([resCorrMaths.json(), resCorrRedaction.json()])
      if (!resCorrMaths.ok || dataMaths.error) { setError(dataMaths.error || 'Erreur lors de la correction des maths.'); setStep('epreuve-redaction'); return }
      if (!resCorrRedaction.ok || dataRedaction.error) { setError(dataRedaction.error || 'Erreur lors de la correction de la rédaction.'); setStep('epreuve-redaction'); return }
      const elapsed = Date.now() - startTime
      if (elapsed < 20000) await new Promise(r => setTimeout(r, 20000 - elapsed))
      setCorrectionMaths(dataMaths.correction)
      setCorrectionRedaction(dataRedaction.correction)
      // Sauvegarder dans l'historique
      const totalQuestions = sujetMaths.exercices.reduce((sum, ex) => sum + (ex.questions?.length || 0), 0)
      const totalDuration = (mathsTimeUsed || 1) + (Math.round((30 * 60 - timeLeft) / 60) || 1)
      const noteMaths = dataMaths.correction.note
      const noteRedaction = dataRedaction.correction.note
      await supabase.from('historique').insert({
        user_id: user.id,
        type: 'Examen',
        label: 'Examen blanc — ' + (sujetMaths.titre || 'Maths') + ' + ' + (sujetRedaction.titre || 'Rédaction'),
        note: noteMaths + noteRedaction,
        note_max: 20,
        nb_questions: totalQuestions + 1,
        duration_minutes: totalDuration,
      })
      setStep('resultat')
    } catch (err) {
      setError('Erreur de connexion. Réessayez.')
      setStep('epreuve-redaction')
    }
  }

  function restart() {
    setSujetMaths(null); setSujetRedaction(null); setReponses({}); setRedaction('')
    setCorrectionMaths(null); setCorrectionRedaction(null); setError('')
    setLoadingStep(0); setTimeLeft(30 * 60); setTimerActive(false)
    setMathsTimeUsed(0); setRedactionTimeUsed(0)
    genererSujets()
  }

  function updateReponse(id, value) {
    setReponses(prev => ({ ...prev, [id]: value }))
  }

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || ''
  const isPremium = false
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timePercent = (timeLeft / (30 * 60)) * 100
  const isUrgent = timeLeft < 5 * 60

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full"></div></div>

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex" style={{backgroundImage: 'radial-gradient(#eab308 1px, transparent 1px)', backgroundSize: '24px 24px'}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes premiumScan { 0%, 80% { opacity: 1; } 85% { opacity: 0.4; transform: scale(1.15); } 90% { opacity: 1; transform: scale(1); filter: brightness(1.5); } 95% { filter: brightness(1); } 100% { opacity: 1; } }
        .premium-scan { animation: premiumScan 5s ease-in-out infinite; }
        @keyframes pulse-urgent { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .pulse-urgent { animation: pulse-urgent 1s ease-in-out infinite; }
        @keyframes morph { 0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; } 33% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; } 66% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; } }
        @keyframes heartbeat-line { 0% { stroke-dashoffset: 200; } 100% { stroke-dashoffset: 0; } }
        .heartbeat-anim { animation: heartbeat-line 1.5s linear infinite; }
        .gooey-loader { width: 180px; height: 180px; position: relative; filter: url('#goo'); animation: goo-spin 4s ease-in-out infinite alternate; margin: 0 auto; }
        .goo-drop { position: absolute; top: 50%; left: 50%; background: #dc2626; border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: translate(-50%, -50%); }
        .goo-yin, .goo-yang { width: 70px; height: 70px; }
        .goo-yin { animation: goo-move-yin 2.5s ease-in-out infinite, goo-morph 3.5s ease-in-out infinite; }
        .goo-yang { animation: goo-move-yang 2.5s ease-in-out infinite, goo-morph 3.5s ease-in-out infinite reverse; }
        @keyframes goo-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes goo-morph { 0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; } 50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; } }
        @keyframes goo-move-yin { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, calc(-50% - 50px)) scale(0.9); } }
        @keyframes goo-move-yang { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, calc(-50% + 50px)) scale(0.9); } }
        .loading-dot { display: inline-block; width: 4px; height: 4px; background-color: currentColor; border-radius: 50%; margin: 0 2px; animation: dot-blink 1.4s infinite; opacity: 0; }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dot-blink { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
      `}</style>

      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-50 flex items-center pl-3 py-5 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <aside className="w-[72px] bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200/60 flex flex-col items-center py-5 h-[calc(100vh-2.5rem)]" style={{fontFamily: "'Nunito', sans-serif"}}>
          <a href="/" className="mb-4"><div className="w-10 h-10 bg-yellow-500 text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform"><Stethoscope size={20} strokeWidth={2.5} /></div></a>
          <div className="w-7 h-px bg-slate-200 mb-3"></div>
          <nav className="flex-1 flex flex-col items-center gap-0.5 w-full px-1.5">
            {sidebarItems.filter(item => !item.premium || !isPremium).map(item => (
              <a key={item.id} href={item.href} className={`w-full flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[11px] font-bold transition-all text-center group ${item.premium ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-600' : 'text-slate-900 hover:bg-yellow-50 hover:text-yellow-600'}`}>
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
                  <h2 className="text-lg font-black text-white pr-8">Examen blanc — Conditions réelles</h2>
                  <p className="text-slate-400 text-sm font-medium mt-1">Avant de commencer, voici le déroulement de l'épreuve.</p>
                </div>

                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    {[
                      { icon: <GraduationCap size={18} strokeWidth={2} />, title: '2 épreuves enchaînées (1H)', text: 'Vous passerez d\'abord l\'épreuve de mathématiques (30 min), puis l\'épreuve de rédaction (30 min), comme au concours.' },
                      { icon: <Timer size={18} strokeWidth={2} />, title: 'Chronomètre par épreuve', text: 'Chaque partie dispose de son propre compte à rebours de 30 minutes. À la fin du temps, vos réponses sont envoyées automatiquement.' },
                      { icon: <Ban size={18} strokeWidth={2} />, title: 'Sans calculatrice', text: 'Comme au concours FPC, la calculatrice est interdite pour la partie maths. Munissez-vous d\'un brouillon.' },
                      { icon: <ClipboardCheck size={18} strokeWidth={2} />, title: 'Note globale sur 20', text: 'Maths /10 + Rédaction /10 = Note finale /20 avec correction détaillée des deux épreuves.' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center shrink-0">{item.icon}</div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{item.title}</p>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleStartFromPopup} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-yellow-200/50 text-sm flex items-center justify-center gap-2 cursor-pointer mb-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    Commencer l'examen blanc
                  </button>

                  <label className="flex items-center gap-2 cursor-pointer justify-center">
                    <input type="checkbox" checked={dontShowAgain} onChange={e => setDontShowAgain(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-500 cursor-pointer" />
                    <span className="text-xs text-slate-400 font-medium">Ne plus afficher ce message</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ===== LOADING ===== */}
          {step === 'loading' && (
            <div className="animate-fade-in min-h-[calc(100vh-2.5rem)] flex items-center justify-center">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm max-w-xl w-full flex flex-col items-center justify-center py-12 px-8">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-500 shadow-xl shadow-yellow-200 mb-8" style={{animation: 'morph 4s ease-in-out infinite'}}></div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Préparation de l'examen blanc...</h2>
                <p className="text-slate-500 font-medium text-sm text-center mb-8">Nous générons les deux épreuves simultanément.</p>
                <div className="w-full max-w-md space-y-3">
                  {[
                    { label: 'Analyse des annales' },
                    { label: 'Génération du sujet de mathématiques' },
                    { label: 'Génération du sujet de rédaction' },
                    { label: 'Calibrage de la difficulté' },
                    { label: 'Mise en forme des épreuves' }
                  ].map((ls, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${i <= loadingStep ? 'bg-yellow-50 border border-yellow-200' : 'bg-slate-50 border border-slate-100 opacity-40'}`}>
                      <span className={`font-bold text-sm flex-grow ${i <= loadingStep ? 'text-yellow-700' : 'text-slate-400'}`}>{ls.label}</span>
                      {i < loadingStep && <svg className="w-5 h-5 text-yellow-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      {i === loadingStep && <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin shrink-0"></div>}
                      <span className="text-xs font-bold text-slate-400">{i + 1}/5</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== ÉPREUVE MATHS ===== */}
          {step === 'epreuve-maths' && sujetMaths && (
            <div className="animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[calc(100vh-2.5rem)] flex flex-col">

                {/* Barre du haut */}
                <div className="bg-slate-900 rounded-t-2xl px-6 py-5">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl sm:text-2xl font-black text-white">{sujetMaths.titre}</h2>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <div className={`flex items-center gap-3 ${isUrgent ? 'pulse-urgent' : ''}`}>
                        <div className="w-32 h-2 bg-white/15 rounded-full overflow-hidden hidden sm:block">
                          <div className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-yellow-400'}`} style={{width: `${timePercent}%`}}></div>
                        </div>
                        <div className={`flex items-center gap-2 font-black text-lg tabular-nums ${isUrgent ? 'text-red-400' : 'text-white'}`}>
                          <svg className="w-8 h-6 text-yellow-400 heartbeat-anim" viewBox="0 0 80 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray: 200, strokeDashoffset: 0}}><polyline points="0,12 15,12 20,12 25,2 30,22 35,6 40,18 45,12 50,12 55,12 60,12 65,8 68,16 70,12 80,12"/></svg>
                          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                      </div>
                      <a href="/dashboard" className="bg-white/15 hover:bg-white/25 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2">
                        Quitter l'examen
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-300">
                        Partie 1/2
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-yellow-300">
                        Mathématiques
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-yellow-300">
                        Sans calculatrice
                      </span>
                      {sujetMaths.source === 'annale' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-white">
                          Annale {sujetMaths.ville} {sujetMaths.annee}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-white">
                          Sujet créé par nos soins
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Note sur {sujetMaths.noteMax || 10} points — Durée : 30 minutes</p>
                  </div>
                </div>

                <div className="flex-1 p-6 sm:p-8 overflow-y-auto">

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>
                    <p className="text-sm text-amber-800 font-medium">Cette épreuve doit être réalisée <strong>sans calculatrice</strong>, conformément aux conditions du concours FPC. Munissez-vous d'un brouillon pour poser vos calculs.</p>
                  </div>

                  <div className="space-y-8">
                    {sujetMaths.exercices?.map((ex, exIdx) => (
                      <div key={exIdx} className="bg-slate-200/60 border border-slate-300 rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-5">
                          <span className="w-9 h-9 bg-yellow-500 text-slate-900 rounded-xl flex items-center justify-center font-black text-sm shadow-sm">{ex.numero}</span>
                          <h3 className="font-black text-slate-900 text-base sm:text-lg flex-1">{ex.titre}</h3>
                          <span className="text-base sm:text-lg font-black text-slate-900 shrink-0">/{ex.points}</span>
                        </div>

                        {ex.enonce && (
                          <div className="border-l-3 border-yellow-400 bg-slate-50 rounded-r-lg pl-4 pr-4 py-3 mb-6">
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{ex.enonce}</p>
                          </div>
                        )}

                        <div className="space-y-5">
                          {ex.questions?.map((q, qIdx) => (
                            <div key={qIdx}>
                              <div className="flex items-start gap-3 mb-2">
                                <span className="w-6 h-6 bg-slate-900 text-white rounded-md flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{q.id}</span>
                                <p className="text-sm text-slate-800 font-semibold leading-relaxed whitespace-pre-line flex-1">{q.question}</p>
                                <span className="text-xs font-bold text-slate-400 shrink-0 ml-2">{q.points} pt{q.points > 1 ? 's' : ''}</span>
                              </div>
                              <div className="ml-9 max-w-sm">
                                <input
                                  type="text"
                                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition placeholder:text-slate-400 placeholder:font-normal"
                                  placeholder="Votre réponse..."
                                  value={reponses[q.id] || ''}
                                  onChange={(e) => updateReponse(q.id, e.target.value)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {error && <p className="text-red-600 font-bold text-sm mt-4">{error}</p>}

                  <div className="flex items-center justify-end mt-8 pb-4">
                    <button onClick={() => handleSubmitMaths(false)} className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-yellow-200/50 text-sm flex items-center gap-2 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                      Passer à la rédaction
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== TRANSITION MATHS → RÉDACTION ===== */}
          {step === 'transition' && (
            <div className="animate-fade-in min-h-[calc(100vh-2.5rem)] flex items-center justify-center">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm max-w-lg w-full flex flex-col items-center justify-center py-12 px-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Partie mathématiques terminée !</h2>
                <p className="text-slate-500 font-medium text-sm mb-2">Vos réponses ont été enregistrées.</p>
                <p className="text-slate-500 font-medium text-sm mb-8">Préparez-vous pour la partie rédaction. Vous aurez à nouveau 30 minutes.</p>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
                    <span className="w-6 h-6 bg-red-100 text-red-600 rounded-md flex items-center justify-center font-bold text-xs">1</span>
                    <span className="text-sm font-bold text-red-700">Maths</span>
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-md flex items-center justify-center font-bold text-xs">2</span>
                    <span className="text-sm font-bold text-purple-700">Rédaction</span>
                  </div>
                </div>

                <button onClick={startRedaction} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3.5 rounded-xl transition shadow-lg shadow-purple-200/50 text-sm flex items-center gap-2 cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                  Commencer la rédaction
                </button>
              </div>
            </div>
          )}

          {/* ===== ÉPREUVE RÉDACTION ===== */}
          {step === 'epreuve-redaction' && sujetRedaction && (
            <div className="animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[calc(100vh-2.5rem)] flex flex-col">

                {/* Barre du haut */}
                <div className="bg-slate-900 rounded-t-2xl px-6 py-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white">{(sujetRedaction.titre?.includes(' — ') ? sujetRedaction.titre.split(' — ')[0] : sujetRedaction.titre?.includes(' - ') ? sujetRedaction.titre.split(' - ')[0] : sujetRedaction.titre)}</h2>
                      {(sujetRedaction.titre?.includes(' — ') || sujetRedaction.titre?.includes(' - ')) && (
                        <p className="text-xl sm:text-2xl text-slate-400 font-black mt-1">{sujetRedaction.titre.includes(' — ') ? sujetRedaction.titre.split(' — ').slice(1).join(' — ') : sujetRedaction.titre.split(' - ').slice(1).join(' - ')}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <div className={`flex items-center gap-3 ${isUrgent ? 'pulse-urgent' : ''}`}>
                        <div className="w-32 h-2 bg-white/15 rounded-full overflow-hidden hidden sm:block">
                          <div className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-purple-400'}`} style={{width: `${timePercent}%`}}></div>
                        </div>
                        <div className={`flex items-center gap-2 font-black text-lg tabular-nums ${isUrgent ? 'text-red-400' : 'text-white'}`}>
                          <svg className="w-8 h-6 text-purple-400 heartbeat-anim" viewBox="0 0 80 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray: 200, strokeDashoffset: 0}}><polyline points="0,12 15,12 20,12 25,2 30,22 35,6 40,18 45,12 50,12 55,12 60,12 65,8 68,16 70,12 80,12"/></svg>
                          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                      </div>
                      <a href="/dashboard" className="bg-white/15 hover:bg-white/25 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2">
                        Quitter l'examen
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-300">
                        Partie 2/2
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-purple-400">
                        {sujetRedaction.type === 'analyse' ? 'Analyse de texte' : sujetRedaction.type === 'dissertation' ? 'Dissertation' : 'Questions'}
                      </span>
                      {sujetRedaction.source === 'annale' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-white">
                          Annale {sujetRedaction.annee}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-white">
                          Sujet créé par nos soins
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 relative">
                      <button onClick={() => setShowBareme(!showBareme)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>
                        Barème de notation
                      </button>
                      {showBareme && (
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 w-80 animate-fade-in">
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{sujetRedaction.bareme}</p>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Durée : 30 minutes</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row">
                  {/* Sujet */}
                  <div className="lg:w-[45%] border-b lg:border-b-0 lg:border-r border-slate-200 p-6 sm:p-8 overflow-y-auto">

                    {sujetRedaction.texte && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{sujetRedaction.texte}</p>
                      </div>
                    )}

                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                      <h3 className="font-black text-purple-900 text-sm mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        Consigne
                      </h3>
                      <p className="text-sm text-purple-800 leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{__html: sujetRedaction.consigne?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}}></p>
                    </div>
                  </div>

                  {/* Zone de rédaction */}
                  <div className="flex-1 p-6 sm:p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-slate-900 text-sm">Votre rédaction</h3>
                      <span className="text-xs text-slate-400 font-bold">{redaction.length} caractères</span>
                    </div>
                    <textarea
                      className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-800 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition min-h-[400px]"
                      placeholder="Rédigez votre réponse ici..."
                      value={redaction}
                      onChange={(e) => setRedaction(e.target.value)}
                    />
                    {error && <p className="text-red-600 font-bold text-sm mt-3">{error}</p>}
                    <div className="flex items-center justify-between mt-5">
                      <a href="/dashboard" className="text-slate-500 hover:text-slate-700 font-bold text-sm transition cursor-pointer">Abandonner l'examen</a>
                      <button onClick={() => handleSubmitRedaction(false)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-purple-200/50 text-sm flex items-center gap-2 cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                        Soumettre et voir les résultats
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== CORRECTING ===== */}
          {step === 'correcting' && (
            <div className="animate-fade-in min-h-[calc(100vh-2.5rem)] flex items-center justify-center">
              <svg style={{width:0,height:0,position:'absolute'}}>
                <defs>
                  <filter id="goo" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                    <feBlend in="SourceGraphic" in2="goo" />
                  </filter>
                </defs>
              </svg>
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm max-w-xl w-full flex flex-col items-center justify-center py-12 px-8">
                <div className="gooey-loader mb-8">
                  <div className="goo-drop goo-yin"></div>
                  <div className="goo-drop goo-yang"></div>
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Correction des deux épreuves...</h2>
                <p className="text-slate-500 font-medium text-sm text-center mb-8">Notre IA analyse vos réponses et votre copie en détail.</p>
                <div className="w-full max-w-md space-y-3">
                  {[
                    { label: 'Lecture de vos réponses mathématiques' },
                    { label: 'Vérification des calculs' },
                    { label: 'Analyse de votre rédaction' },
                    { label: 'Vérification de l\'orthographe et de la syntaxe' },
                    { label: 'Attribution des notes' },
                    { label: 'Calcul de la note globale /20' }
                  ].map((ls, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${i <= correctingStep ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-100 opacity-40'}`}>
                      <span className={`font-bold text-sm flex-grow ${i <= correctingStep ? 'text-red-700' : 'text-slate-400'}`}>{ls.label}</span>
                      {i < correctingStep && <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      {i === correctingStep && <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin shrink-0"></div>}
                      <span className="text-xs font-bold text-slate-400">{i + 1}/6</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== RÉSULTAT ===== */}
          {step === 'resultat' && correctionMaths && correctionRedaction && (
            <div className="animate-fade-in max-w-4xl mx-auto">

              {/* Note globale */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center mb-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Note globale — Examen blanc</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-6xl font-black text-yellow-500">{correctionMaths.note + correctionRedaction.note}</span>
                  <span className="text-2xl font-black text-slate-300">/20</span>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="text-sm font-bold text-slate-600">Maths : <span className="text-red-600">{correctionMaths.note}/{correctionMaths.noteMax || 10}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    <span className="text-sm font-bold text-slate-600">Rédaction : <span className="text-purple-600">{correctionRedaction.note}/{correctionRedaction.noteMax || 10}</span></span>
                  </div>
                </div>
              </div>

              {/* ===== SECTION MATHS ===== */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Mathématiques — {correctionMaths.note}/{correctionMaths.noteMax || 10}</h2>
                </div>

                {/* Appreciation maths */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-4">
                  <p className="text-slate-600 font-medium text-sm">{correctionMaths.appreciation}</p>
                </div>

                {/* Corrections détaillées maths */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-4">
                  <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
                    <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                    Correction détaillée
                  </h3>
                  <div className="space-y-4">
                    {correctionMaths.corrections?.map((c, i) => (
                      <div key={i} className={`border rounded-xl p-4 ${c.correct === true ? 'bg-emerald-50 border-emerald-200' : c.correct === 'partiel' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${c.correct === true ? 'bg-emerald-100 text-emerald-700' : c.correct === 'partiel' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{c.id}</span>
                            <p className="text-sm font-bold text-slate-800">{c.question}</p>
                          </div>
                          <span className={`text-xs font-black px-2 py-1 rounded-full ${c.correct === true ? 'bg-emerald-100 text-emerald-700' : c.correct === 'partiel' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {c.points_obtenus}/{c.points_max} pt{c.points_max > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3 mb-3">
                          <div className="bg-white/60 rounded-lg p-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Votre réponse</p>
                            <p className={`text-sm font-bold ${c.correct === true ? 'text-emerald-700' : 'text-red-600'}`}>{c.reponse_candidat || '(vide)'}</p>
                          </div>
                          <div className="bg-white/60 rounded-lg p-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Réponse attendue</p>
                            <p className="text-sm font-bold text-emerald-700">{c.reponse_attendue}</p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{c.explication}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h3 className="font-black text-emerald-700 text-sm mb-4 flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>
                      Points forts
                    </h3>
                    <ul className="space-y-2.5">
                      {correctionMaths.points_forts?.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="text-emerald-500 mt-0.5 shrink-0">+</span>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h3 className="font-black text-amber-700 text-sm mb-4 flex items-center gap-2">
                      <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg></div>
                      Points à améliorer
                    </h3>
                    <ul className="space-y-2.5">
                      {correctionMaths.points_ameliorer?.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="text-amber-500 mt-0.5 shrink-0">-</span>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <h3 className="font-black text-red-800 text-sm mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/></svg>
                    Conseil maths
                  </h3>
                  <p className="text-red-700 text-sm leading-relaxed">{correctionMaths.conseil}</p>
                </div>
              </div>

              {/* ===== SECTION RÉDACTION ===== */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                    <PenLine size={16} strokeWidth={2} />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Rédaction — {correctionRedaction.note}/{correctionRedaction.noteMax || 10}</h2>
                </div>

                {/* Appreciation redaction */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-4">
                  <p className="text-slate-600 font-medium text-sm">{correctionRedaction.appreciation}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h3 className="font-black text-emerald-700 text-sm mb-4 flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>
                      Points forts
                    </h3>
                    <ul className="space-y-2.5">
                      {correctionRedaction.points_forts?.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="text-emerald-500 mt-0.5 shrink-0">+</span>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h3 className="font-black text-amber-700 text-sm mb-4 flex items-center gap-2">
                      <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg></div>
                      Points à améliorer
                    </h3>
                    <ul className="space-y-2.5">
                      {correctionRedaction.points_ameliorer?.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="text-amber-500 mt-0.5 shrink-0">-</span>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Fautes */}
                {correctionRedaction.fautes?.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-4">
                    <h3 className="font-black text-red-700 text-sm mb-4 flex items-center gap-2">
                      <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
                      Fautes relevées ({correctionRedaction.fautes.length})
                    </h3>
                    <div className="space-y-3">
                      {correctionRedaction.fautes.map((f, i) => (
                        <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <span className="text-red-600 font-bold text-sm line-through">{f.original}</span>
                          <svg className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                          <span className="text-emerald-700 font-bold text-sm">{f.correction}</span>
                          <span className="ml-auto text-xs text-slate-400 font-bold uppercase">{f.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                  <h3 className="font-black text-purple-800 text-sm mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/></svg>
                    Conseil rédaction
                  </h3>
                  <p className="text-purple-700 text-sm leading-relaxed">{correctionRedaction.conseil}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-4 pb-8">
                <button onClick={restart} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-yellow-200/50 text-sm flex items-center gap-2 cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                  Nouvel examen blanc
                </button>
                <a href="/dashboard" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 rounded-xl transition text-sm">Retour au dashboard</a>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
