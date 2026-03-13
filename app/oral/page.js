'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Home, TrendingUp, RotateCcw, UserRound, BadgeCheck, LogOut, Stethoscope, Upload, Sparkles, MessageCircleQuestion, Lightbulb } from 'lucide-react'

const catColors = {
  'Parcours professionnel': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  'Motivation et projet': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  'Connaissances du métier IDE': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' }
}

const sidebarItems = [
  { id: 'dashboard', label: 'Accueil', href: '/dashboard', icon: Home },
  { id: 'progression', label: 'Mes stats', href: '/dashboard?tab=progression', icon: TrendingUp },
  { id: 'historique', label: 'Historique', href: '/dashboard?tab=historique', icon: RotateCcw },
  { id: 'profil', label: 'Compte', href: '/dashboard?tab=profil', icon: UserRound },
  { id: 'abonnement', label: 'Devenir Premium', href: '/dashboard?tab=abonnement', icon: BadgeCheck, premium: true }
]

export default function OralPage() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [step, setStep] = useState('upload')
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [showTip, setShowTip] = useState(false)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10 * 60)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth'; return }
      setUser(session.user)
      setAuthLoading(false)
      const skipPopup = localStorage.getItem('oral_skip_info') === 'true'
      if (!skipPopup) {
        setShowInfoPopup(true)
      }
    })
  }, [])
  useEffect(() => {
    if (step !== 'loading') return
    const interval = setInterval(() => {
      setLoadingStep(prev => prev < 3 ? prev + 1 : prev)
    }, 3000)
    return () => clearInterval(interval)
  }, [step])

  // Timer 10 min
  useEffect(() => {
    if (!timerActive) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setTimerActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timerActive])

  function handleStartFromPopup() {
    if (dontShowAgain) localStorage.setItem('oral_skip_info', 'true')
    setShowInfoPopup(false)
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
    setLoadingStep(0)
    setStep('loading')

    const formData = new FormData()
    formData.append('pdf', file)

    try {
      const res = await fetch('/api/oral', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || "Erreur lors de l'analyse du CV."); setStep('upload'); return }
      setQuestions(data.questions)
      setTimeLeft(10 * 60)
      setTimerActive(true)
      setStep('questions')
    } catch (err) {
      setError('Erreur de connexion. Réessayez.')
      setStep('upload')
    }
  }

  function handleAnswer(id, value) { setAnswers({ ...answers, [id]: value }) }

  async function finishExercice() {
    setTimerActive(false)
    if (timerRef.current) clearInterval(timerRef.current)
    const durationUsed = Math.round((10 * 60 - timeLeft) / 60)
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
    setStep('upload'); setQuestions([]); setCurrentQ(0); setAnswers({}); setShowTip(false); setFileName(''); setError(''); setLoadingStep(0); setTimeLeft(10 * 60); setTimerActive(false)
  }

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || ''
  const isPremium = false // TODO: brancher sur le statut premium réel
  const q = questions[currentQ]
  const colors = q ? (catColors[q.category] || catColors['Parcours professionnel']) : {}
  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div></div>

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex" style={{backgroundImage: 'radial-gradient(#22c55e 1px, transparent 1px)', backgroundSize: '24px 24px'}}>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes premiumScan { 0%, 80% { opacity: 1; } 85% { opacity: 0.4; transform: scale(1.15); } 90% { opacity: 1; transform: scale(1); filter: brightness(1.5); } 95% { filter: brightness(1); } 100% { opacity: 1; } }
        .premium-scan { animation: premiumScan 5s ease-in-out infinite; }
      `}</style>

      {/* TOAST */}
      {uploadSuccess && (
        <div className="fixed top-4 right-4 z-[100] bg-green-50 border border-green-200 text-green-700 font-bold text-sm px-5 py-3 rounded-xl shadow-lg animate-fade-in flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          Fichier {fileName} uploadé avec succès !
        </div>
      )}

      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-50 flex items-center pl-3 py-5 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <aside className="w-[72px] bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200/60 flex flex-col items-center py-5 h-[calc(100vh-2.5rem)]" style={{fontFamily: "'Nunito', sans-serif"}}>
          <a href="/" className="mb-4"><div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform"><Stethoscope size={20} strokeWidth={2.5} /></div></a>
          <div className="w-7 h-px bg-slate-200 mb-3"></div>
          <nav className="flex-1 flex flex-col items-center gap-0.5 w-full px-1.5">
            {sidebarItems.filter(item => !item.premium || !isPremium).map(item => (
              <a key={item.id} href={item.href} className={`w-full flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[11px] font-bold transition-all text-center group ${item.premium ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-600' : 'text-slate-900 hover:bg-emerald-50 hover:text-emerald-600'}`}>
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
        {/* Mobile header */}
        <header className="lg:hidden h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg></button>
          <span className="font-black text-lg text-slate-900">Prépa <span className="text-red-600">FPC</span></span>
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">{firstName.charAt(0).toUpperCase()}</div>
        </header>

        <main className="flex-grow w-full mx-auto px-4 py-4 sm:py-5">

          {/* ===== POPUP INFO ===== */}
          {showInfoPopup && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={handleStartFromPopup}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>

                <div className="bg-slate-900 px-6 py-5 relative">
                  <button onClick={handleStartFromPopup} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 text-white transition cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                  <h2 className="text-lg font-black text-white pr-8">Préparation à l'oral</h2>
                  <p className="text-slate-400 text-sm font-medium mt-1">Voici comment se déroule la préparation.</p>
                </div>

                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    {[
                      { icon: <Upload size={18} strokeWidth={2} />, title: 'Importez votre CV en PDF', text: 'Téléchargez votre CV au format PDF (10 Mo max). Il sera analysé pour générer des questions personnalisées.' },
                      { icon: <Sparkles size={18} strokeWidth={2} />, title: 'Analyse intelligente par l\'IA', text: 'Notre IA analyse votre parcours professionnel, vos formations et vos expériences.' },
                      { icon: <MessageCircleQuestion size={18} strokeWidth={2} />, title: '10 questions personnalisées', text: 'Des questions identiques à celles du jury : parcours, motivation, connaissance du métier IDE.' },
                      { icon: <Lightbulb size={18} strokeWidth={2} />, title: 'Conseils pour chaque question', text: 'Des pistes de réponse et conseils personnalisés pour préparer votre entretien.' }
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
            <div className="animate-fade-in min-h-[calc(100vh-2.5rem)] flex items-center justify-center">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm max-w-2xl w-full p-6 sm:p-10">

                {/* Top bar */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span className="text-xs font-bold text-amber-600">En dessous de 8/20 = éliminatoire</span>
                  </div>
                  <a href="/dashboard" className="bg-slate-900 hover:bg-black text-white font-bold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2">
                    Quitter l'exercice
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </a>
                </div>

                {/* Upload zone */}
                {error && <div className="bg-red-50 border border-red-200 text-red-700 font-bold text-sm p-4 rounded-xl mb-6 text-center">{error}</div>}

                <label className="block cursor-pointer mb-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-3xl p-12 sm:p-16 text-center transition-all hover:shadow-lg hover:shadow-emerald-100 group">
                    <div className="w-20 h-20 bg-white text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>
                    </div>
                    <p className="font-black text-slate-800 text-xl mb-2">Déposez votre CV ici</p>
                    <p className="text-slate-500 font-medium mb-6">ou cliquez pour parcourir vos fichiers</p>
                    <div className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl transition shadow-lg shadow-emerald-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Importer mon CV
                    </div>
                    <p className="text-xs text-slate-400 mt-4">PDF uniquement — 10 Mo max</p>
                  </div>
                  <input type="file" accept=".pdf,application/pdf" onChange={handleUpload} className="hidden" />
                </label>

                {/* Pas de note */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-200 text-emerald-700 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
                  </div>
                  <p className="text-sm text-slate-700 font-medium"><strong className="text-slate-900">Pas de notation !</strong> Le but est seulement de vous préparer au mieux pour le jour J.</p>
                </div>

              </div>
            </div>
          )}

          {/* ===== LOADING ===== */}
            {step === 'loading' && (
            <div className="animate-fade-in min-h-[calc(100vh-2.5rem)] flex items-center justify-center">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm max-w-xl w-full flex flex-col items-center justify-center py-12 px-8">
              <style>{`
                @keyframes morph { 0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; } 33% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; } 66% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; } }
              `}</style>
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 shadow-xl shadow-emerald-200 mb-8" style={{animation: 'morph 4s ease-in-out infinite'}}></div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Analyse de votre CV en cours...</h2>
              <p className="text-slate-500 font-medium text-sm text-center mb-8">Notre IA parcours votre <strong className="text-slate-700">{fileName}</strong> et prépare vos questions personnalisées.</p>
              <div className="w-full max-w-md space-y-3">
                {[
                  { label: 'Analyse de votre profil'},
                  { label: 'Analyse de vos centres d\'intérêts'},
                  { label: 'Analyse de vos diplômes'},
                  { label: 'Analyse de votre expérience professionnelle'}
                ].map((ls, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${i < loadingStep ? 'bg-green-50 border border-green-200' : i === loadingStep ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-100 opacity-40'}`}>
                    <span className="text-xl">{ls.icon}</span>
                    <span className={`font-bold text-sm flex-grow ${i < loadingStep ? 'text-green-700' : i === loadingStep ? 'text-emerald-700' : 'text-slate-400'}`}>{ls.label}</span>
                    {i < loadingStep && <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                    {i === loadingStep && <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0"></div>}
                    <span className="text-xs font-bold text-slate-400">{i + 1}/4</span>
                  </div>
                ))}
              </div>
            </div>
            </div>
          )}

          {/* ===== QUESTIONS ===== */}
          
         {step === 'questions' && q && (() => {
            const oralMinutes = Math.floor(timeLeft / 60)
            const oralSeconds = timeLeft % 60
            const oralTimePercent = (timeLeft / (10 * 60)) * 100
            const oralUrgent = timeLeft < 2 * 60
            return (
            <div className="relative animate-fade-in">
              <div className="absolute top-0 right-0 flex items-center gap-3">
                <div className={`flex items-center gap-2 ${oralUrgent ? 'animate-pulse' : ''}`}>
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                    <div className={`h-full rounded-full transition-all duration-1000 ${oralUrgent ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${oralTimePercent}%`}}></div>
                  </div>
                  <span className={`font-black text-sm tabular-nums ${oralUrgent ? 'text-red-600' : 'text-slate-700'}`}>
                    {String(oralMinutes).padStart(2, '0')}:{String(oralSeconds).padStart(2, '0')}
                  </span>
                </div>
                <a href="/dashboard" className="bg-slate-900 hover:bg-black text-white font-bold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2">
                  Quitter l'exercice
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </a>
              </div>
              <div className="max-w-3xl mx-auto">
              {/* Wrapper coloré style QCM */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-6 shadow-sm">
                <div className="bg-white rounded-xl sm:rounded-[2rem] shadow-xl flex flex-col overflow-hidden relative">
                  {/* Header */}
                  <div className="relative flex flex-wrap justify-between items-center p-3 sm:p-5 border-b border-slate-100 gap-2">
                    <span className="text-slate-600 font-bold text-xs sm:text-sm tracking-wide">Question {currentQ + 1}/{questions.length}</span>
                    <span className="bg-emerald-100 text-emerald-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide uppercase">{q.category}</span>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50">
                      <div className="h-full bg-slate-900 transition-all duration-500" style={{width: `${progress}%`}}></div>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-5 leading-relaxed">{q.question}</h2>

                    {/* Zone réponse */}
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Votre réponse</label>
                      <textarea
                        rows={5}
                        value={answers[q.id] || ''}
                        onChange={e => handleAnswer(q.id, e.target.value)}
                        placeholder="Rédigez votre réponse ici comme si vous étiez face au jury..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent outline-none font-medium text-sm resize-y"
                      />
                    </div>

                    {/* Conseil */}
                    <button onClick={() => setShowTip(!showTip)} className="flex items-center gap-2 text-sm font-bold bg-amber-400 hover:bg-amber-500 text-black px-4 py-2 rounded-xl transition cursor-pointer mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/></svg>
                      {showTip ? 'Masquer le conseil' : 'Voir le conseil'}
                    </button>
                    {showTip && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2 text-sm text-amber-800 font-medium animate-fade-in">
                        <strong>Conseil :</strong> {q.tips}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 sm:p-5 pt-0 flex gap-3">
                    {currentQ > 0 && (
                      <button onClick={() => { setCurrentQ(currentQ - 1); setShowTip(false) }} className="bg-slate-100 text-slate-700 font-bold py-3 px-4 sm:px-5 rounded-xl hover:bg-slate-200 flex items-center gap-2 text-sm transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7-7 7 7 7"/></svg>
                        <span className="hidden sm:inline">Précédent</span>
                      </button>
                    )}
                    {currentQ < questions.length - 1 ? (
                      <button onClick={() => { setCurrentQ(currentQ + 1); setShowTip(false) }} className="flex-grow bg-slate-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition">
                        Question suivante <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg>
                      </button>
                    ) : (
                      <button onClick={finishExercice} className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition">
                        Terminer l'exercice <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Grille navigation */}
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {questions.map((qq, i) => (
                  <button key={qq.id} onClick={() => { setCurrentQ(i); setShowTip(false) }} className={`w-9 h-9 rounded-lg text-xs font-bold transition cursor-pointer ${i === currentQ ? 'bg-emerald-600 text-white' : answers[qq.id] ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
              </div>
            </div>
          )})()}

        </main>
      </div>
    </div>
  )
}
