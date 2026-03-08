'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const Stethoscope = ({className}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>

const menuItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg> },
  { id: 'progression', label: 'Progression', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { id: 'historique', label: 'Historique', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { id: 'profil', label: 'Mon profil', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id: 'abonnement', label: 'Abonnement', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 10h20"/><rect width="22" height="16" x="1" y="4" rx="2"/><path d="M6 16h.01"/><path d="M10 16h.01"/></svg> }
]

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Profil state
  const [newFirstName, setNewFirstName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [profileMsg, setProfileMsg] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth'; return }
      setUser(session.user)
      setNewFirstName(session.user?.user_metadata?.first_name || '')
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
    const updates = { data: { first_name: newFirstName } }
    if (newPassword) updates.password = newPassword
    const { error } = await supabase.auth.updateUser(updates)
    setProfileSaving(false)
    if (error) setProfileMsg('Erreur : ' + error.message)
    else { setProfileMsg('Profil mis à jour !'); setNewPassword('') }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Utilisateur'
  const email = user?.email || ''
  const createdAt = new Date(user?.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  // Données placeholder
  const stats = { qcm: 0, score: '-', calculs: 0, redactions: 0 }
  const categories = [
    { name: 'Calculs de dose', color: 'bg-red-500', progress: 0 },
    { name: 'Pourcentages', color: 'bg-purple-500', progress: 0 },
    { name: 'Produit en croix', color: 'bg-amber-500', progress: 0 },
    { name: 'Calcul mental', color: 'bg-blue-500', progress: 0 },
    { name: 'Équations', color: 'bg-emerald-500', progress: 0 },
    { name: 'Conversions', color: 'bg-orange-500', progress: 0 }
  ]
  const historique = []

  function navigateTo(id) {
    setPage(id)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">

      {/* OVERLAY MOBILE */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* SIDEBAR */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100 shrink-0">
          <a href="/" className="flex items-center gap-2.5">
            <div className="bg-red-600 text-white p-1.5 rounded-lg">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-black text-lg tracking-tight text-slate-900">Prépa <span className="text-red-600">FPC</span></span>
          </a>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => navigateTo(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${page === item.id ? 'bg-red-50 text-red-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* User card bottom */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-sm shrink-0">{firstName.charAt(0).toUpperCase()}</div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-900 truncate">{firstName}</p>
              <p className="text-xs text-slate-400 truncate">{email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar mobile */}
        <header className="lg:hidden h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <span className="font-black text-lg text-slate-900">Prépa <span className="text-red-600">FPC</span></span>
          <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-sm">{firstName.charAt(0).toUpperCase()}</div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">

          {/* PAGE: DASHBOARD */}
          {page === 'dashboard' && (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Bonjour {firstName} !</h1>
                <p className="text-slate-500 font-medium text-sm">Membre depuis le {createdAt}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'QCM complétés', value: stats.qcm, color: 'bg-red-100 text-red-600', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                  { label: 'Score moyen', value: stats.score, color: 'bg-green-100 text-green-600', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg> },
                  { label: 'Calculs résolus', value: stats.calculs, color: 'bg-blue-100 text-blue-600', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/></svg> },
                  { label: 'Rédactions faites', value: stats.redactions, color: 'bg-amber-100 text-amber-600', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
                    <p className="text-2xl font-black text-slate-900">{s.value}</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <h2 className="text-lg font-black text-slate-900 mb-4">Commencer un entraînement</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <a href="/qcm" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-200 transition group block">
                  <div className="w-11 h-11 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">QCM Mathématiques</h3>
                  <p className="text-xs text-slate-500 font-medium">20 questions variées</p>
                </a>
                <a href="/calculs-doses" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition group block">
                  <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Calculs de doses</h3>
                  <p className="text-xs text-slate-500 font-medium">Formules et exercices</p>
                </a>
                <a href="/blog" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-200 transition group block">
                  <div className="w-11 h-11 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Culture sanitaire</h3>
                  <p className="text-xs text-slate-500 font-medium">Articles et fiches</p>
                </a>
              </div>

              {/* Abonnement */}
              <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Plan gratuit</span>
                  </div>
                  <h3 className="text-lg font-black text-white mb-1">Passez au niveau supérieur</h3>
                  <p className="text-slate-400 font-medium text-sm">QCM, calculs et examens blancs en illimité.</p>
                </div>
                <a href="/tarifs" className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-red-900/30 shrink-0 text-sm">Voir les offres</a>
              </div>
            </div>
          )}

          {/* PAGE: PROGRESSION */}
          {page === 'progression' && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Progression par catégorie</h1>
              <p className="text-slate-500 font-medium text-sm mb-8">Suivez votre avancement dans chaque domaine de l'épreuve.</p>

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
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <h3 className="font-black text-slate-900 text-lg mb-2">Commencez à vous entraîner</h3>
                <p className="text-slate-500 font-medium text-sm mb-6">Vos statistiques de progression apparaîtront ici dès votre premier entraînement.</p>
                <a href="/qcm" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition text-sm">
                  Lancer un QCM <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg>
                </a>
              </div>
            </div>
          )}

          {/* PAGE: HISTORIQUE */}
          {page === 'historique' && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Historique des entraînements</h1>
              <p className="text-slate-500 font-medium text-sm mb-8">Retrouvez tous vos entraînements passés.</p>

              {historique.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mb-2">Aucun entraînement</h3>
                  <p className="text-slate-500 font-medium text-sm mb-6">Votre historique est vide. Lancez votre premier QCM pour commencer !</p>
                  <a href="/qcm" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition text-sm">
                    Commencer maintenant <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg>
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {historique.map((h, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{h.type}</h3>
                        <p className="text-xs text-slate-500 font-medium">{h.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">{h.score}</p>
                        <p className="text-xs text-slate-400 font-medium">{h.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PAGE: PROFIL */}
          {page === 'profil' && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Mon profil</h1>
              <p className="text-slate-500 font-medium text-sm mb-8">Gérez vos informations personnelles.</p>

              {profileMsg && (
                <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${profileMsg.startsWith('Erreur') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{profileMsg}</div>
              )}

              <form onSubmit={updateProfile} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5 max-w-xl">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Adresse email</label>
                  <input type="email" value={email} disabled className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-400 cursor-not-allowed"/>
                  <p className="text-xs text-slate-400 mt-1">L'email ne peut pas être modifié.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Prénom</label>
                  <input type="text" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent outline-none font-medium"/>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Nouveau mot de passe</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Laisser vide pour ne pas changer" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent outline-none font-medium"/>
                  <p className="text-xs text-slate-400 mt-1">Minimum 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial.</p>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={profileSaving} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-red-600/20 text-sm">
                    {profileSaving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
                  </button>
                </div>
              </form>

              <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-xl">
                <h3 className="font-black text-slate-900 mb-1">Informations du compte</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Email</span>
                    <span className="font-bold text-slate-900">{email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Membre depuis</span>
                    <span className="font-bold text-slate-900">{createdAt}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Méthode de connexion</span>
                    <span className="font-bold text-slate-900">{user?.app_metadata?.provider === 'google' ? 'Google' : 'Email'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: ABONNEMENT */}
          {page === 'abonnement' && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Mon abonnement</h1>
              <p className="text-slate-500 font-medium text-sm mb-8">Gérez votre formule d'accès.</p>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-xl mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">Plan Gratuit</h3>
                    <p className="text-xs text-slate-500 font-medium">Accès limité aux fonctionnalités</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      QCM gratuit (20 questions)
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      Accès au blog
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-medium">
                      <svg className="w-4 h-4 text-slate-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      Entraînements illimités
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-medium">
                      <svg className="w-4 h-4 text-slate-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      Examens blancs
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-medium">
                      <svg className="w-4 h-4 text-slate-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      Annales corrigées
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 max-w-xl">
                <h3 className="text-lg font-black text-white mb-2">Débloquez tout le contenu</h3>
                <p className="text-slate-400 font-medium text-sm mb-6">Accédez à tous les QCM, calculs de doses, examens blancs et rédactions en illimité.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="/tarifs" className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-red-900/30 text-center text-sm">
                    Voir les offres à partir de 12,99€/mois
                  </a>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
