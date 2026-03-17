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
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', hoverBorder: 'hover:border-blue-400', iconBg: 'bg-blue-100', gradient: 'from-blue-500 to-blue-600', light: 'bg-blue-50', badge: 'bg-blue-50 text-blue-600', wrapper: 'bg-blue-100/60', progressBar: 'bg-blue-600', ring: 'focus:ring-blue-300 focus:border-blue-400' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', hoverBorder: 'hover:border-amber-400', iconBg: 'bg-amber-100', gradient: 'from-amber-500 to-amber-600', light: 'bg-amber-50', badge: 'bg-amber-50 text-amber-600', wrapper: 'bg-amber-100/60', progressBar: 'bg-amber-500', ring: 'focus:ring-amber-300 focus:border-amber-400' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', hoverBorder: 'hover:border-emerald-400', iconBg: 'bg-emerald-100', gradient: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50', badge: 'bg-emerald-50 text-emerald-600', wrapper: 'bg-emerald-100/60', progressBar: 'bg-emerald-500', ring: 'focus:ring-emerald-300 focus:border-emerald-400' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', hoverBorder: 'hover:border-purple-400', iconBg: 'bg-purple-100', gradient: 'from-purple-500 to-purple-600', light: 'bg-purple-50', badge: 'bg-purple-50 text-purple-600', wrapper: 'bg-purple-100/60', progressBar: 'bg-purple-500', ring: 'focus:ring-purple-300 focus:border-purple-400' }
}

