'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const Stethoscope = ({className}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
const Check = ({className}) => <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>

export default function TarifsPage() {
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
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const navLinks = [
    { href: '/', label: 'Accueil', active: false },
    { href: '/calculs-doses.html', label: 'Calculs de doses', active: false },
    { href: '/blog', label: 'Blog', active: false },
    { href: '/tarifs', label: 'Tarifs', active: true }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-red-200">
      <style>{`html { scroll-behavior: smooth; scroll-padding-top: 7rem; }`}</style>

      {/* NAVIGATION */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="bg-red-600 text-white p-2 rounded-xl shadow-sm">
              <Stethoscope className="w-7 h-7" />
            </div>
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

      {/* HEADER TARIFS */}
      <header className="pt-16 pb-12 bg-white border-b border-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Aborder le concours FPC <span className="text-red-600">sereinement</span>.</h1>
          <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">Accédez à tous les outils spécifiques pour réussir votre épreuve de sélection FPC. Choisissez la formule qui s'adapte le plus à votre besoin.</p>
        </div>
      </header>

      {/* SECTION CARTES DE PRIX */}
      <section className="py-16 md:py-24 relative">
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(circle, #dc2626 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch">

            {/* Plan Mensuel */}
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col relative transition hover:shadow-md">
              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Formule Mensuelle</h3>
                <p className="text-slate-500 font-bold text-sm">Flexibilité totale pour réviser à votre rythme.<br/>Sans engagement.</p>
              </div>
              <div className="mb-10">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">12,99€</span>
                  <span className="text-slate-500 font-bold">/mois</span>
                </div>
                <p className="text-slate-400 text-xs font-bold mt-2 uppercase">- Renouvellement automatique</p>
              </div>
              <div className="flex-1">
                <ul className="space-y-4 mb-10">
                  {["Entrainement rédaction et mathématique illimités", "Entrainement à partir d'annales", "Examen blanc écrit", "Dashboard personnalisable", "Résiliable à tout moment"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                      <Check className="w-5 h-5 text-slate-300 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <a href="/signup" className="w-full py-4 px-6 bg-slate-50 hover:bg-slate-100 text-slate-900 font-black rounded-2xl text-center transition border border-slate-200 block">S'abonner maintenant</a>
            </div>

            {/* Pack Sérénité */}
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border-2 border-red-600 shadow-[0_20px_50px_rgba(220,38,38,0.1)] relative flex flex-col transform md:scale-105 z-10 overflow-hidden">
              <div className="absolute -right-10 -top-10 text-red-50 opacity-10 transform rotate-12">
                <Stethoscope className="w-48 h-48" />
              </div>
              <div className="absolute top-6 right-8">
                <div className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">40% d'Économie</div>
              </div>
              <div className="mb-8 relative">
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Pack Sérénité</h3>
                <p className="text-slate-500 font-bold text-sm">Accès complet au site pendant 1 an.</p>
              </div>
              <div className="mb-10 relative">
                <div className="flex items-baseline gap-1 text-red-600">
                  <span className="text-4xl font-black tracking-tight">89,99€</span>
                  <span className="text-slate-500 font-bold">pour 1 an</span>
                </div>
                <p className="text-red-500 text-xs font-black mt-2 uppercase tracking-wide">- 1 seul paiement<br/>- Pas de renouvellement automatique</p>
              </div>
              <div className="flex-1 relative">
                <ul className="space-y-4 mb-10">
                  {["Entrainement rédaction et mathématique illimités", "Entrainement à partir d'annales", "Examen blanc écrit", "Dashboard personnalisable", "Méthodologie Dossier & Oral"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                      <div className="bg-red-100 p-1 rounded-md flex-shrink-0"><Check className="w-4 h-4 text-red-600" /></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <a href="/signup" className="w-full py-5 px-6 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl text-center transition shadow-lg shadow-red-600/30 text-lg relative block">S'abonner maintenant</a>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION RÉASSURANCE */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="flex flex-col items-center text-center">
            <svg className="w-8 h-8 text-red-500 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Paiement 100% sécurisé</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <svg className="w-8 h-8 text-red-500 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Cartes bancaires</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <svg className="w-8 h-8 text-red-500 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Activation immédiate</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <svg className="w-8 h-8 text-red-500 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Sans engagement (Mensuel)</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 bg-[#635BFF] rounded-lg flex items-center justify-center mb-3">
              <svg className="h-4" viewBox="0 0 60 25" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M60 12.8C60 8.55 57.95 5.18 54.04 5.18C50.11 5.18 47.72 8.55 47.72 12.77C47.72 17.73 50.53 20.33 54.52 20.33C56.47 20.33 57.95 19.87 59.08 19.22V16.08C57.95 16.66 56.65 17.01 55.01 17.01C53.4 17.01 51.97 16.43 51.79 14.5H59.96C59.96 14.29 60 13.33 60 12.8ZM51.73 11.73C51.73 9.88 52.78 9.1 54.02 9.1C55.22 9.1 56.21 9.88 56.21 11.73H51.73ZM41.3 5.18C39.67 5.18 38.6 5.95 38.01 6.48L37.81 5.41H34.38V24.84L38.19 24.03V20.1C38.8 20.53 39.69 21.14 41.28 21.14C44.54 21.14 47.5 18.55 47.5 12.72C47.48 7.41 44.48 5.18 41.3 5.18ZM40.45 17.36C39.36 17.36 38.72 16.97 38.29 16.5L38.19 9.36C38.66 8.83 39.32 8.47 40.45 8.47C42.22 8.47 43.45 10.42 43.45 12.9C43.45 15.43 42.24 17.36 40.45 17.36ZM29.1 4.13L32.93 3.32V0.12L29.1 0.92V4.13ZM29.1 5.43H32.93V20.85H29.1V5.43ZM24.76 6.62L24.52 5.43H21.15V20.85H24.96V9.75C25.87 8.55 27.4 8.78 27.87 8.95V5.43C27.38 5.24 25.67 4.9 24.76 6.62ZM17.01 1.69L13.28 2.48L13.26 16.29C13.26 18.57 14.95 20.35 17.23 20.35C18.48 20.35 19.4 20.12 19.91 19.85V16.64C19.42 16.83 17.01 17.53 17.01 15.25V8.73H19.91V5.43H17.01V1.69ZM5.26 9.36C5.26 8.7 5.8 8.43 6.67 8.43C7.94 8.43 9.54 8.83 10.81 9.55V5.93C9.42 5.37 8.05 5.16 6.67 5.16C3.49 5.16 1.38 6.86 1.38 9.55C1.38 13.76 7.08 13.1 7.08 14.89C7.08 15.68 6.42 15.95 5.49 15.95C4.1 15.95 2.33 15.39 0.92 14.58V18.25C2.49 18.93 4.08 19.22 5.49 19.22C8.75 19.22 10.98 17.57 10.98 14.84C10.96 10.29 5.26 11.09 5.26 9.36Z" fill="white"/></svg>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Partenaire de paiement</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 text-sm">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope className="w-5 h-5 text-red-500" />
              <h4 className="text-white font-bold text-lg">Prépa FPC</h4>
            </div>
            <p className="max-w-xs leading-relaxed">La plateforme d'entraînement de référence pour la réussite du concours infirmier (Aides-Soignants et Auxiliaires de Puériculture).</p>
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
