'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { LayoutDashboard, ChartNoAxesColumn, History, CircleUserRound, BadgeCheck, LogOut, Stethoscope, Upload, Sparkles, MessageCircleQuestion, Lightbulb } from 'lucide-react'

const catColors = {
  'Parcours professionnel': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  'Motivation et projet': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  'Connaissances du métier IDE': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' }
}

const sidebarItems = [
  { id: 'dashboard', label: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { id: 'progression', label: 'Mes stats', href: '/dashboard?tab=progression', icon: ChartNoAxesColumn },
  { id: 'historique', label: 'Historique', href: '/dashboard?tab=historique', icon: History },
  { id: 'profil', label: 'Compte', href: '/dashboard?tab=profil', icon: CircleUserRound },
  { id: 'abonnement', label: 'Devenir Premium', href: '/dashboard?tab=abonnement', icon: BadgeCheck, premium: true }
]

export default function OralPage() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAccessBlock, setShowAccessBlock] = useState(false)
  const [isPremium, setIsPremium] = useState(false)

  const [step, setStep] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [showTip, setShowTip] = useState(false)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth'; return }
      setUser(session.user)
      const { data: sub } = await supabase.from('subscriptions').select('status, current_period_end').eq('user_id', session.user.id).eq('status', 'active').single()
      const hasSub = sub && new Date(sub.current_period_end) > new Date()
      if (hasSub) setIsPremium(true)
      const trialMs = 7 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(session.user.created_at))
      if (!hasSub && trialMs <= 0) { setShowAccessBlock(true); setAuthLoading(false); return }
      setAuthLoading(false)
      const skipPopup = localStorage.getItem('oral_skip_info') === 'true'
      if (skipPopup) {
        setStep('upload')
      } else {
        setShowInfoPopup(true)
        setStep(null)
      }
    })
  }, [])
  // Progression du chargement — asymptotique : rapide au début, ralentit vers 99 %
  useEffect(() => {
    if (step !== 'loading') { setLoadingProgress(0); return }
    const t0 = performance.now()
    let raf
    const tick = (now) => {
      const t = (now - t0) / 1000
      setLoadingProgress(99 * (1 - Math.exp(-Math.pow(t, 1.5) / 18)))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step])

  // Chronomètre (temps écoulé)
  useEffect(() => {
    if (!timerActive) return
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timerActive])

  function handleStartFromPopup() {
    if (dontShowAgain) localStorage.setItem('oral_skip_info', 'true')
    setShowInfoPopup(false)
    setStep('upload')
  }

  async function handleLogout() { await supabase.auth.signOut(); window.location.href = '/' }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') { setError('Seuls les fichiers PDF sont acceptés.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Le fichier ne doit pas dépasser 10 Mo.'); return }

    setFileName(file.name)
    setError('')
    setUploadSuccess(true)
    setTimeout(() => setUploadSuccess(false), 3000)
    setLoadingProgress(0)
    setStep('loading')

    const formData = new FormData()
    formData.append('pdf', file)

    try {
      const startTime = Date.now()
      const res = await fetch('/api/oral', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || "Erreur lors de l'analyse du CV."); setStep('upload'); return }
      const elapsed = Date.now() - startTime
      if (elapsed < 12000) await new Promise(r => setTimeout(r, 12000 - elapsed))
      setQuestions(data.questions)
      setElapsed(0)
      setTimerActive(true)
      setStep('questions')
    } catch (err) {
      setError('Erreur de connexion. Réessayez.')
      setStep('upload')
    }
  }

  function handleAnswer(id, value) { setAnswers({ ...answers, [id]: value }) }

  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { setError('La reconnaissance vocale n\'est pas supportée par votre navigateur. Utilisez Chrome ou Edge.'); return }
    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    // Sur mobile, continuous ne marche pas toujours → on relance automatiquement
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    recognition.continuous = !isMobile
    recognition.interimResults = true
    recognitionRef.current = recognition
    let finalTranscript = answers[q?.id] || ''
    let shouldRestart = true
    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + event.results[i][0].transcript
        } else {
          interim += event.results[i][0].transcript
        }
      }
      setAnswers(prev => ({ ...prev, [q.id]: finalTranscript + (interim ? ' ' + interim : '') }))
    }
    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') setError('Veuillez autoriser l\'accès au microphone.')
      shouldRestart = false
      setIsRecording(false)
    }
    recognition.onend = () => {
      // Sur mobile, relancer automatiquement si l'utilisateur n'a pas arrêté
      if (isMobile && shouldRestart && isRecording) {
        try { recognition.start() } catch { setIsRecording(false) }
      } else {
        setIsRecording(false)
      }
    }
    try {
      recognition.start()
      setIsRecording(true)
    } catch {
      setError('Impossible de démarrer le micro. Vérifiez les permissions.')
    }
  }

  async function finishExercice() {
    setTimerActive(false)
    if (timerRef.current) clearInterval(timerRef.current)
    const durationUsed = Math.round(elapsed / 60)
    await supabase.from('historique').insert({
      user_id: user.id,
      type: 'Oral',
      label: 'Questions sur votre parcours',
      note: null,
      note_max: null,
      nb_questions: questions.length,
      duration_minutes: durationUsed || 1,
    })
    window.location.href = '/dashboard'
  }

  function restart() {
    setStep('upload'); setQuestions([]); setCurrentQ(0); setAnswers({}); setShowTip(false); setFileName(''); setError(''); setLoadingProgress(0); setElapsed(0); setTimerActive(false)
  }

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || ''
  const q = questions[currentQ]
  const colors = q ? (catColors[q.category] || catColors['Parcours professionnel']) : {}
  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4"><div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full"></div><p className="text-sm font-bold text-slate-400" style={{fontFamily: "'Nunito', sans-serif"}}>Ouverture de la préparation orale...</p></div>

  if (showAccessBlock) return (<div className="min-h-screen bg-[#eceef1] flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"><div className="text-5xl mb-3 mx-auto">😢</div><h2 className="text-2xl font-black text-slate-900 mb-2">Votre essai gratuit est terminé</h2><p className="text-slate-500 font-medium mb-6">Pour continuer à vous entraîner et accéder à tous les exercices, souscrivez à un abonnement.</p><div className="flex flex-col gap-3"><a href="/tarifs" className="bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl transition shadow-lg text-sm">Voir les tarifs</a><a href="/dashboard" className="text-slate-500 font-medium text-sm hover:text-slate-700 transition">Retour au tableau de bord</a></div></div></div>)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex" style={{backgroundImage: 'radial-gradient(#22c55e 1px, transparent 1px)', backgroundSize: '24px 24px'}}>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Sora:wght@500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes heartbeat-line { 0% { stroke-dashoffset: 200; } 100% { stroke-dashoffset: 0; } }
        .heartbeat-anim { animation: heartbeat-line 1.5s linear infinite; }
      `}</style>

      {/* TOAST */}
      {uploadSuccess && (
        <div className="fixed top-4 right-4 z-[100] bg-slate-900 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg animate-fade-in flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          Fichier {fileName} uploadé avec succès !
        </div>
      )}

      {sidebarOpen && <div className="fixed top-14 lg:top-0 inset-x-0 bottom-0 bg-black/30 z-[45] lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* SIDEBAR */}
      <div className={`fixed top-14 lg:top-0 bottom-0 left-0 z-50 flex items-start lg:items-center pl-0 lg:pl-3 py-0 lg:py-5 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <aside className="w-[84px] bg-white rounded-none rounded-br-2xl lg:rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200/60 border-t-0 lg:border-t flex flex-col items-center py-5 h-full lg:h-[calc(100vh-2.5rem)]" style={{fontFamily: "'Sora', 'Nunito', sans-serif"}}>
          <a href="/" className="mb-4"><div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform"><Stethoscope size={20} strokeWidth={2.5} /></div></a>
          <div className="w-7 h-px bg-slate-200 mb-3"></div>
          <nav className="flex-1 flex flex-col items-center gap-0.5 w-full px-1.5">
            {sidebarItems.filter(item => !item.premium || !isPremium).map(item => (
              <a key={item.id} href={item.href} className={`w-full flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[11px] font-semibold transition-all text-center group ${item.premium ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-600' : 'text-slate-900 hover:bg-emerald-50 hover:text-emerald-600'}`}>
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
      <div className="flex-1 flex flex-col min-h-screen lg:pl-[102px]">
        {/* Mobile header */}
        <header className="lg:hidden h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg></button>
          <span className="font-black text-lg text-slate-900">Prépa <span className="text-emerald-600">FPC</span></span>
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
                  <h2 className="text-lg font-black text-white pr-8">Préparation à l'oral</h2>
                  <p className="text-slate-400 text-sm font-medium mt-1">Voici comment se déroule la préparation.</p>
                </div>

                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    {[
                      { icon: <Upload size={18} strokeWidth={2} />, title: 'Importez votre CV en PDF', text: 'Téléchargez votre CV au format PDF (10 Mo max). Il sera analysé pour générer des questions personnalisées.' },
                      { icon: <Sparkles size={18} strokeWidth={2} />, title: 'Analyse intelligente', text: 'Notre IA analyse votre parcours professionnel, vos formations et vos expériences.' },
                      { icon: <MessageCircleQuestion size={18} strokeWidth={2} />, title: '10 questions personnalisées', text: 'Des questions identiques à celles du jury : parcours, motivation, connaissance du métier IDE.' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">{item.icon}</div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{item.title}</p>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleStartFromPopup} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-200/50 text-sm flex items-center justify-center gap-2 cursor-pointer mb-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    C'est parti !
                  </button>

                  <label className="flex items-center gap-2 cursor-pointer justify-center">
                    <input type="checkbox" checked={dontShowAgain} onChange={e => setDontShowAgain(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                    <span className="text-xs text-slate-400 font-medium">Ne plus afficher ce message</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ===== UPLOAD ===== */}
          {step === 'upload' && (
            <div className="animate-fade-in min-h-full lg:h-[calc(100vh-2.5rem)] flex items-center justify-center">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm max-w-2xl w-full p-6 sm:p-10">

                {/* Top bar */}
                <div className="flex items-center justify-end mb-6">
                  <a href="/dashboard" className="bg-slate-900 hover:bg-black text-white font-bold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2">
                    Quitter l'exercice
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </a>
                </div>

                {/* Upload zone */}
                {error && <div className="bg-red-50 border border-red-200 text-red-700 font-bold text-sm p-4 rounded-xl mb-6 text-center">{error}</div>}

                <label className="block cursor-pointer mb-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-3xl p-8 sm:p-12 lg:p-16 text-center transition-all hover:shadow-lg hover:shadow-emerald-100 group">
                    <div className="w-20 h-20 bg-white text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>
                    </div>
                    <p className="font-black text-slate-800 text-xl mb-2">Déposez votre CV ici</p>
                    <p className="text-slate-500 font-medium mb-6">ou cliquez pour parcourir vos fichiers</p>
                    <div className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl transition shadow-lg shadow-emerald-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Importer mon CV
                    </div>
                    <p className="text-xs text-slate-400 mt-4">PDF uniquement — 10 Mo max</p>
                  </div>
                  <input type="file" accept=".pdf,application/pdf" onChange={handleUpload} className="hidden" />
                </label>

                {/* Pas de note */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>
                  <p className="text-sm text-amber-800 font-medium"><strong>Pas de notation !</strong> Le but est seulement de vous préparer au mieux pour le jour J.</p>
                </div>

              </div>
            </div>
          )}

          {/* ===== LOADING (LoaderArc) ===== */}
          {step === 'loading' && (() => {
            const STEPS = [
              { label: 'Analyse de votre profil', desc: 'Lecture de votre CV pour comprendre votre parcours et votre situation actuelle.', at: 0 },
              { label: 'Analyse de vos centres d\'intérêts', desc: 'Vos activités et engagements nourrissent des questions personnalisées.', at: 25 },
              { label: 'Analyse de vos diplômes', desc: 'Vos formations et certifications sont reliées au projet d\'entrée en IFSI.', at: 55 },
              { label: 'Analyse de votre expérience professionnelle', desc: 'Préparation de 10 questions d\'entretien sur mesure, comme devant un vrai jury.', at: 80 },
            ]
            const r = 92
            const circ = 2 * Math.PI * r
            const arcOffset = circ - (loadingProgress / 100) * circ
            const stepIdx = STEPS.reduce((a, s, i) => loadingProgress >= s.at ? i : a, 0)
            return (
              <div className="animate-fade-in min-h-full lg:h-[calc(100vh-2.5rem)] flex items-center justify-center" style={{fontFamily: "'Nunito', sans-serif", '--tc-main': '#059669', '--tc-bright': '#34d399', '--tc-tint': '#d1fae5', '--tc-soft-2': 'rgba(5,150,105,0.08)'}}>
                <style>{`
                  .la-page { padding: 8px; position: relative; width: 100%; }
                  .la-frame { background: white; border-radius: 20px; border: 1px solid #e2e8f0; padding: 20px 16px 18px; max-width: 880px; margin: 0 auto; width: 100%; position: relative; overflow: hidden; box-sizing: border-box; }
                  @media (min-width: 640px) { .la-frame { padding: 48px 48px 40px; border-radius: 28px; } }
                  .la-frame::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at top right, var(--tc-soft-2), transparent 60%); pointer-events: none; }
                  .la-frame > * { position: relative; }
                  .lf-head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
                  @media (min-width: 640px) { .lf-head { gap: 16px; margin-bottom: 28px; } }
                  .lf-icon-chip { width: 44px; height: 44px; border-radius: 12px; background: var(--tc-tint); color: var(--tc-main); display: grid; place-items: center; flex-shrink: 0; }
                  @media (min-width: 640px) { .lf-icon-chip { width: 56px; height: 56px; border-radius: 16px; } }
                  .lf-head-text { flex: 1; min-width: 0; }
                  .lf-head-text h2 { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--tc-main); }
                  .lf-head-text h1 { margin: 2px 0 0; font-size: 18px; font-weight: 900; letter-spacing: -0.02em; color: #0f172a; }
                  @media (min-width: 640px) { .lf-head-text h1 { font-size: 24px; } }
                  .lf-title { font-size: 24px; font-weight: 900; letter-spacing: -0.025em; margin: 6px 0 8px; line-height: 1.1; color: #0f172a; }
                  @media (min-width: 640px) { .lf-title { font-size: 42px; margin: 8px 0 12px; line-height: 1.05; } }
                  .lf-title em { font-style: normal; background: linear-gradient(135deg, var(--tc-main) 0%, var(--tc-bright) 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
                  .lf-sub { font-size: 13px; line-height: 1.5; color: #64748b; margin: 0 0 20px; max-width: 540px; font-weight: 600; }
                  @media (min-width: 640px) { .lf-sub { font-size: 15px; line-height: 1.55; margin: 0 0 32px; } }
                  .anim-arc { display: flex; align-items: center; justify-content: center; gap: 20px; padding: 8px 0 4px; flex-wrap: wrap; }
                  @media (min-width: 640px) { .anim-arc { gap: 56px; padding: 16px 0 8px; } }
                  .arc-wrap { position: relative; width: 180px; height: 180px; flex-shrink: 0; }
                  @media (min-width: 640px) { .arc-wrap { width: 220px; height: 220px; } }
                  .arc-svg { transform: rotate(-90deg); width: 100%; height: 100%; }
                  .arc-track { stroke: #f1f5f9; stroke-width: 10; fill: none; }
                  .arc-fill { stroke: var(--tc-main); stroke-width: 10; fill: none; stroke-linecap: round; }
                  .arc-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
                  .arc-icon { width: 36px; height: 36px; border-radius: 12px; background: var(--tc-tint); color: var(--tc-main); display: grid; place-items: center; margin-bottom: 2px; }
                  @media (min-width: 640px) { .arc-icon { width: 44px; height: 44px; border-radius: 14px; margin-bottom: 4px; } }
                  .arc-percent { font-size: 28px; font-weight: 900; letter-spacing: -0.03em; color: #0f172a; line-height: 1; font-variant-numeric: tabular-nums; }
                  @media (min-width: 640px) { .arc-percent { font-size: 36px; } }
                  .arc-count { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; }
                  @media (min-width: 640px) { .arc-count { font-size: 12px; letter-spacing: 0.08em; } }
                  .arc-count b { color: var(--tc-main); }
                  .arc-side { flex: 1; min-width: 0; max-width: 320px; text-align: center; }
                  @media (min-width: 640px) { .arc-side { min-width: 220px; text-align: left; } }
                  .arc-step-num { font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--tc-main); margin-bottom: 4px; display: inline-flex; align-items: center; gap: 6px; }
                  .arc-step-num::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-main); }
                  .arc-side h3 { margin: 0 0 6px; font-size: 15px; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; }
                  @media (min-width: 640px) { .arc-side h3 { font-size: 18px; margin: 0 0 8px; } }
                  .arc-side p { margin: 0; font-size: 12px; line-height: 1.5; color: #64748b; }
                  @media (min-width: 640px) { .arc-side p { font-size: 14px; line-height: 1.55; } }
                `}</style>
                <div className="la-page">
                  <div className="la-frame">
                    <div className="lf-head">
                      <div className="lf-icon-chip"><MessageCircleQuestion size={26} strokeWidth={1.8} /></div>
                      <div className="lf-head-text">
                        <h2>Oral FPC — entretien personnalisé</h2>
                        <h1>Analyse de votre CV</h1>
                      </div>
                      <a href="/dashboard" className="ml-auto shrink-0 bg-slate-900 hover:bg-black text-white font-bold text-sm px-3 py-2.5 sm:px-5 rounded-xl transition flex items-center gap-2">
                        <span className="hidden sm:inline">Quitter l'exercice</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </a>
                    </div>
                    <h2 className="lf-title">Vos questions sont <em>en préparation</em>.</h2>
                    <p className="lf-sub">Nous parcourons votre CV pour créer vos questions d'entretien personnalisées.<br/>Comme devant un vrai jury.</p>
                    <div className="anim-arc">
                      <div className="arc-wrap">
                        <svg className="arc-svg" width="220" height="220" viewBox="0 0 220 220">
                          <circle className="arc-track" cx="110" cy="110" r={r} />
                          <circle className="arc-fill" cx="110" cy="110" r={r} strokeDasharray={circ} strokeDashoffset={arcOffset} />
                        </svg>
                        <div className="arc-center">
                          <div className="arc-icon"><MessageCircleQuestion size={22} strokeWidth={1.8} /></div>
                          <div className="arc-percent">{Math.round(loadingProgress)}%</div>
                          <div className="arc-count"><b>10</b> questions</div>
                        </div>
                      </div>
                      <div className="arc-side">
                        <div className="arc-step-num">Étape {stepIdx + 1}/{STEPS.length}</div>
                        <h3>{STEPS[stepIdx].label}</h3>
                        <p>{STEPS[stepIdx].desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* ===== QUESTIONS ===== */}
          
         {step === 'questions' && q && (() => {
            const oralMinutes = Math.floor(elapsed / 60)
            const oralSeconds = elapsed % 60
            return (
            <div className="animate-fade-in min-h-[calc(100vh-6rem)] flex items-center justify-center">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col w-full max-w-4xl">

                {/* Header sombre */}
                <div className="bg-slate-900 rounded-t-2xl px-3 sm:px-6 py-3 sm:py-5 overflow-hidden">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <h2 className="text-base sm:text-2xl font-black text-white truncate mr-3">Préparation à l'oral</h2>
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <div className="flex items-center gap-1 sm:gap-2 font-black text-sm sm:text-lg tabular-nums text-white">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        {String(oralMinutes).padStart(2, '0')}:{String(oralSeconds).padStart(2, '0')}
                      </div>
                      <a href="/dashboard" className="hidden sm:flex bg-white/15 hover:bg-white/25 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition items-center gap-2">
                        Quitter l'exercice
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                      <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/15 text-emerald-400">
                        Question {currentQ + 1}/{questions.length}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/15 text-emerald-400">
                        {q.category}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 w-full h-1 bg-white/10 rounded-full">
                    <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{width: `${progress}%`}}></div>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-5 sm:p-6">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 leading-relaxed">{q.question}</h2>

                  <div className="mb-3 relative">
                    <textarea
                      rows={3}
                      value={answers[q.id] || ''}
                      onChange={e => handleAnswer(q.id, e.target.value)}
                      placeholder="Rédigez votre réponse ou utilisez le micro pour dicter..."
                      className="w-full px-4 py-3 pr-14 bg-slate-50 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-400 outline-none font-medium text-sm resize-y transition"
                    />
                    <button onClick={toggleRecording} className={`absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-600 hover:bg-emerald-100 hover:text-emerald-600'}`} title={isRecording ? 'Arrêter le micro' : 'Dicter ma réponse'}>
                      {isRecording ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                      )}
                    </button>
                  </div>


                  {/* Actions */}
                  <div className="flex justify-between mt-4">
                    {currentQ > 0 ? (
                      <button onClick={() => { setCurrentQ(currentQ - 1); setShowTip(false) }} className="bg-slate-100 text-slate-700 font-bold py-3 px-4 sm:px-5 rounded-xl hover:bg-slate-200 flex items-center gap-2 text-sm transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7-7 7 7 7"/></svg>
                        <span className="hidden sm:inline">Précédent</span>
                      </button>
                    ) : <div></div>}
                    {currentQ < questions.length - 1 ? (
                      <button onClick={() => { setCurrentQ(currentQ + 1); setShowTip(false) }} className="bg-slate-900 hover:bg-black text-white font-bold py-3 px-4 sm:px-5 rounded-xl text-sm flex items-center gap-2 shadow-md transition">
                        <span className="hidden sm:inline">Question suivante</span> <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg>
                      </button>
                    ) : (
                      <button onClick={finishExercice} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 sm:px-5 rounded-xl text-sm flex items-center gap-2 shadow-md transition">
                        Terminer l'exercice <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </button>
                    )}
                  </div>

                  {/* Grille navigation */}
                  <div className="mt-4 grid grid-cols-5 sm:grid-cols-10 gap-2 max-w-md mx-auto">
                    {questions.map((qq, i) => (
                      <button key={qq.id} onClick={() => { setCurrentQ(i); setShowTip(false) }} className={`aspect-square rounded-lg text-xs font-bold transition cursor-pointer bg-slate-900 text-white ${i === currentQ ? 'ring-2 ring-offset-2 ring-slate-900' : answers[qq.id] ? 'opacity-100' : 'opacity-40 hover:opacity-60'}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )})()}

        </main>
      </div>
    </div>
  )
}
