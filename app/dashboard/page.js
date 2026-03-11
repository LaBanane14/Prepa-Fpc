'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { Home, TrendingUp, RotateCcw, UserRound, BadgeCheck, LogOut, Stethoscope } from 'lucide-react'

const menuItems = [
  { id: 'dashboard', label: 'Accueil', icon: Home },
  { id: 'progression', label: 'Mes stats', icon: TrendingUp },
  { id: 'historique', label: 'Historique', icon: RotateCcw },
  { id: 'profil', label: 'Compte', icon: UserRound },
  { id: 'abonnement', label: 'Devenir Premium', icon: BadgeCheck, premium: true }
]

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div></div>}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(searchParams.get('tab') || 'dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [trialDays, setTrialDays] = useState(7)
  const [showTip, setShowTip] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)

  const [newLastName, setNewLastName] = useState('')
  const [newFirstName, setNewFirstName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [profileMsg, setProfileMsg] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth'; return }
      setUser(session.user)
      setNewFirstName(session.user?.user_metadata?.first_name || '')
      setNewLastName(session.user?.user_metadata?.last_name || '')
      // Calcul trial
      const created = new Date(session.user.created_at)
      const now = new Date()
      const diffMs = now - created
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      setTrialDays(Math.max(0, 7 - diffDays))
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) window.location.href = '/auth'
      else setUser(session.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  const tips = [
    'Pour convertir des mL en L, divisez par 1000.',
    'Un produit en croix se vérifie toujours en multipliant en diagonale.',
    'Relisez l\'énoncé deux fois avant de calculer.',
    'Pour les pourcentages : multiplier par le % puis diviser par 100.',
    '1 g = 1000 mg, à retenir par cœur !',
    'Un débit en gouttes/min = volume (mL) × 20 / temps (min).',
    'Prenez 5 minutes pour relire vos réponses avant de valider.',
    'Entraînez-vous régulièrement : 20 min/jour valent mieux que 3h une fois.',
  ]

  useEffect(() => {
    const interval = setInterval(() => setShowTip(prev => {
      if (prev) setTipIndex(i => (i + 1) % tips.length)
      return !prev
    }), 10000)
    return () => clearInterval(interval)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function updateProfile(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg('')
    const updates = { data: { first_name: newFirstName, last_name: newLastName } }
    if (newPassword) updates.password = newPassword
    const { error } = await supabase.auth.updateUser(updates)
    setProfileSaving(false)
    if (error) setProfileMsg('Erreur : ' + error.message)
    else { setProfileMsg('Profil correctement mis à jour !'); setNewPassword(''); setTimeout(() => setProfileMsg(''), 5000) }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div></div>
  }

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Utilisateur'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const subtitle = hour < 12 ? 'Une petite session de révision ce matin ?' : hour < 18 ? 'C\'est le moment idéal pour réviser !' : 'Une dernière session avant la fin de journée ?'
  const isPremium = false // TODO: brancher sur le statut premium réel
  const email = user?.email || ''
  const createdAt = new Date(user?.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const stats = { qcm: 0, score: '-', calculs: 0, redactions: 0 }
  const categories = [
    { name: 'Calculs de dose', color: 'bg-red-500', progress: 0 },
    { name: 'Pourcentages', color: 'bg-purple-500', progress: 0 },
    { name: 'Produit en croix', color: 'bg-amber-500', progress: 0 },
    { name: 'Calcul mental', color: 'bg-blue-500', progress: 0 },
    { name: 'Équations', color: 'bg-emerald-500', progress: 0 },
    { name: 'Conversions', color: 'bg-orange-500', progress: 0 }
  ]

  function navigateTo(id) { setPage(id); setSidebarOpen(false) }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex" style={{fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes premiumScan { 0%, 80% { opacity: 1; } 85% { opacity: 0.4; transform: scale(1.15); } 90% { opacity: 1; transform: scale(1); filter: brightness(1.5); } 95% { filter: brightness(1); } 100% { opacity: 1; } }
        .premium-scan { animation: premiumScan 5s ease-in-out infinite; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* SIDEBAR FLOTTANTE */}
      <div className={`fixed inset-y-0 left-0 z-50 flex items-center pl-3 py-5 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <aside className="w-[72px] bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200/60 flex flex-col items-center py-5 h-[calc(100vh-2.5rem)]" style={{fontFamily: "'Nunito', sans-serif"}}>
          <a href="/" className="mb-4">
            <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform">
              <Stethoscope size={20} strokeWidth={2.5} />
            </div>
          </a>
          <div className="w-7 h-px bg-slate-200 mb-3"></div>

          <nav className="flex-1 flex flex-col items-center gap-0.5 w-full px-1.5">
            {menuItems.filter(item => !item.premium || !isPremium).map(item => (
              <button key={item.id} onClick={() => navigateTo(item.id)} className={`w-full flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center group ${item.premium ? (page === item.id ? 'bg-amber-50 text-amber-600' : 'text-amber-500 hover:bg-amber-50 hover:text-amber-600') : (page === item.id ? 'bg-red-50 text-red-600' : 'text-slate-900 hover:bg-red-50 hover:text-red-600')}`}>
                <item.icon size={21} strokeWidth={1.6} className={`transition-transform duration-200 group-hover:scale-125 ${item.premium ? 'premium-scan' : ''}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex flex-col items-center gap-2 mt-auto pt-3">
            <div className="w-7 h-px bg-slate-200 mb-1"></div>
            <button onClick={() => navigateTo('profil')} className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${page === 'profil' ? 'bg-red-600 text-white ring-2 ring-red-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              {firstName.charAt(0).toUpperCase()}
            </button>
            <button onClick={handleLogout} className="text-slate-900 hover:text-red-500 transition cursor-pointer p-1">
              <LogOut size={16} strokeWidth={1.8} />
            </button>
          </div>
        </aside>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-[90px]">
        {/* Mobile top bar */}
        <header className="lg:hidden h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <span className="font-black text-lg text-slate-900">Prépa <span className="text-red-600">FPC</span></span>
          <button onClick={() => navigateTo('profil')} className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">{firstName.charAt(0).toUpperCase()}</button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">

          {/* ============ ACCUEIL ============ */}
          {page === 'dashboard' && (
            <div>
              {/* Header + Trial */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">{greeting} {firstName} !</h1>
                  <div className="relative h-5">
                    <p className={`text-slate-500 font-medium text-sm absolute inset-x-0 transition-all duration-500 ${showTip ? 'opacity-0 -translate-y-3' : 'opacity-100 translate-y-0'}`}>{subtitle}</p>
                    <p className={`text-slate-500 font-medium text-sm absolute inset-x-0 transition-all duration-500 whitespace-nowrap ${showTip ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>💡 {tips[tipIndex]}</p>
                  </div>
                </div>
                {trialDays > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 px-4 py-2 rounded-xl flex items-center gap-2 shadow-md shadow-amber-200/50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      <span className="font-black text-sm">{trialDays}j restant{trialDays > 1 ? 's' : ''}</span>
                    </div>
                    <button onClick={() => setPage('abonnement')} className="bg-slate-900 hover:bg-black text-white font-bold text-sm px-4 py-2 rounded-xl transition shadow-md cursor-pointer">Devenir premium</button>
                  </div>
                )}
                {trialDays === 0 && (
                  <button onClick={() => setPage('abonnement')} className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 font-black text-sm px-5 py-2.5 rounded-xl shadow-md shadow-amber-200/50 hover:shadow-lg transition flex items-center gap-2 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Devenir premium
                  </button>
                )}
              </div>

              {/* ENTRAÎNEMENTS */}
              <h2 className="text-lg font-black text-slate-900 mb-4">Commencer à m'entraîner</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
                <a href="/qcm" className="bg-white p-5 rounded-2xl border-2 border-blue-600 shadow-sm hover:shadow-md transition group flex flex-col items-center text-center">
                  <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Entraînement spécifique</h3>
                  <p className="text-xs text-slate-500 flex-1">Produit en croix, équations, calcul mental</p>
                  <span className="text-[10px] mt-2">&nbsp;</span>
                </a>
                <a href="/qcm" className="bg-white p-5 rounded-2xl border-2 border-red-600 shadow-sm hover:shadow-md transition group flex flex-col items-center text-center relative">
                  <span className="absolute top-2 right-2 text-[9px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">30 min</span>
                  <div className="w-11 h-11 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Entraînement mathématiques</h3>
                  <p className="text-xs text-slate-500 flex-1">QCM calculs de doses, pourcentages, conversions</p>
                  <span className="text-[10px] font-black text-red-600 mt-2">Note /10</span>
                </a>
                <a href="/redaction" className="bg-white p-5 rounded-2xl border-2 border-purple-600 shadow-sm hover:shadow-md transition group flex flex-col items-center text-center relative">
                  <span className="absolute top-2 right-2 text-[9px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">30 min</span>
                  <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Entraînement rédactionnel</h3>
                  <p className="text-xs text-slate-500 flex-1">Culture sanitaire, analyse de situation</p>
                  <span className="text-[10px] font-black text-purple-600 mt-2">Note /10</span>
                </a>
                <a href="/qcm" className="bg-white p-5 rounded-2xl border-2 border-yellow-500 shadow-sm hover:shadow-md transition group flex flex-col items-center text-center relative">
                  <span className="absolute top-2 right-2 text-[9px] font-black text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded-md">1H</span>
                  <div className="w-11 h-11 bg-yellow-50 text-yellow-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Examen blanc</h3>
                  <p className="text-xs text-slate-500 flex-1">Conditions réelles, 1h chronométrée</p>
                  <span className="text-[10px] font-black text-yellow-500 mt-2">Note /20</span>
                </a>
                <a href="/oral" className="bg-white p-5 rounded-2xl border-2 border-emerald-600 shadow-sm hover:shadow-md transition group flex flex-col items-center text-center">
                  <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Questions sur votre parcours</h3>
                  <p className="text-xs text-slate-500 flex-1">Préparation à l'épreuve orale</p>
                  <span className="text-[10px] mt-2">&nbsp;</span>
                </a>
              </div>

              {/* STATS RAPIDES */}
              <h2 className="text-lg font-black text-slate-900 mb-4">Mon aperçu</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'QCM complétés', value: stats.qcm, color: 'bg-red-50 text-red-600', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg> },
                  { label: 'Score moyen', value: stats.score, color: 'bg-green-50 text-green-600', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg> },
                  { label: 'Calculs résolus', value: stats.calculs, color: 'bg-blue-50 text-blue-600', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
                  { label: 'Rédactions', value: stats.redactions, color: 'bg-amber-50 text-amber-600', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg> }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
                    <p className="text-2xl font-black text-slate-900">{s.value}</p>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* CTA Premium */}
              <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2"><span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Plan gratuit</span></div>
                  <h3 className="text-lg font-black text-white mb-1">Passez au niveau supérieur</h3>
                  <p className="text-slate-400 font-medium text-sm">QCM, calculs et examens blancs en illimité.</p>
                </div>
                <a href="/tarifs" className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-red-900/30 shrink-0 text-sm">Voir les offres</a>
              </div>
            </div>
          )}

          {/* ============ MES STATS ============ */}
          {page === 'progression' && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Mes stats</h1>
              <p className="text-slate-500 font-medium text-sm mb-8">Suivez votre avancement dans chaque domaine.</p>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {categories.map((cat, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-900 text-sm">{cat.name}</h3>
                      <span className="text-xs font-black text-slate-400">{cat.progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${cat.color} rounded-full transition-all duration-500`} style={{width: `${cat.progress}%`}}></div>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-2">0 exercice complété</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg></div>
                <h3 className="font-black text-slate-900 text-lg mb-2">Commencez à vous entraîner</h3>
                <p className="text-slate-500 font-medium text-sm mb-6">Vos statistiques apparaîtront ici dès votre premier entraînement.</p>
                <a href="/qcm" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition text-sm">Lancer un QCM <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg></a>
              </div>
            </div>
          )}

          {/* ============ MON HISTORIQUE ============ */}
          {page === 'historique' && (() => {
            // TODO: remplacer par les vraies données depuis Supabase
            const fakeHistory = []

            const calMonth = window.__calMonth ?? 2
            const calYear = window.__calYear ?? 2026
            const selectedDay = window.__calDay ?? null

            const setCalMonth = (m) => { window.__calMonth = m; setPage('historique') }
            const setCalYear = (y) => { window.__calYear = y; setPage('historique') }
            const setSelectedDay = (d) => { window.__calDay = d; setPage('historique') }

            const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
            const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

            const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
            const firstDayOfWeek = (new Date(calYear, calMonth, 1).getDay() + 6) % 7

            const exercisesByDay = {}
            fakeHistory.forEach(h => {
              if (!exercisesByDay[h.day]) exercisesByDay[h.day] = []
              exercisesByDay[h.day].push(h)
            })

            const getTypeColor = (type) => {
              if (type === 'QCM') return 'red'
              if (type === 'Oral') return 'emerald'
              return 'blue'
            }

            const getTypesForDay = (day) => {
              const items = exercisesByDay[day] || []
              return [...new Set(items.map(i => i.type))]
            }

            const prevMonth = () => {
              if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
              else setCalMonth(calMonth - 1)
              window.__calDay = null
            }
            const nextMonth = () => {
              if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
              else setCalMonth(calMonth + 1)
              window.__calDay = null
            }

            const dayItems = selectedDay ? (exercisesByDay[selectedDay] || []) : []

            return (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Mon historique</h1>
              <p className="text-slate-500 font-medium text-sm mb-6">Retrouvez vos entraînements passés.</p>

              {/* Stats rapides */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
                  <p className="text-2xl font-black text-slate-900">{fakeHistory.length}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase mt-1">Exercices</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
                  <p className="text-2xl font-black text-red-600">—<span className="text-sm">/20</span></p>
                  <p className="text-xs font-bold text-slate-400 uppercase mt-1">Moyenne</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
                  <p className="text-2xl font-black text-slate-900">—<span className="text-sm">/20</span></p>
                  <p className="text-xs font-bold text-slate-400 uppercase mt-1">Meilleur score</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
                  <p className="text-2xl font-black text-slate-900">0h00</p>
                  <p className="text-xs font-bold text-slate-400 uppercase mt-1">Temps total</p>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* Calendrier */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:w-[420px] shrink-0">
                  {/* Navigation mois */}
                  <div className="flex items-center justify-between mb-6">
                    <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer">
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <h3 className="font-black text-slate-900">{monthNames[calMonth]} {calYear}</h3>
                    <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer">
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </div>

                  {/* Jours de la semaine */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(d => (
                      <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">{d}</div>
                    ))}
                  </div>

                  {/* Grille des jours */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1
                      const types = getTypesForDay(day)
                      const hasExercises = types.length > 0
                      const isSelected = selectedDay === day
                      const isToday = day === 10 && calMonth === 2 && calYear === 2026

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDay(isSelected ? null : day)}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm font-bold transition cursor-pointer relative
                            ${isSelected ? 'bg-red-600 text-white' : isToday ? 'bg-red-50 text-red-600 border border-red-200' : hasExercises ? 'bg-slate-50 hover:bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                          <span>{day}</span>
                          {hasExercises && !isSelected && (
                            <div className="flex gap-0.5">
                              {types.map(t => (
                                <div key={t} className={`w-1.5 h-1.5 rounded-full ${t === 'QCM' ? 'bg-red-500' : t === 'Oral' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                              ))}
                            </div>
                          )}
                          {hasExercises && isSelected && (
                            <div className="flex gap-0.5">
                              {types.map(t => (
                                <div key={t} className="w-1.5 h-1.5 rounded-full bg-white/70"></div>
                              ))}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Légende */}
                  <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[10px] font-bold text-slate-400">QCM</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-bold text-slate-400">Oral</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[10px] font-bold text-slate-400">Examen</span></div>
                  </div>
                </div>

                {/* Détail du jour sélectionné */}
                <div className="flex-1">
                  {selectedDay ? (
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{selectedDay} {monthNames[calMonth]} {calYear}</h3>
                      {dayItems.length > 0 ? (
                        <div className="space-y-3">
                          {dayItems.map(item => {
                            const color = getTypeColor(item.type)
                            return (
                              <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color === 'red' ? 'bg-red-100 text-red-600' : color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                  {item.type === 'QCM' && <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
                                  {item.type === 'Oral' && <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>}
                                  {item.type === 'Examen' && <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm text-slate-900 truncate">{item.label}</p>
                                  <p className="text-xs text-slate-400 font-medium">{item.time} · {item.questions} questions · {item.duration}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  {item.score ? (
                                    <span className={`text-sm font-black ${parseInt(item.score) >= 15 ? 'text-emerald-600' : parseInt(item.score) >= 10 ? 'text-amber-600' : 'text-red-600'}`}>{item.score}</span>
                                  ) : (
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">Terminé</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                          <p className="text-slate-400 font-bold text-sm">Aucun exercice ce jour-là.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center h-full flex flex-col items-center justify-center">
                      <div className="w-14 h-14 bg-slate-100 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <p className="font-bold text-slate-900 mb-1">Sélectionnez un jour</p>
                      <p className="text-sm text-slate-400 font-medium">Cliquez sur un jour du calendrier pour voir vos exercices.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )
          })()}

          {/* ============ MON COMPTE ============ */}
          {page === 'profil' && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Mon compte</h1>
              <p className="text-slate-500 font-medium text-sm mb-8">Gérez vos informations personnelles.</p>
              {profileMsg && <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${profileMsg.startsWith('Erreur') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{profileMsg}</div>}
              <div className="flex flex-col lg:flex-row lg:items-stretch gap-6">
                <form onSubmit={updateProfile} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5 flex-1">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Adresse email</label>
                    <input type="email" value={email} disabled className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-400 cursor-not-allowed"/>
                    <p className="text-xs text-slate-400 mt-1">L'email ne peut pas être modifié.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Prénom</label>
                      <input type="text" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent outline-none font-medium"/>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom</label>
                      <input type="text" value={newLastName} onChange={e => setNewLastName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent outline-none font-medium"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Mot de passe</label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => { supabase.auth.resetPasswordForEmail(email); setProfileMsg('Email de réinitialisation envoyé !'); setTimeout(() => setProfileMsg(''), 5000) }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-5 py-3 rounded-xl transition flex items-center gap-2 cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Modifier le mot de passe
                      </button>
                      <button type="button" onClick={() => navigateTo('abonnement')} className="bg-amber-400 hover:bg-amber-500 text-black font-bold text-sm px-5 py-3 rounded-xl transition flex items-center gap-2 cursor-pointer">
                        <BadgeCheck size={16} strokeWidth={2} />
                        {isPremium ? 'Gérer mon abonnement' : 'Devenir Premium'}
                      </button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={profileSaving} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-red-600/20 text-sm">{profileSaving ? 'Enregistrement...' : 'Sauvegarder'}</button>
                  </div>
                </form>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 lg:w-[380px]">
                  <h3 className="font-black text-slate-900 mb-4">Informations du compte</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500 font-medium">Email</span><span className="font-bold text-slate-900">{email}</span></div>
                    <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500 font-medium">Membre depuis</span><span className="font-bold text-slate-900">{createdAt}</span></div>
                    <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500 font-medium">Connexion</span><span className="font-bold text-slate-900">{user?.app_metadata?.provider === 'google' ? 'Google' : 'Email'}</span></div>
                    <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500 font-medium">Dernière connexion</span><span className="font-bold text-slate-900">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span></div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Email vérifié</span>
                      {user?.email_confirmed_at ? (
                        <span className="flex items-center gap-1.5 text-red-600 font-bold"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Vérifié</span>
                      ) : (
                        <button onClick={async () => { await supabase.auth.resend({ type: 'signup', email }); setProfileMsg('Email de vérification envoyé !') }} className="bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          Vérifier mon email
                        </button>
                      )}
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Premium</span>
                      {isPremium ? (
                        <span className="text-red-600 font-bold">Oui</span>
                      ) : (
                        <span className="text-slate-400 font-bold">Non</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ DEVENIR PREMIUM ============ */}
          {page === 'abonnement' && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Devenir Premium</h1>
              <p className="text-slate-500 font-medium text-sm mb-8">Choisissez la formule qui s'adapte le plus à votre besoin.</p>
              <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-[90%]">

                {/* Essai Gratuit */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col transition hover:shadow-md">
                  <div className="mb-6">
                    <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">Essai Gratuit</h3>
                    <p className="text-slate-500 font-bold text-sm">Testez la plateforme pendant 7 jours.</p>
                  </div>
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">0€</span>
                      <span className="text-slate-500 font-bold">/ 7 jours</span>
                    </div>
                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase">Sans carte bancaire</p>
                  </div>
                  <div className="flex-1">
                    <ul className="space-y-3 mb-8">
                      {["Entrainement rédaction et mathématique illimités", "Entrainement à partir d'annales", "Examen blanc écrit", "Dashboard personnalisable", "Méthodologie Dossier & Oral"].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                          <div className="bg-slate-200 p-0.5 rounded-md shrink-0"><svg className="w-3.5 h-3.5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="w-full py-3.5 bg-slate-50 border border-slate-200 text-slate-700 font-black rounded-xl text-center text-sm">Expire dans {trialDays} jour{trialDays > 1 ? 's' : ''}</div>
                </div>

                {/* Formule Mensuelle */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col transition hover:shadow-md">
                  <div className="mb-6">
                    <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">Formule Mensuelle</h3>
                    <p className="text-slate-500 font-bold text-sm">Flexibilité totale, sans engagement.</p>
                  </div>
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1 text-red-600">
                      <span className="text-3xl font-black tracking-tight">12,99€</span>
                      <span className="text-slate-500 font-bold">/mois</span>
                    </div>
                    <p className="text-red-500 text-xs font-bold mt-1 uppercase">Renouvellement automatique</p>
                  </div>
                  <div className="flex-1">
                    <ul className="space-y-3 mb-8">
                      {["Entrainement rédaction et mathématique illimités", "Entrainement à partir d'annales", "Examen blanc écrit", "Dashboard personnalisable", "Résiliable à tout moment"].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                          <div className="bg-red-100 p-0.5 rounded-md shrink-0"><svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-center transition shadow-lg shadow-red-200 text-sm cursor-pointer">S'abonner maintenant</button>
                </div>

                {/* Pack Sérénité */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-red-600 shadow-lg shadow-red-100 relative flex flex-col overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">40% d'Économie</div>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">Pack Sérénité</h3>
                    <p className="text-slate-500 font-bold text-sm">Accès complet pendant 1 an.</p>
                  </div>
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1 text-red-600">
                      <span className="text-3xl font-black tracking-tight">89,99€</span>
                      <span className="text-slate-500 font-bold">pour 1 an</span>
                    </div>
                    <p className="text-red-500 text-xs font-black mt-1 uppercase">1 seul paiement · Pas de renouvellement</p>
                  </div>
                  <div className="flex-1">
                    <ul className="space-y-3 mb-8">
                      {["Entrainement rédaction et mathématique illimités", "Entrainement à partir d'annales", "Examen blanc écrit", "Dashboard personnalisable", "Méthodologie Dossier & Oral"].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                          <div className="bg-red-100 p-0.5 rounded-md shrink-0"><svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-center transition shadow-lg shadow-red-200 text-sm cursor-pointer">S'abonner maintenant</button>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