export default function SpecifiquePage() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [step, setStep] = useState('choix') // null, choix, epreuve, correcting, resultat
  const [selectedFamille, setSelectedFamille] = useState(null)
  const [sujet, setSujet] = useState(null)
  const [error, setError] = useState('')
  const [loadingFamille, setLoadingFamille] = useState(null)
  const [correction, setCorrection] = useState(null)

  // Question par question
  const [current, setCurrent] = useState(0)
  const [reponses, setReponses] = useState({})

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
    setError('')

    try {
      const res = await fetch('/api/specifique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generer', famille: famille.id })
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || 'Erreur lors de la génération.'); setLoadingFamille(null); return }
      setSujet(data.sujet)
      setReponses({})
      setCurrent(0)
      setLoadingFamille(null)
      setStep('epreuve')
    } catch (err) {
      setError('Erreur de connexion. Réessayez.')
      setLoadingFamille(null)
    }
  }

  function goNext() {
    if (current < sujet.questions.length - 1) setCurrent(current + 1)
  }

  function goPrev() {
    if (current > 0) setCurrent(current - 1)
  }

  async function handleSubmitAll() {
    setError('')
    setStep('correcting')

    try {
      const res = await fetch('/api/specifique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'corriger', exercices: sujet.questions, reponses })
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || 'Erreur lors de la correction.'); setStep('epreuve'); return }
      setCorrection(data.correction)
      await supabase.from('historique').insert({
        user_id: user.id,
        type: 'Spécifique',
        label: selectedFamille.titre,
        note: data.correction.note,
        note_max: data.correction.noteMax,
        nb_questions: sujet.questions.length,
        duration_minutes: null,
      })
      setStep('resultat')
    } catch (err) {
      setError('Erreur de connexion. Réessayez.')
      setStep('epreuve')
    }
  }

  function restart() {
    setStep('choix'); setSujet(null); setReponses({}); setError(''); setLoadingFamille(null); setSelectedFamille(null); setCurrent(0); setCorrection(null)
  }

  function retryFamille() {
    if (selectedFamille) startExercice(selectedFamille)
    else restart()
  }

  async function handleLogout() { await supabase.auth.signOut(); window.location.href = '/' }

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || ''
  const isPremium = false
  const c = selectedFamille ? colorMap[selectedFamille.color] : colorMap.blue
  const data = sujet?.questions?.[current]
  const progress = sujet ? ((current + 1) / sujet.questions.length) * 100 : 0
  const answeredCount = sujet ? sujet.questions.filter(q => reponses[q.id]?.trim()).length : 0

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex" style={{backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px'}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
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

      {/* ===== CHOIX FAMILLE ===== */}
      {step === 'choix' && (
        <div className="animate-fade-in min-h-screen flex flex-col items-center justify-center px-4 relative">
          <a href="/dashboard" className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </a>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Choisissez une famille</p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-bold text-sm px-5 py-3 rounded-xl mb-6 flex items-center gap-2 max-w-2xl w-full">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl w-full">
            {familles.map(f => {
              const fc = colorMap[f.color]
              const isLoading = loadingFamille === f.id
              return (
                <button key={f.id} onClick={() => !loadingFamille && startExercice(f)} disabled={!!loadingFamille} className={`bg-white p-6 rounded-2xl border-2 ${fc.border} ${!loadingFamille ? fc.hoverBorder : ''} shadow-sm hover:shadow-md transition text-left group relative ${loadingFamille && !isLoading ? 'opacity-40 cursor-not-allowed' : isLoading ? 'cursor-wait' : 'cursor-pointer'}`}>
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-10">
                      <div className={`w-8 h-8 ${fc.text} border-t-transparent rounded-full animate-spin`} style={{borderWidth: '3px', borderStyle: 'solid', borderColor: 'currentColor', borderTopColor: 'transparent'}}></div>
                    </div>
                  )}
                  <div className={`w-12 h-12 ${fc.iconBg} ${fc.text} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {f.icon}
                  </div>
                  <h2 className="text-base font-black text-slate-900 mb-1">{f.titre}</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== ÉPREUVE ===== */}
      {step === 'epreuve' && sujet && data && selectedFamille && (
        <div className="flex-grow w-full max-w-3xl mx-auto py-4 sm:py-6">
          <div className="w-full max-w-2xl mx-auto relative mt-2 sm:mt-4">
            <a href="/dashboard" className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 z-20 w-9 h-9 sm:w-10 sm:h-10 bg-slate-900 hover:bg-black text-white rounded-full flex items-center justify-center transition shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </a>

            <div className={`${c.wrapper} rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-6 shadow-sm`}>
              <div className="bg-white rounded-xl sm:rounded-[2rem] shadow-xl flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="relative flex flex-wrap justify-between items-center p-3 sm:p-5 border-b border-slate-100 gap-2">
                  <span className="text-slate-600 font-bold text-xs sm:text-sm tracking-wide">Question {current + 1}/{sujet.questions.length}</span>
                  <span className={`${c.badge} px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide uppercase`}>{selectedFamille.titre}</span>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50">
                    <div className={`h-full ${c.progressBar} transition-all duration-500`} style={{width: `${progress}%`}}></div>
                  </div>
                </div>

                {/* Question + input */}
                <div className="p-4 sm:p-6 flex-grow">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-5 leading-relaxed">{data.question}</h2>
                  <input
                    type="text"
                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 ${c.ring} transition placeholder:text-slate-400`}
                    placeholder="Votre réponse..."
                    value={reponses[data.id] || ''}
                    onChange={(e) => setReponses(prev => ({ ...prev, [data.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (current < sujet.questions.length - 1) goNext() } }}
                  />
                </div>

                {/* Actions */}
                <div className="p-4 sm:p-5 pt-0 flex gap-3">
                  {current > 0 && (
                    <button onClick={goPrev} className="bg-slate-100 text-slate-700 font-bold py-3 px-4 sm:px-5 rounded-xl transition-colors hover:bg-slate-200 flex items-center justify-center gap-2 text-sm cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7-7 7 7 7"/></svg>
                      <span className="hidden sm:inline">Précédent</span>
                    </button>
                  )}
                  {current < sujet.questions.length - 1 ? (
                    <button onClick={goNext} className="flex-grow bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-colors hover:bg-black flex items-center justify-center gap-2 text-sm sm:text-base shadow-md cursor-pointer">
                      Question suivante <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </button>
                  ) : (
                    <button onClick={handleSubmitAll} className={`flex-grow bg-gradient-to-r ${c.gradient} text-white font-bold py-3 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer`}>
                      Soumettre ({answeredCount}/{sujet.questions.length})
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation rapide */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {sujet.questions.map((q, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`w-8 h-8 rounded-lg font-bold text-xs transition cursor-pointer ${i === current ? 'bg-slate-900 text-white' : reponses[q.id]?.trim() ? `${c.iconBg} ${c.text}` : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== CORRECTING ===== */}
      {step === 'correcting' && selectedFamille && (
        <div className="flex-grow flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-4">
            <div className={`w-10 h-10 ${c.text} rounded-full animate-spin`} style={{borderWidth: '3px', borderStyle: 'solid', borderColor: 'currentColor', borderTopColor: 'transparent'}}></div>
            <p className="text-slate-600 font-bold text-sm">Correction en cours...</p>
          </div>
        </div>
      )}

      {/* ===== RÉSULTATS ===== */}
      {step === 'resultat' && correction && selectedFamille && (
        <div className="flex-grow flex items-center justify-center py-8 sm:py-12">
          <div className="max-w-3xl w-full bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 border border-slate-100 relative overflow-hidden">

            <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-slate-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

            <a href="/dashboard" className="absolute top-5 right-5 sm:top-6 sm:right-6 p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors z-20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </a>

            <div className="relative z-10 text-center">
              <div className="mb-2">
                <span className={`${c.badge} px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase`}>{selectedFamille.titre}</span>
              </div>

              <div className="flex justify-center items-center mb-4 mt-4">
                <span className={`text-6xl sm:text-7xl font-black ${c.text} tracking-tighter`}>{correction.note}</span>
                <span className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tighter">/{correction.noteMax}</span>
              </div>

              <p className="text-slate-600 mb-8 font-medium text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
                {correction.appreciation}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                <button onClick={retryFamille} className={`bg-gradient-to-r ${c.gradient} text-white font-bold py-3.5 px-6 rounded-xl transition shadow-lg text-sm flex items-center gap-2 cursor-pointer`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                  Recommencer
                </button>
                <button onClick={restart} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition text-sm cursor-pointer">
                  Changer de famille
                </button>
                <a href="/dashboard" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition text-sm">
                  Dashboard
                </a>
              </div>

              {/* Corrections détaillées */}
              <div className="text-left space-y-4">
                {correction.corrections?.map((cr, i) => (
                  <div key={i} className={`border rounded-xl p-4 ${cr.correct === true ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${cr.correct === true ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{cr.id}</div>
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-slate-800 text-sm">{cr.question}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className={`text-xs font-bold ${cr.correct === true ? 'text-green-700' : 'text-red-600'}`}>Votre réponse : {cr.reponse_candidat || '(vide)'}</span>
                          {!cr.correct && <span className="text-xs font-bold text-green-700">Attendue : {cr.reponse_attendue}</span>}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${cr.correct === true ? 'bg-green-500' : 'bg-red-500'}`}>
                        {cr.correct === true ? (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        ) : (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        )}
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 sm:p-4 border border-white/40 shadow-sm">
                      <div className="text-sm text-slate-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{__html: cr.explication}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

        </main>
      </div>
    </div>
  )
}
