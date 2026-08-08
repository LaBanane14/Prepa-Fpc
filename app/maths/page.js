'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { LayoutDashboard, ChartNoAxesColumn, History, CircleUserRound, BadgeCheck, LogOut, Stethoscope, Timer, Ban, Sparkles, ClipboardCheck } from 'lucide-react'

const sidebarItems = [
  { id: 'dashboard', label: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { id: 'progression', label: 'Mes stats', href: '/dashboard?tab=progression', icon: ChartNoAxesColumn },
  { id: 'historique', label: 'Historique', href: '/dashboard?tab=historique', icon: History },
  { id: 'profil', label: 'Compte', href: '/dashboard?tab=profil', icon: CircleUserRound },
  { id: 'abonnement', label: 'Devenir Premium', href: '/dashboard?tab=abonnement', icon: BadgeCheck, premium: true }
]

export default function MathsPage() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [showAccessBlock, setShowAccessBlock] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [step, setStep] = useState('loading') // loading, epreuve, correcting, resultat
  const [sujet, setSujet] = useState(null)
  const [reponses, setReponses] = useState({})
  const [correction, setCorrection] = useState(null)
  const [error, setError] = useState('')
  const [loadingStep, setLoadingStep] = useState(0)
  const [correctingStep, setCorrectingStep] = useState(0)

  // Chrono
  const [timeLeft, setTimeLeft] = useState(30 * 60)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef(null)
  // Réf mise à jour à chaque rendu : l'interval du chrono capture sinon une version
  // périmée de handleSubmit (réponses vides) au moment où le timer démarre
  const submitRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth'; return }
      setUser(session.user)
      // Vérifier accès (premium ou essai)
      const { data: sub } = await supabase.from('subscriptions').select('status, current_period_end').eq('user_id', session.user.id).eq('status', 'active').single()
      const hasSub = sub && new Date(sub.current_period_end) > new Date()
      if (hasSub) setIsPremium(true)
      const created = new Date(session.user.created_at)
      const trialMs = 7 * 24 * 60 * 60 * 1000 - (Date.now() - created)
      if (!hasSub && trialMs <= 0) { setShowAccessBlock(true); setAuthLoading(false); return }
      setAuthLoading(false)
      const skipPopup = localStorage.getItem('maths_skip_info') === 'true'
      if (skipPopup) {
        genererSujet(session.user)
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
      setLoadingStep(prev => prev < 3 ? prev + 1 : prev)
    }, 3000)
    return () => clearInterval(interval)
  }, [step])

  // Correcting animation
  useEffect(() => {
    if (step !== 'correcting') return
    setCorrectingStep(0)
    const interval = setInterval(() => {
      setCorrectingStep(prev => prev < 3 ? prev + 1 : prev)
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
          submitRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timerActive])

  useEffect(() => { submitRef.current = handleSubmit })

  async function handleLogout() { await supabase.auth.signOut(); window.location.href = '/' }

  function handleStartFromPopup() {
    if (dontShowAgain) localStorage.setItem('maths_skip_info', 'true')
    setShowInfoPopup(false)
    genererSujet()
  }

  // currentUser en paramètre : au premier chargement (skip popup), le state `user` n'est pas encore rempli
  async function genererSujet(currentUser = user) {
    setError('')
    setLoadingStep(0)
    setStep('loading')

    try {
      const startTime = Date.now()
      // Récupérer l'historique pour adapter la difficulté et varier
      const { data: pastSessions } = await supabase.from('historique').select('label, note, note_max').eq('user_id', currentUser.id).eq('type', 'Maths').order('created_at', { ascending: false }).limit(20)
      const history = pastSessions?.map(s => ({ famille: s.label, score: s.note })) || []
      const res = await fetch('/api/maths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generer', history })
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || 'Erreur lors de la génération du sujet.'); window.location.href = '/dashboard'; return }
      const elapsed = Date.now() - startTime
      if (elapsed < 20000) await new Promise(r => setTimeout(r, 20000 - elapsed))
      setSujet(data.sujet)
      setReponses({})
      setTimeLeft(30 * 60)
      setStep('epreuve')
      setTimerActive(true)
    } catch (err) {
      setError('Erreur de connexion.')
      window.location.href = '/dashboard'
    }
  }

  async function handleSubmit() {
    setTimerActive(false)
    if (timerRef.current) clearInterval(timerRef.current)
    const hasAnswers = Object.values(reponses).some(v => v.trim())
    if (!hasAnswers) { setError('Veuillez répondre à au moins une question avant de soumettre.'); return }
    setError('')
    setLoadingStep(0)
    setStep('correcting')

    try {
      const startTime = Date.now()
      const res = await fetch('/api/maths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'corriger', exercices: sujet.exercices, reponses })
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || 'Erreur lors de la correction.'); setStep('epreuve'); setTimerActive(false); return }
      const elapsed = Date.now() - startTime
      if (elapsed < 20000) await new Promise(r => setTimeout(r, 20000 - elapsed))
      setCorrection(data.correction)
      // Sauvegarder dans l'historique
      const totalQuestions = sujet.exercices.reduce((sum, ex) => sum + (ex.questions?.length || 0), 0)
      const durationUsed = Math.round((30 * 60 - timeLeft) / 60)
      await supabase.from('historique').insert({
        user_id: user.id,
        type: 'Maths',
        label: sujet.titre || 'Entraînement mathématiques',
        note: data.correction.note,
        note_max: data.correction.noteMax || 10,
        nb_questions: totalQuestions,
        duration_minutes: durationUsed || 1,
      })
      setStep('resultat')
    } catch (err) {
      setError('Erreur de connexion. Réessayez.')
      setStep('epreuve')
    }
  }

  function restart() {
    setSujet(null); setReponses({}); setCorrection(null); setError(''); setLoadingStep(0); setTimeLeft(30 * 60); setTimerActive(false)
    genererSujet()
  }

  function updateReponse(id, value) {
    setReponses(prev => ({ ...prev, [id]: value }))
  }

  // Collect all questions from exercices
  function getAllQuestions() {
    if (!sujet?.exercices) return []
    const questions = []
    sujet.exercices.forEach(ex => {
      ex.questions.forEach(q => {
        questions.push({ ...q, exerciceNumero: ex.numero, exerciceTitre: ex.titre, exerciceEnonce: ex.enonce, exerciceCategorie: ex.categorie })
      })
    })
    return questions
  }

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || ''
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timePercent = (timeLeft / (30 * 60)) * 100
  const isUrgent = timeLeft < 5 * 60

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div></div>

  if (showAccessBlock) return (
    <div className="min-h-screen bg-[#eceef1] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="text-5xl mb-3 mx-auto">😢</div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Votre essai gratuit est terminé</h2>
        <p className="text-slate-500 font-medium mb-6">Pour continuer à vous entraîner et accéder à tous les exercices, souscrivez à un abonnement.</p>
        <div className="flex flex-col gap-3">
          <a href="/tarifs" className="bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl transition shadow-lg text-sm">Voir les tarifs</a>
          <a href="/dashboard" className="text-slate-500 font-medium text-sm hover:text-slate-700 transition">Retour au tableau de bord</a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex" style={{backgroundImage: 'radial-gradient(#ef4444 1px, transparent 1px)', backgroundSize: '24px 24px'}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Sora:wght@500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-urgent { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .pulse-urgent { animation: pulse-urgent 1s ease-in-out infinite; }
        @keyframes heartbeat-line { 0% { stroke-dashoffset: 200; } 100% { stroke-dashoffset: 0; } }
        .heartbeat-anim { animation: heartbeat-line 1.5s linear infinite; }
        @keyframes morph { 0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; } 33% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; } 66% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; } }
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

      {sidebarOpen && <div className="fixed top-14 lg:top-0 inset-x-0 bottom-0 bg-black/30 z-[45] lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* SIDEBAR */}
      <div className={`fixed top-14 lg:top-0 bottom-0 left-0 z-50 flex items-start lg:items-center pl-0 lg:pl-3 py-0 lg:py-5 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <aside className="w-[84px] bg-white rounded-none rounded-br-2xl lg:rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200/60 border-t-0 lg:border-t flex flex-col items-center py-5 h-full lg:h-[calc(100vh-2.5rem)]" style={{fontFamily: "'Sora', 'Nunito', sans-serif"}}>
          <a href="/" className="mb-4"><div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform"><Stethoscope size={20} strokeWidth={2.5} /></div></a>
          <div className="w-7 h-px bg-slate-200 mb-3"></div>
          <nav className="flex-1 flex flex-col items-center gap-0.5 w-full px-1.5">
            {sidebarItems.filter(item => !item.premium || !isPremium).map(item => (
              <a key={item.id} href={item.href} className={`w-full flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[11px] font-semibold transition-all text-center group ${item.premium ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-600' : 'text-slate-900 hover:bg-red-50 hover:text-red-600'}`}>
                {item.premium ? (
                  <span className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                    <item.icon size={18} strokeWidth={2} />
                  </span>
                ) : (
                  <item.icon size={20} strokeWidth={1.8} className="transition-transform duration-200 group-hover:scale-125" />
                )}
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
      <div className="flex-1 flex flex-col min-h-screen lg:pl-[102px] max-w-full overflow-x-hidden">
        <header className="lg:hidden h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg></button>
          <span className="font-black text-lg text-slate-900">Prépa <span className="text-red-600">FPC</span></span>
          <a href="/dashboard" className="text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </a>
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
                  <h2 className="text-lg font-black text-white pr-8">Entraînement mathématiques</h2>
                  <p className="text-slate-400 text-sm font-medium mt-1">Avant de commencer, voici le déroulement de l'épreuve.</p>
                </div>

                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    {[
                      { icon: <Timer size={18} strokeWidth={2} />, title: 'Chronomètre de 30 minutes', text: 'Le compte à rebours démarre dès la génération du sujet.' },
                      { icon: <Ban size={18} strokeWidth={2} />, title: 'Sans calculatrice', text: 'Comme au concours FPC, vous devez poser vos calculs à la main. Munissez-vous d\'un brouillon.' },
                      { icon: <Sparkles size={18} strokeWidth={2} />, title: 'Exercices générés par notre IA', text: 'Opérations décimales, pourcentages, conversions d\'unités et équations. Le sujet est différent à chaque fois.' },
                      { icon: <ClipboardCheck size={18} strokeWidth={2} />, title: 'Correction détaillée', text: 'Chaque réponse est corrigée avec la méthode de résolution complète pour progresser.' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">{item.icon}</div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{item.title}</p>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleStartFromPopup} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-red-200/50 text-sm flex items-center justify-center gap-2 cursor-pointer mb-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    Commencer l'épreuve
                  </button>

                  <label className="flex items-center gap-2 cursor-pointer justify-center">
                    <input type="checkbox" checked={dontShowAgain} onChange={e => setDontShowAgain(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer" />
                    <span className="text-xs text-slate-400 font-medium">Ne plus afficher ce message</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ===== LOADING ===== */}
          {step === 'loading' && (
            <div className="animate-fade-in min-h-[calc(100vh-6rem)] lg:h-[calc(100vh-2.5rem)] flex items-center justify-center">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm max-w-md sm:max-w-xl w-full flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-8" style={{fontFamily: "'Nunito', sans-serif"}}>
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-red-500 to-rose-500 shadow-xl shadow-red-200 mb-6 sm:mb-8" style={{animation: 'morph 4s ease-in-out infinite'}}></div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-2 text-center">Génération des exercices en cours...</h2>
                <p className="text-slate-500 font-medium text-xs sm:text-sm text-center mb-6 sm:mb-8">Nous préparons votre épreuve de mathématiques.</p>
                <div className="w-full max-w-md space-y-3">
                  {[
                    { label: 'Récupération des annales' },
                    { label: 'Sélection des exercices' },
                    { label: 'Calibrage de la difficulté' },
                    { label: 'Mise en forme des questions' }
                  ].map((ls, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${i <= loadingStep ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-100 opacity-40'}`}>
                      <span className={`font-bold text-sm flex-grow ${i <= loadingStep ? 'text-red-700' : 'text-slate-400'}`}>{ls.label}</span>
                      {i < loadingStep && <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      {i === loadingStep && <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin shrink-0"></div>}
                      <span className="text-xs font-bold text-slate-400">{i + 1}/4</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== ÉPREUVE ===== */}
          {step === 'epreuve' && sujet && (
            <div className="animate-fade-in overflow-x-hidden">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm min-h-full lg:h-[calc(100vh-2.5rem)] flex flex-col overflow-hidden">

                {/* Barre du haut : chrono */}
                <div className="bg-slate-900 rounded-t-2xl px-3 sm:px-6 py-3 sm:py-5 overflow-hidden">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-base sm:text-2xl font-black text-white truncate mr-3">{sujet.titre}</h2>
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <div className={`flex items-center gap-2 sm:gap-3 ${isUrgent ? 'pulse-urgent' : ''}`}>
                        <div className="w-24 sm:w-32 h-2 bg-white/15 rounded-full overflow-hidden hidden sm:block">
                          <div className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-red-400'}`} style={{width: `${timePercent}%`}}></div>
                        </div>
                        <div className={`flex items-center gap-1 sm:gap-2 font-black text-sm sm:text-lg tabular-nums ${isUrgent ? 'text-red-400' : 'text-white'}`}>
                          <svg className="w-6 h-4 sm:w-8 sm:h-6 text-red-400 heartbeat-anim" viewBox="0 0 80 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray: 200, strokeDashoffset: 0}}><polyline points="0,12 15,12 20,12 25,2 30,22 35,6 40,18 45,12 50,12 55,12 60,12 65,8 68,16 70,12 80,12"/></svg>
                          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                      </div>
                      <a href="/dashboard" className="hidden sm:flex bg-white/15 hover:bg-white/25 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition items-center gap-2">
                        Quitter l'exercice
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                      <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/15 text-red-400">
                        Mathématiques
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/15 text-red-400">
                        Sans calculatrice
                      </span>
                      {sujet.source === 'annale' ? (
                        <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/15 text-white">
                          Annale {sujet.ville} {sujet.annee}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/15 text-white">
                          Sujet créé par nos soins
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Note sur {sujet.noteMax || 10} pts — 30 min</p>
                  </div>
                </div>

                <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>
                    <p className="text-sm text-amber-800 font-medium">Cette épreuve doit être réalisée <strong>sans calculatrice</strong>, conformément aux conditions du concours FPC. Munissez-vous d'un brouillon pour poser vos calculs.</p>
                  </div>

                  <div className="space-y-8">
                    {sujet.exercices?.map((ex, exIdx) => (
                      <div key={exIdx} className="bg-slate-200/60 border border-slate-300 rounded-2xl shadow-sm p-4 sm:p-6">
                        <div className="flex items-center gap-3 mb-5">
                          <span className="w-9 h-9 bg-red-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-sm">{ex.numero}</span>
                          <h3 className="font-black text-slate-900 text-base sm:text-lg flex-1">{ex.titre}</h3>
                          <span className="text-base sm:text-lg font-black text-slate-900 shrink-0">/{ex.points}</span>
                        </div>

                        {ex.enonce && (
                          <div className="border-l-3 border-red-400 bg-slate-50 rounded-r-lg pl-4 pr-4 py-3 mb-6">
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{ex.enonce}</p>
                          </div>
                        )}

                        <div className="space-y-5">
                          {ex.questions?.map((q, qIdx) => (
                            <div key={qIdx}>
                              <div className="flex items-start gap-3 mb-2">
                                <span className="w-6 h-6 bg-slate-900 text-white rounded-md flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{q.id}</span>
                                <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed whitespace-pre-line flex-1 min-w-0" dangerouslySetInnerHTML={{__html: q.question.replace(/\s*:\s*(?=\d)/g, ' :<br class="sm:hidden"/> ')}} />
                                <span className="text-xs font-bold text-slate-400 shrink-0 ml-2">{q.points} pt{q.points > 1 ? 's' : ''}</span>
                              </div>
                              <div className="ml-0 sm:ml-9 w-full sm:max-w-sm">
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

                  <div className="flex items-center justify-center mt-8 pb-4">
                    <button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-red-200/50 text-sm flex items-center gap-2 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                      Soumettre mes réponses
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== CORRECTING ===== */}
          {step === 'correcting' && (
            <div className="animate-fade-in min-h-full lg:h-[calc(100vh-2.5rem)] flex items-center justify-center">
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
                <h2 className="text-xl font-black text-slate-900 mb-2">Correction en cours...</h2>
                <p className="text-slate-500 font-medium text-sm text-center mb-8">Notre IA analyse vos réponses en détail.</p>
                <div className="w-full max-w-md space-y-3">
                  {[
                    { label: 'Lecture de vos réponses' },
                    { label: 'Vérification des calculs' },
                    { label: 'Rédaction des explications' },
                    { label: 'Attribution de la note' }
                  ].map((ls, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${i <= correctingStep ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-100 opacity-40'}`}>
                      <span className={`font-bold text-sm flex-grow ${i <= correctingStep ? 'text-red-700' : 'text-slate-400'}`}>{ls.label}</span>
                      {i < correctingStep && <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      {i === correctingStep && <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin shrink-0"></div>}
                      <span className="text-xs font-bold text-slate-400">{i + 1}/4</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== RÉSULTAT ===== */}
          {step === 'resultat' && correction && (
            <div className="animate-fade-in max-w-4xl mx-auto">

              {/* Note */}
              <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-center mb-6 relative">
                <a href="/dashboard" className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 text-white transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </a>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Votre note</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl sm:text-6xl font-black text-white">{correction.note}</span>
                  <span className="text-5xl sm:text-6xl font-black text-slate-400">/{correction.noteMax || 10}</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <span className="text-sm font-bold">Temps : {Math.round((30 * 60 - timeLeft) / 60)} min</span>
                </div>
              </div>

              {/* Points forts + à améliorer */}
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <h3 className="font-black text-emerald-700 text-sm mb-4 flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>
                    Points forts
                  </h3>
                  <ul className="space-y-2.5">
                    {correction.points_forts?.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-md flex items-center justify-center font-black text-xs shrink-0 mt-0.5">+</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <h3 className="font-black text-red-600 text-sm mb-4 flex items-center gap-2">
                    <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg></div>
                    Points à améliorer !
                  </h3>
                  <ul className="space-y-2.5">
                    {correction.points_ameliorer?.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-5 h-5 bg-red-100 text-red-600 rounded-md flex items-center justify-center font-black text-xs shrink-0 mt-0.5">-</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Corrections détaillées */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6">
                <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                  Correction détaillée
                </h3>
                <div className="space-y-4">
                  {correction.corrections?.map((c, i) => (
                    <div key={i} className={`border rounded-xl p-4 ${c.correct === true || c.correct === 'true' ? 'bg-emerald-50 border-emerald-200' : c.correct === 'partiel' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${c.correct === true || c.correct === 'true' ? 'bg-emerald-100 text-emerald-700' : c.correct === 'partiel' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{c.id}</span>
                          <p className="text-sm font-bold text-slate-800">{c.question}</p>
                        </div>
                        <span className={`text-xs font-black px-2 py-1 rounded-full ${c.correct === true || c.correct === 'true' ? 'bg-emerald-100 text-emerald-700' : c.correct === 'partiel' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {c.points_obtenus}/{c.points_max} pt{c.points_max > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <div className="bg-white/60 rounded-lg p-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Votre réponse</p>
                          <p className={`text-sm font-bold ${c.correct === true || c.correct === 'true' ? 'text-emerald-700' : 'text-red-600'}`}>{c.reponse_candidat || '(vide)'}</p>
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

              {/* Conseil */}
              <div className="bg-slate-900 rounded-2xl p-6 mb-6">
                <h3 className="font-black text-white text-sm mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/></svg>
                  Conseil pour progresser
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">{correction.conseil}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-4 pb-8">
                <button onClick={restart} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-red-200/50 text-sm flex items-center gap-2 cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                  Nouvel entraînement
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
