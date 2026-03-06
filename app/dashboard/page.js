'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/auth'
        return
      }
      setUser(session.user)
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* NAVBAR DASHBOARD */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="bg-red-600 text-white p-1.5 rounded-lg">
              <img src="/stethoscope.svg" alt="" className="w-5 h-5" />
            </div>
            <span className="font-black text-lg tracking-tight text-slate-900">Prépa <span className="text-red-600">FPC</span></span>
          </a>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500 hidden sm:block">{email}</span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 transition cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Bonjour {firstName} !</h1>
          <p className="text-slate-500 font-medium">Membre depuis le {createdAt}</p>
        </div>

        {/* STATS RAPIDES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">0</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">QCM complétés</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">-</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Score moyen</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">0</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Calculs résolus</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">0</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Rédactions faites</p>
          </div>
        </div>

        {/* ACTIONS RAPIDES */}
        <div className="mb-10">
          <h2 className="text-xl font-black text-slate-900 mb-4">Commencer un entraînement</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="/calculs-doses.html" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-200 transition group cursor-pointer block">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Calculs de doses</h3>
              <p className="text-sm text-slate-500 font-medium">Produits en croix, conversions, débits...</p>
            </a>
            <a href="/blog.html" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-200 transition group cursor-pointer block">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Culture sanitaire</h3>
              <p className="text-sm text-slate-500 font-medium">Fiches de révision et QCM thématiques</p>
            </a>
            <a href="/tarifs.html" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-200 transition group cursor-pointer block">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Examens blancs</h3>
              <p className="text-sm text-slate-500 font-medium">Conditions réelles, 1h chronométrée</p>
            </a>
          </div>
        </div>

        {/* ABONNEMENT */}
        <div className="bg-slate-900 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">Plan gratuit</div>
            </div>
            <h3 className="text-xl font-black text-white mb-1">Passez au niveau supérieur</h3>
            <p className="text-slate-400 font-medium text-sm">Accédez à tous les QCM, calculs et examens blancs en illimité.</p>
          </div>
          <a href="/tarifs.html" className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-red-900/30 shrink-0">
            Voir les offres
          </a>
        </div>

      </div>
    </div>
  )
}
