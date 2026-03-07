'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const Stethoscope = ({className}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>

const colorMap = {
  blue: { bg: 'from-blue-50 to-indigo-50', text: 'text-blue-600', icon: 'text-blue-200' },
  amber: { bg: 'from-amber-50 to-orange-50', text: 'text-amber-600', icon: 'text-amber-200' },
  emerald: { bg: 'from-emerald-50 to-green-50', text: 'text-emerald-600', icon: 'text-emerald-200' },
  purple: { bg: 'from-purple-50 to-fuchsia-50', text: 'text-purple-600', icon: 'text-purple-200' },
  rose: { bg: 'from-rose-50 to-pink-50', text: 'text-rose-600', icon: 'text-rose-200' },
  red: { bg: 'from-red-50 to-rose-50', text: 'text-red-600', icon: 'text-red-200' }
}

export default function BlogPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    fetchArticles()
    return () => subscription.unsubscribe()
  }, [])

  async function fetchArticles() {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('date', { ascending: false })
    if (!error) setArticles(data)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const navLinks = [
    { href: '/', label: 'Accueil', active: false },
    { href: '/calculs-doses.html', label: 'Calculs de doses', active: false },
    { href: '/blog', label: 'Blog', active: true },
    { href: '/tarifs', label: 'Tarifs', active: false }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-red-200 flex flex-col">
      <style>{`
        .article-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .article-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); }
      `}</style>

      {/* NAVIGATION */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="bg-red-600 text-white p-2 rounded-xl shadow-sm"><Stethoscope className="w-7 h-7" /></div>
            <div>
              <span className="font-black text-2xl tracking-tight text-slate-900 block leading-none">Prépa <span className="text-red-600">FPC</span></span>
              <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">La passerelle IFSI</span>
            </div>
          </a>
          <div className="hidden md:flex items-center gap-8 font-semibold text-slate-600">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} className={link.active ? 'text-red-600' : 'hover:text-red-600 transition'}>{link.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            {!authLoading && (user ? (
              <>
                <a href="/dashboard" className="hidden md:inline-flex bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-red-200 transition transform hover:-translate-y-0.5 text-sm">Mon tableau de bord</a>
                <button onClick={handleLogout} className="hidden md:block text-slate-400 hover:text-red-600 transition cursor-pointer"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>
              </>
            ) : (
              <>
                <a href="/login" className="hidden md:block text-slate-600 font-bold hover:text-slate-900 transition text-sm">Connexion</a>
                <a href="/signup" className="hidden md:inline-flex bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-slate-200 transition transform hover:-translate-y-0.5 text-sm">Inscription</a>
              </>
            ))}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white pb-4 shadow-lg absolute w-full z-40">
            <div className="max-w-6xl mx-auto px-4 pt-4 space-y-2">
              {navLinks.map(link => (
                <a key={link.label} href={link.href} className={`block py-3 px-4 rounded-xl font-bold transition ${link.active ? 'text-red-600 bg-red-50' : 'text-slate-700 hover:bg-slate-50'}`}>{link.label}</a>
              ))}
              <div className="pt-2 border-t border-slate-100 mt-2 flex flex-col gap-2">
                {user ? (
                  <>
                    <a href="/dashboard" className="block py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition text-center">Mon espace</a>
                    <button onClick={handleLogout} className="block py-3 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition text-center w-full">Déconnexion</button>
                  </>
                ) : (
                  <>
                    <a href="/login" className="block py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition text-center">Connexion</a>
                    <a href="/signup" className="block py-3 px-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-black transition text-center">Inscription</a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 pt-16 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">Toutes les informations pour <span className="text-red-600">réussir le FPC</span></h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">Actualités, conseils et astuces pour réussir au mieux votre sélection d'entrée en IFSI.</p>
        </div>
      </header>

      {/* ARTICLES */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map(article => {
              const colors = colorMap[article.category_color] || colorMap.blue
              return (
                <a key={article.id} href={`/blog/${article.slug}`} className="article-card bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                  <div className={`h-48 relative flex items-center justify-center bg-gradient-to-br ${colors.bg}`}>
                    <svg className={`w-16 h-16 ${colors.icon}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <span className={`${colors.text} font-bold text-xs uppercase tracking-wider mb-3 block`}>{article.category}</span>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2">{article.title}</h3>
                    <p className="text-slate-600 text-sm mb-6 flex-grow line-clamp-3">{article.excerpt}</p>
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto text-sm text-slate-500 font-medium">
                      <span>{new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="text-slate-900 font-bold hover:text-red-600 transition-colors flex items-center gap-1">Lire <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg></span>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 text-sm mt-auto">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4"><Stethoscope className="w-5 h-5 text-red-500" /><h4 className="text-white font-bold text-lg">Prépa FPC</h4></div>
            <p className="max-w-xs leading-relaxed">La plateforme d'entraînement de référence pour la réussite du concours infirmier.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Ressources IFSI</h4>
            <ul className="space-y-3">
              <li><a href="/blog" className="hover:text-white transition">Dates concours FPC</a></li>
              <li><a href="/blog" className="hover:text-white transition">Dossier Passerelle AS/AP</a></li>
              <li><a href="/calculs-doses.html" className="hover:text-white transition">Formules calculs de doses</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Légal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white transition">Mentions légales</a></li>
              <li><a href="#" className="hover:text-white transition">CGV &amp; CGU</a></li>
              <li><a href="mailto:contact@prepa-fpc.fr" className="hover:text-white transition">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center">
          <p>&copy; 2026 Prépa FPC (passerelle-fpc.fr). Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
