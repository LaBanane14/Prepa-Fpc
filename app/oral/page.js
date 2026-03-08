'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const Stethoscope = ({className}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>

const catColors = {
  'Parcours professionnel': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  'Motivation et projet': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  'Connaissances du métier IDE': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' }
}

const sidebarItems = [
  { id: 'dashboard', label: 'Accueil', href: '/dashboard', icon: (a) => <svg className="w-[21px] h-[21px]" fill="none" stroke={a?'#dc2626':'#334155'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { id: 'progression', label: 'Mes stats', href: '/dashboard', icon: (a) => <svg className="w-[21px] h-[21px]" fill="none" stroke={a?'#dc2626':'#334155'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg> },
  { id: 'historique', label: 'Historique', href: '/dashboard', icon: (a) => <svg className="w-[21px] h-[21px]" fill="none" stroke={a?'#dc2626':'#334155'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
  { id: 'profil', label: 'Mon compte', href: '/dashboard', icon: (a) => <svg className="w-[21px] h-[21px]" fill="none" stroke={a?'#dc2626':'#334155'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg> },
  { id: 'abonnement', label: 'Mes offres', href: '/dashboard', icon: (a) => <svg className="w-[21px] h-[21px]" fill="none" stroke={a?'#dc2626':'#334155'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg> }
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth'; return }
      setUser(session.user)
      setAuthLoading(false)
    })
  }, [])

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
    setStep('loading')

    const formData = new FormData()
    formData.append('pdf', file)

    try {
      const res = await fetch('/api/oral', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || "Erreur lors de l'analyse du CV."); setStep('upload'); return }
      setQuestions(data.questions)
      setStep('questions')
    } catch (err) {
      setError('Erreur de connexion. Réessayez.')
      setStep('upload')
    }
  }

  function handleAnswer(id, value) { setAnswers({ ...answers, [id]: value }) }

  function restart() {
    setStep('upload'); setQuestions([]); setCurrentQ(0); setAnswers({}); setShowTip(false); setFileName(''); setError('')
  }

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || ''
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
          <a href="/" className="mb-4"><div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform"><Stethoscope className="w-5 h-5" /></div></a>
          <div className="w-7 h-px bg-slate-200 mb-3"></div>
          <nav className="flex-1 flex flex-col items-center gap-0.5 w-full px-1.5">
            {sidebarItems.map(item => (
              <a key={item.id} href={item.href} className="w-full flex flex-col items-center gap-1 py-3 rounded-xl text-[11px] font-bold transition-all text-slate-600 hover:bg-slate-50">
                {item.icon(false)}
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
          <div className="flex flex-col items-center gap-2 mt-auto pt-3">
            <div className="w-7 h-px bg-slate-200 mb-1"></div>
            <a href="/dashboard" className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition">{firstName.charAt(0).toUpperCase()}</a>
            <button onClick={handleLogout} className="text-slate-300 hover:text-red-500 transition cursor-pointer p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
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

        <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-6 sm:py-10">

          {/* ===== UPLOAD ===== */}
          {step === 'upload' && (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 animate-fade-in">
              {/* Gauche : exactement votre style d'origine */}
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Préparation Oral</h1>
                  <p className="text-slate-500 font-medium max-w-lg mx-auto">Importez votre CV au format PDF. Grâce aux nombreuses données dont nous disposons, nous pouvons analyser votre parcours et générer 10 questions personnalisées semblables à celles posées lors de l'épreuve orale du concours FPC.</p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 font-bold text-sm p-4 rounded-xl mb-6 text-center">{error}</div>}

                <label className="block cursor-pointer">
                  <div className="bg-white border-2 border-dashed border-slate-300 hover:border-red-400 rounded-2xl p-10 sm:p-14 text-center transition-all hover:bg-red-50/30 group">
                    <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-red-100 group-hover:text-red-500 transition-colors">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>
                    </div>
                    <p className="font-bold text-slate-700 mb-1">Cliquez pour importer votre CV</p>
                    <p className="text-sm text-slate-400">Format PDF uniquement — 10 Mo max</p>
                  </div>
                  <input type="file" accept=".pdf,application/pdf" onChange={handleUpload} className="hidden" />
                </label>
              </div>

              {/* Droite : Comment ça marche — fond vert */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 h-fit xl:mt-24">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  Comment ça marche ?
                </h3>
                <div className="space-y-2 text-sm text-slate-600 font-medium">
                  <p><strong className="text-slate-800">1.</strong> Vous importez votre CV au format PDF</p>
                  <p><strong className="text-slate-800">2.</strong> Notre IA spécialisée analyse votre parcours professionnel</p>
                  <p><strong className="text-slate-800">3.</strong> 10 questions personnalisées sont générées (parcours, motivation, métier)</p>
                  <p><strong className="text-slate-800">4.</strong> Vous vous entraînez à répondre avec des conseils pour chaque question</p>
                  <p><strong className="text-slate-800">5.</strong> <strong>Il n'y a pas de note à l'issue des 10 questions, étant donné qu'il s'agit de votre carrière ! Le but est seulement de vous préparer !</strong></p>
                </div>
              </div>
            </div>
          )}

          {/* ===== LOADING ===== */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-slate-200 rounded-full"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Analyse de votre CV en cours...</h2>
              <p className="text-slate-500 font-medium text-sm text-center">Notre IA lit <strong className="text-slate-700">{fileName}</strong> et prépare vos questions personnalisées.</p>
              <p className="text-slate-400 text-xs mt-4">Cela peut prendre 10 à 20 secondes</p>
            </div>
          )}

          {/* ===== QUESTIONS ===== */}
          {step === 'questions' && q && (
            <div className="animate-fade-in max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-500">Question {currentQ + 1}/{questions.length}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${colors.badge}`}>{q.category}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mb-8">
                <div className="h-full bg-red-600 rounded-full transition-all duration-500" style={{width: `${progress}%`}}></div>
              </div>

              <div className={`${colors.bg} border ${colors.border} rounded-2xl p-6 sm:p-8 mb-6`}>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-relaxed">{q.question}</h2>
              </div>

              <button onClick={() => setShowTip(!showTip)} className="flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-700 transition mb-4 cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                {showTip ? 'Masquer le conseil' : 'Voir le conseil'}
              </button>
              {showTip && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 font-medium animate-fade-in">
                  <strong>Conseil :</strong> {q.tips}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Votre réponse</label>
                <textarea
                  rows={5}
                  value={answers[q.id] || ''}
                  onChange={e => handleAnswer(q.id, e.target.value)}
                  placeholder="Rédigez votre réponse ici comme si vous étiez face au jury..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-medium text-sm resize-y"
                />
              </div>

              <div className="flex gap-3">
                {currentQ > 0 && (
                  <button onClick={() => { setCurrentQ(currentQ - 1); setShowTip(false) }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl transition text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7-7 7 7 7"/></svg>
                    Précédent
                  </button>
                )}
                {currentQ < questions.length - 1 ? (
                  <button onClick={() => { setCurrentQ(currentQ + 1); setShowTip(false) }} className="flex-grow bg-slate-900 hover:bg-black text-white font-bold py-3 px-5 rounded-xl transition text-sm flex items-center justify-center gap-2">
                    Question suivante
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg>
                  </button>
                ) : (
                  <button onClick={restart} className="flex-grow bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-5 rounded-xl transition text-sm flex items-center justify-center gap-2">
                    Recommencer avec un nouveau CV
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </button>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {questions.map((qq, i) => (
                  <button key={qq.id} onClick={() => { setCurrentQ(i); setShowTip(false) }} className={`w-9 h-9 rounded-lg text-xs font-bold transition cursor-pointer ${i === currentQ ? 'bg-red-600 text-white' : answers[qq.id] ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
