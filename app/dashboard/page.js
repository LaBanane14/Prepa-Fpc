'use client'
import { useState, useEffect } from 'react'
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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [trialDays, setTrialDays] = useState(7)

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
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Bonjour {firstName} !</h1>
                  <p className="text-slate-500 font-medium text-sm">Prêt(e) à réviser pour le concours ?</p>
                </div>
                {trialDays > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 px-4 py-2 rounded-xl flex items-center gap-2 shadow-md shadow-amber-200/50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      <span className="font-black text-sm">{trialDays}j restant{trialDays > 1 ? 's' : ''}</span>
                    </div>
                    <a href="/tarifs" className="bg-slate-900 hover:bg-black text-white font-bold text-sm px-4 py-2 rounded-xl transition shadow-md">Devenir premium</a>
                  </div>
                )}
                {trialDays === 0 && (
                  <a href="/tarifs" className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 font-black text-sm px-5 py-2.5 rounded-xl shadow-md shadow-amber-200/50 hover:shadow-lg transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Devenir premium
                  </a>
                )}
              </div>

              {/* ENTRAÎNEMENTS */}
              <h2 className="text-lg font-black text-slate-900 mb-4">Commencer à m'entraîner</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                <a href="/qcm" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-200 transition group block">
                  <div className="w-11 h-11 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Entraînement mathématiques</h3>
                  <p className="text-xs text-slate-500">QCM calculs de doses, pourcentages, conversions</p>
                </a>
                <a href="/qcm" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition group block">
                  <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Entraînement spécifique</h3>
                  <p className="text-xs text-slate-500">Produit en croix, équations, calcul mental</p>
                </a>
                <a href="/blog" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-200 transition group block">
                  <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Entraînement rédactionnel</h3>
                  <p className="text-xs text-slate-500">Culture sanitaire, analyse de situation</p>
                </a>
                <a href="/qcm" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-200 transition group block">
                  <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Examen blanc</h3>
                  <p className="text-xs text-slate-500">Conditions réelles, 1h chronométrée</p>
                </a>
                <a href="/oral" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition group block">
                  <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Questions sur votre parcours</h3>
                  <p className="text-xs text-slate-500">Préparation à l'épreuve orale</p>
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
          {page === 'historique' && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Mon historique</h1>
              <p className="text-slate-500 font-medium text-sm mb-8">Retrouvez vos entraînements passés.</p>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 7v5l3 3"/><circle cx="12" cy="12" r="10"/></svg></div>
                <h3 className="font-black text-slate-900 text-lg mb-2">Aucun entraînement</h3>
                <p className="text-slate-500 font-medium text-sm mb-6">Votre historique est vide. Lancez votre premier QCM !</p>
                <a href="/qcm" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition text-sm">Commencer <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg></a>
              </div>
            </div>
          )}

          {/* ============ MON COMPTE ============ */}
          {page === 'profil' && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Mon compte</h1>
              <p className="text-slate-500 font-medium text-sm mb-8">Gérez vos informations personnelles.</p>
              {profileMsg && <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${profileMsg.startsWith('Erreur') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{profileMsg}</div>}
              <div className="flex flex-col lg:flex-row gap-6">
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
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 lg:w-[380px] h-fit">
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

          {/* ============ MES OFFRES ============ */}
          {page === 'abonnement' && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Mes offres</h1>
              <p className="text-slate-500 font-medium text-sm mb-8">Gérez votre formule d'accès.</p>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-xl mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg></div>
                  <div><h3 className="font-black text-slate-900">Plan Gratuit</h3><p className="text-xs text-slate-500 font-medium">Accès limité</p></div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                  {['QCM gratuit (20 questions)', 'Accès au blog'].map((t,i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-600 font-medium"><svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{t}</div>
                  ))}
                  {['Entraînements illimités', 'Examens blancs', 'Annales corrigées'].map((t,i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-400 font-medium"><svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>{t}</div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 max-w-xl">
                <h3 className="text-lg font-black text-white mb-2">Débloquez tout le contenu</h3>
                <p className="text-slate-400 font-medium text-sm mb-6">QCM, calculs de doses, examens blancs et rédactions en illimité.</p>
                <a href="/tarifs" className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-red-900/30 text-sm">Voir les offres à partir de 12,99€/mois</a>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
