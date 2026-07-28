'use client'
import { useState, useEffect, useRef } from 'react'

// MAQUETTE DE TRAVAIL — structure et animations de la home Mobbin recréées de zéro,
// contenus Prépa FPC en placeholder. Base de travail pour la future landing.
// Non reliée à la navigation du site. Ne pas indexer / ne pas déployer telle quelle.

// ---- Données placeholder ----

const MODULES = [
  // Gélule
  { label: 'Calculs de doses', bg: 'linear-gradient(145deg, #ef4444, #dc2626)', ink: '#ffffff', accent: '#dc2626', icon: (c) => <svg className="w-11 h-11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg> },
  // Livre ouvert
  { label: 'Rédaction', bg: 'linear-gradient(145deg, #a5b4fc, #818cf8)', ink: '#1e1b4b', accent: '#6366f1', icon: (c) => <svg className="w-11 h-11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  // Stéthoscope
  { label: 'Oral', bg: 'linear-gradient(145deg, #fcd34d, #fbbf24)', ink: '#451a03', accent: '#e5a50c', icon: (c) => <svg className="w-11 h-11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg> },
  // Presse-papiers validé
  { label: 'Examen blanc', bg: 'linear-gradient(145deg, #f9a8d4, #f472b6)', ink: '#500724', accent: '#ec4899', icon: (c) => <svg className="w-11 h-11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg> },
  // Cœur avec pouls
  { label: 'Culture sanitaire', bg: 'linear-gradient(145deg, #67e8f9, #22d3ee)', ink: '#083344', accent: '#0eb5d4', icon: (c) => <svg className="w-11 h-11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg> },
  // Chapeau de diplômé
  { label: 'Annales', bg: 'linear-gradient(145deg, #cbd5e1, #94a3b8)', ink: '#0f172a', accent: '#64748b', icon: (c) => <svg className="w-11 h-11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg> },
]

// Icônes médicales / éducation pour le second ticker
const TICKER_MEDICAL = [
  // Seringue
  { label: 'Injections', bg: 'linear-gradient(145deg, #fecaca, #fca5a5)', ink: '#450a0a', icon: (c) => <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg> },
  // Microscope
  { label: 'Sciences', bg: 'linear-gradient(145deg, #c7d2fe, #a5b4fc)', ink: '#1e1b4b', icon: (c) => <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg> },
  // Thermomètre
  { label: 'Constantes', bg: 'linear-gradient(145deg, #fed7aa, #fdba74)', ink: '#431407', icon: (c) => <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg> },
  // Croix médicale
  { label: 'Soins', bg: 'linear-gradient(145deg, #bbf7d0, #86efac)', ink: '#052e16', icon: (c) => <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2Z"/></svg> },
  // Éprouvette
  { label: 'Dilutions', bg: 'linear-gradient(145deg, #a5f3fc, #67e8f9)', ink: '#083344', icon: (c) => <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2"/><path d="M8.5 2h7"/><path d="M14.5 16h-5"/></svg> },
  // Électrocardiogramme
  { label: 'Rythmes', bg: 'linear-gradient(145deg, #fbcfe8, #f9a8d4)', ink: '#500724', icon: (c) => <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg> },
  // Crayon
  { label: 'Écriture', bg: 'linear-gradient(145deg, #fde68a, #fcd34d)', ink: '#451a03', icon: (c) => <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> },
  // Cahier
  { label: 'Révisions', bg: 'linear-gradient(145deg, #ddd6fe, #c4b5fd)', ink: '#2e1065', icon: (c) => <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9.5 8h5"/><path d="M9.5 12H16"/><path d="M9.5 16H14"/></svg> },
]

const SCREENS = [
  { titre: 'Calcul de doses', from: '#fee2e2', to: '#fecaca' },
  { titre: 'Analyse de texte', from: '#e0e7ff', to: '#c7d2fe' },
  { titre: 'Conversions', from: '#dcfce7', to: '#bbf7d0' },
  { titre: 'Question du jury', from: '#fef3c7', to: '#fde68a' },
  { titre: 'Produit en croix', from: '#fae8ff', to: '#f5d0fe' },
  { titre: 'Annale 2025', from: '#e2e8f0', to: '#cbd5e1' },
  { titre: 'Pourcentages', from: '#ffedd5', to: '#fed7aa' },
  { titre: 'Culture sanitaire', from: '#cffafe', to: '#a5f3fc' },
]

const TABS = ['Calculs', 'Rédaction', 'Oral', 'Examens blancs']

// ---- Composants animés ----

// Pile d'icônes animée du hero : la carte du dessus s'envole, la suivante prend sa place
function AppLogoStack({ onChange }) {
  const [index, setIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const indexRef = useRef(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setLeaving(true)
      // Notifier dès le début de l'envol : la bascule du titre (840 ms, couleur
      // changée à mi-course = 420 ms) tombe pile quand la nouvelle tuile apparaît
      const next = (indexRef.current + 1) % MODULES.length
      onChangeRef.current?.(MODULES[next])
      setTimeout(() => { indexRef.current = next; setIndex(next); setLeaving(false) }, 420)
    }, 2400)
    return () => clearInterval(interval)
  }, [])
  const mod = MODULES[index]
  return (
    <div className="relative w-[88px] h-[88px] mx-auto" aria-hidden="true">
      <div className="absolute inset-0 rounded-[24px] bg-[#ececec]" style={{transform: 'translateY(-14px) scale(0.84)'}}></div>
      <div className="absolute inset-0 rounded-[24px] bg-[#f7f7f7] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" style={{transform: 'translateY(-7px) scale(0.92)'}}></div>
      <div
        key={index}
        className="tuile-entree absolute inset-0 rounded-[24px] flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.14)]"
        style={{
          background: mod.bg,
          transition: leaving ? 'transform 0.42s cubic-bezier(0.55,0.06,0.68,0.19), opacity 0.42s cubic-bezier(0.55,0.06,0.68,0.19)' : 'none',
          transform: leaving ? 'translateY(-34px) scale(0.9)' : undefined,
          opacity: leaving ? 0 : undefined,
        }}
      >
        {mod.icon(mod.ink)}
      </div>
    </div>
  )
}

// Mot façon horloge à palettes : il bascule sur son axe, disparaît sur la
// tranche, et se redéploie dans la nouvelle couleur quand `color` change
function FlipWord({ color, children }) {
  const prevRef = useRef(color)
  const [anim, setAnim] = useState({ shown: color, key: 0 })
  useEffect(() => {
    if (color === prevRef.current) return
    const nouvelle = color
    prevRef.current = color
    // Relancer la bascule en gardant l'ancienne couleur, puis échanger à
    // mi-course (420 ms) — au même instant que l'arrivée de la nouvelle tuile
    setAnim(a => ({ shown: a.shown, key: a.key + 1 }))
    const t = setTimeout(() => setAnim(a => ({ ...a, shown: nouvelle })), 420)
    return () => clearTimeout(t)
  }, [color])
  return (
    <span key={anim.key} className="flip-word" style={{ color: anim.shown, transition: 'none' }}>{children}</span>
  )
}

// Section "bibliothèque grandissante" : le contenu reste figé pendant le
// défilement, les tuiles dérivent en parallaxe et le chiffre central change
const SCATTER = [
  { top: '6%', left: '12%', size: 84, depth: 1.3, mod: 0 },
  { top: '4%', left: '22%', size: 84, depth: 0.6, mod: 1 },
  { top: '3%', right: '17%', size: 84, depth: 0.5, mod: 2 },
  { top: '7%', right: '9%', size: 84, depth: 1.0, mod: 3 },
  { top: '38%', left: '5%', size: 84, depth: 0.7, mod: 4 },
  { top: '42%', right: '6%', size: 84, depth: 1.4, mod: 5 },
  { bottom: '9%', left: '13%', size: 84, depth: 1.1, mod: 6 },
  { bottom: '11%', left: '19%', size: 84, depth: 0.3, mod: 7 },
  { bottom: '6%', right: '19%', size: 84, depth: 0.3, mod: 8 },
  { bottom: '12%', right: '10%', size: 84, depth: 1.5, mod: 9 },
  { top: '22%', left: '10%', size: 84, depth: 2.0, mod: 10 },
  { top: '24%', right: '12%', size: 84, depth: 1.8, mod: 11 },
]

function GrowingLibrary() {
  const ALL_ICONS = [...MODULES, ...TICKER_MEDICAL.slice(0, 6)]
  const PHASES = [
    { valeur: 'Déjà 2 200', label: <><span className="surligne">exercices</span> générés</> },
    { valeur: 'Déjà 2 300', label: 'examens blancs générés' },
    { valeur: 'Déjà 250', label: 'sujets de rédaction' },
    { valeur: 'Déjà 40', label: 'annales réelles' },
  ]
  const sectionRef = useRef(null)
  const iconRefs = useRef([])
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    // Pas de throttle rAF : les navigateurs alignent déjà les événements scroll
    // sur les frames, et rAF ne tourne pas si l'onglet est considéré masqué
    const onScroll = () => {
      const el = sectionRef.current
      if (!el) return
      const total = el.offsetHeight - window.innerHeight
      const progress = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total))
      setPhase(Math.min(PHASES.length - 1, Math.floor(progress * PHASES.length)))
      iconRefs.current.forEach((node, i) => {
        if (!node) return
        node.style.transform = `translateY(${(0.5 - progress) * SCATTER[i].depth * 300}px)`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <section ref={sectionRef} className="relative" style={{height: '400vh'}}>
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        {SCATTER.map((s, i) => {
          const m = ALL_ICONS[s.mod % ALL_ICONS.length]
          return (
            <div
              key={i}
              ref={el => { iconRefs.current[i] = el }}
              aria-hidden="true"
              className={`absolute will-change-transform ${i % 3 === 2 ? 'hidden sm:block' : ''}`}
              style={{ top: s.top, bottom: s.bottom, left: s.left, right: s.right, width: s.size, height: s.size }}
            >
              <div
                className="tile-float w-full h-full rounded-[22px] flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                style={{ background: m.bg, animationDuration: `${4.2 + (i % 5) * 0.7}s`, animationDelay: `${-i * 0.9}s` }}
              >
                <div style={{transform: `scale(${s.size / 100})`}}>{m.icon(m.ink)}</div>
              </div>
            </div>
          )
        })}
        <div className="relative z-10 text-center px-5">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-black/80">Un univers de révision dédié à l&apos;examen</h2>
          <div key={phase} className="mt-4">
            <p className="text-5xl sm:text-[5.5rem] font-extrabold tracking-[-0.04em] leading-none overflow-hidden py-1">
              {PHASES[phase].valeur.split('').map((ch, i) => (
                <span key={i} className="char-rise" style={{animationDelay: `${i * 45}ms`}}>{ch === ' ' ? ' ' : ch}</span>
              ))}
            </p>
            <p className="stat-swap mt-3 text-lg sm:text-2xl font-bold text-black/45">{PHASES[phase].label}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// Mini-aperçu d'interface pour chaque module du zigzag (fenêtre d'app factice)
function ApercuModule({ i, bord, teinte, titre, badgeFenetre }) {
  const Barre = ({ w, h = 7, o = 0.1 }) => <div style={{width: w, height: h, background: `rgba(0,0,0,${o})`, borderRadius: 4}}></div>
  // Compte à rebours réel pour les modules chronométrés (maths, rédaction, examen blanc)
  const depart = i === 2 ? 24 * 60 + 59 : i === 3 ? 52 * 60 + 10 : 28 * 60 + 26
  const dureeTotale = i === 3 ? 60 * 60 : 30 * 60
  const accentChrono = i === 2 ? '#c084fc' : i === 3 ? '#facc15' : '#f87171'
  const [tempsRestant, setTempsRestant] = useState(depart)
  useEffect(() => {
    if (i !== 1 && i !== 2 && i !== 3) return
    const t = setInterval(() => setTempsRestant(s => (s <= 0 ? depart : s - 1)), 1000)
    return () => clearInterval(t)
  }, [i, depart])
  const chrono = `${String(Math.floor(tempsRestant / 60)).padStart(2, '0')}:${String(tempsRestant % 60).padStart(2, '0')}`
  return (
    <div className="max-w-sm mx-auto rounded-2xl overflow-hidden bg-white ring-1 ring-black/10 transition-transform duration-300 hover:-translate-y-1.5" style={{boxShadow: `0 18px 45px ${bord}2e`}}>
      {/* Barre de fenêtre — les modules chronométrés ont le vrai chrono d'épreuve sur fond sombre */}
      {i === 1 || i === 2 || i === 3 ? (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0f172a]">
          <span className="text-[11px] font-bold text-white">{titre}</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full rounded-full transition-[width] duration-1000" style={{width: `${(tempsRestant / dureeTotale) * 100}%`, background: accentChrono}}></div>
            </div>
            <svg className="w-7 h-4 heartbeat-anim" viewBox="0 0 80 24" fill="none" stroke={accentChrono} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray: 200, strokeDashoffset: 0}}><polyline points="0,12 15,12 20,12 25,2 30,22 35,6 40,18 45,12 50,12 55,12 60,12 65,8 68,16 70,12 80,12"/></svg>
            <span className="text-[13px] font-black text-white tabular-nums">{chrono}</span>
          </div>
        </div>
      ) : i === 4 ? (
        <div className="flex items-center px-4 py-2.5 bg-[#0f172a]">
          <span className="text-[11px] font-bold text-white">{titre}</span>
          <span className="ml-auto text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{background: bord}}>{badgeFenetre}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-4 py-2.5" style={{background: teinte}}>
          <span className="w-2 h-2 rounded-full" style={{background: `${bord}55`}}></span>
          <span className="w-2 h-2 rounded-full" style={{background: `${bord}55`}}></span>
          <span className="ml-2 text-[11px] font-bold" style={{color: bord}}>{titre}</span>
          <span className="ml-auto text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{background: bord}}>{badgeFenetre}</span>
        </div>
      )}
      {/* Corps selon le module */}
      <div className="p-5">
        {i === 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-black/70">Question 2/10</span>
              <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-md" style={{background: teinte, color: bord}}>Équations et problèmes</span>
            </div>
            <div className="h-1 rounded-full bg-black/[0.07] mb-3.5 overflow-hidden"><div className="h-full rounded-full" style={{width: '20%', background: bord}}></div></div>
            <p className="text-[11px] font-bold text-black/75 leading-snug mb-3">Marc a 3 fois l&apos;âge de sa fille Véronique. Dans 12 ans, il aura 2 fois son âge. Quel est l&apos;âge actuel de Véronique&nbsp;?</p>
            <div className="h-9 rounded-lg ring-1 ring-black/10 bg-black/[0.02] flex items-center px-3 text-[11px] font-medium text-black/35 mb-3">Votre réponse...</div>
            <div className="flex gap-2">
              <div className="h-9 px-3 rounded-lg bg-black/[0.05] flex items-center text-[11px] font-bold text-black/60">← Précédent</div>
              <div className="h-9 flex-1 rounded-lg flex items-center justify-center text-[11px] font-bold text-white" style={{background: bord}}>Valider ✓</div>
            </div>
          </div>
        )}
        {i === 1 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{background: bord}}>1</span>
                <span className="text-[11px] font-extrabold text-black/80">Opérations et conversions</span>
              </div>
              <span className="text-[11px] font-extrabold text-black/70">/3.75</span>
            </div>
            <div className="rounded-md px-2.5 py-2 mb-3 text-[9.5px] font-medium text-black/60 leading-snug" style={{background: teinte, borderLeft: `3px solid ${bord}`}}>Effectuez les opérations suivantes en les posant, puis complétez les conversions.</div>
            {[['1a', 'Posez et calculez : 2 847,65 + 1 392,48'], ['1b', 'Posez et calculez : 756,4 ÷ 14'], ['1c', 'Complétez : 3 250 mg = ……… g']].map(([n, q]) => (
              <div key={n} className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-4 h-4 rounded bg-[#1a1a1a] text-white text-[8px] font-bold flex items-center justify-center shrink-0">{n}</span>
                    <span className="text-[10px] font-bold text-black/75 truncate">{q}</span>
                  </div>
                  <span className="text-[8px] font-bold text-black/35 shrink-0 ml-2">1.25 pts</span>
                </div>
                <div className="h-7 rounded-lg ring-1 ring-black/10 bg-black/[0.02] flex items-center px-2.5 text-[9px] text-black/35">Votre réponse...</div>
              </div>
            ))}
          </div>
        )}
        {i === 2 && (
          <div>
            <div className="rounded-lg bg-[#0f172a] p-3 mb-3">
              <p className="text-[10px] font-extrabold text-white leading-snug mb-1.5">Les cigarettes électroniques jetables (PUFF) et leurs risques chez les adolescents</p>
              <div className="flex gap-1.5">
                <span className="text-[8px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/15 text-[#c4b5fd]">Questions</span>
                <span className="text-[8px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/15 text-white">Sujet créé par nos soins</span>
              </div>
            </div>
            <p className="text-[9px] text-black/55 font-medium leading-relaxed mb-3" style={{display: '-webkit-box', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>Les cigarettes électroniques jetables, communément appelées « PUFF », connaissent une explosion de vente auprès des jeunes depuis 2022. Ces petits appareils colorés, de la taille d&apos;un stylo et vendus environ 5 à 8 euros, contiennent jusqu&apos;à 20 mg/mL de nicotine et offrent entre 500 et 600 bouffées, équivalent à deux paquets de cigarettes classiques. Selon une enquête de Santé Publique France (2024), 18 % des adolescents de 15-17 ans ont essayé une PUFF au cours des six derniers mois...</p>
            <div className="space-y-2 mb-3">
              <Barre w="100%" o={0.08} /><Barre w="96%" o={0.08} /><Barre w="60%" o={0.08} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-black/40">1 240 caractères</span>
              <div className="h-8 px-3.5 rounded-full flex items-center text-[11px] font-bold text-white" style={{background: bord}}>Soumettre</div>
            </div>
          </div>
        )}
        {i === 3 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 rounded-lg p-3 ring-1 ring-black/10">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{background: bord}}>✓</span>
              <span className="text-xs font-bold text-black/70">Partie maths</span>
              <span className="ml-auto text-[10px] font-bold text-black/40">terminée</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg p-3" style={{border: `1.5px solid ${bord}`, background: teinte}}>
              <span className="w-6 h-6 rounded-full ring-1 ring-black/15 bg-white flex items-center justify-center text-xs">✍️</span>
              <span className="text-xs font-bold text-black/70">Partie rédaction</span>
              <span className="ml-auto text-[10px] font-bold" style={{color: bord}}>en cours</span>
            </div>
            <div className="h-2 rounded-full bg-black/[0.08] overflow-hidden"><div className="h-full rounded-full" style={{width: '62%', background: bord}}></div></div>
          </div>
        )}
        {i === 4 && (
          <div className="text-center">
            <div className="rounded-xl p-3.5 mb-7 text-left" style={{background: teinte}}>
              <p className="text-[11px] font-bold leading-snug" style={{color: bord}}>« Pourquoi souhaitez-vous devenir infirmier après votre parcours d&apos;aide-soignant ? »</p>
            </div>
            <div className="relative inline-flex items-center justify-center mb-6">
              <span className="micro-pulse absolute w-16 h-16 rounded-full" style={{background: `${bord}22`}}></span>
              <span className="micro-pulse-retard absolute w-12 h-12 rounded-full" style={{background: `${bord}33`}}></span>
              <span className="micro-beat relative w-9 h-9 rounded-full flex items-center justify-center" style={{background: bord}}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              </span>
            </div>
            <p className="text-[10px] font-bold text-black/40">Répondez à voix haute, puis passez à la suivante</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Pluie de confettis jouée une fois à l'affichage du verdict positif
function ConfettiBurst() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const parent = canvas.parentElement.getBoundingClientRect()
    canvas.width = parent.width
    canvas.height = parent.height
    const ctx = canvas.getContext('2d')
    const couleurs = ['#dc2626', '#f87171', '#fbbf24', '#34d399', '#60a5fa']
    const flocons = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 80,
      vy: 2 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 2,
      r: 3.5 + Math.random() * 3.5,
      col: couleurs[Math.floor(Math.random() * couleurs.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
    }))
    let frames = 0, raf
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      flocons.forEach(f => {
        f.y += f.vy; f.x += f.vx; f.rot += f.vr
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot)
        ctx.fillStyle = f.col; ctx.fillRect(-f.r, -f.r / 2, f.r * 2, f.r)
        ctx.restore()
      })
      if (++frames < 170) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="absolute inset-0 pointer-events-none" aria-hidden="true"></canvas>
}

// Nuage de petits points qui flottent derrière le hero
function ParticleField() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf, w, h
    const dots = []
    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio
      h = canvas.height = canvas.offsetHeight * devicePixelRatio
    }
    resize()
    window.addEventListener('resize', resize)
    const N = Math.round((canvas.offsetWidth * canvas.offsetHeight) / 14000)
    for (let i = 0; i < N; i++) {
      dots.push({
        x: Math.random() * w, y: Math.random() * h,
        r: (Math.random() * 1.6 + 0.8) * devicePixelRatio,
        vx: (Math.random() - 0.5) * 0.35 * devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.3 * devicePixelRatio,
        red: Math.random() < 0.12,
        phase: Math.random() * Math.PI * 2,
      })
    }
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const t = performance.now() / 1000
      for (const d of dots) {
        d.x += d.vx + Math.sin(t * 0.6 + d.phase) * 0.12 * devicePixelRatio
        d.y += d.vy + Math.cos(t * 0.5 + d.phase) * 0.1 * devicePixelRatio
        if (d.x < -10) d.x = w + 10; if (d.x > w + 10) d.x = -10
        if (d.y < -10) d.y = h + 10; if (d.y > h + 10) d.y = -10
        const tw = 0.5 + 0.5 * Math.sin(t * 1.2 + d.phase * 2)
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = d.red ? `rgba(220,38,38,${0.25 + tw * 0.3})` : `rgba(13,13,13,${0.10 + tw * 0.14})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" style={{maskImage: 'radial-gradient(ellipse 75% 70% at 50% 45%, black 30%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 50% 45%, black 30%, transparent 100%)'}} />
}

// Compteur animé au scroll
function CountUp({ target, suffix = '' }) {
  const ref = useRef(null)
  const [val, setVal] = useState(0)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const dur = 1400
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1)
        setVal(Math.round(target * (1 - Math.pow(1 - p, 3))))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])
  return <span ref={ref}>{val.toLocaleString('fr-FR')}{suffix}</span>
}

// Faux écran d'exercice (placeholder de capture)
function ScreenCard({ s, w = 230, h = 460 }) {
  return (
    <div className="shrink-0 rounded-[28px] ring-1 ring-black/5 overflow-hidden relative shadow-[0_8px_30px_rgba(0,0,0,0.07)]" style={{width: w, height: h, background: `linear-gradient(160deg, ${s.from}, ${s.to})`}}>
      <div className="absolute inset-x-4 top-4 bottom-0 bg-white/85 backdrop-blur rounded-t-2xl ring-1 ring-black/5 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg" style={{background: s.to}}></div>
          <div className="w-20 h-2.5 bg-black/15 rounded-full"></div>
        </div>
        <div className="w-full h-2 bg-black/5 rounded-full mb-2"></div>
        <div className="w-5/6 h-2 bg-black/5 rounded-full mb-2"></div>
        <div className="w-2/3 h-2 bg-black/5 rounded-full mb-6"></div>
        <div className="space-y-2.5">
          <div className="w-full h-9 bg-black/5 rounded-xl"></div>
          <div className="w-full h-9 bg-black/5 rounded-xl"></div>
          <div className="w-full h-9 bg-black/[0.08] rounded-xl ring-1 ring-black/10"></div>
          <div className="w-full h-9 bg-black/5 rounded-xl"></div>
        </div>
        <div className="absolute bottom-4 inset-x-4 h-11 bg-[#0d0d0d] rounded-full flex items-center justify-center">
          <div className="w-16 h-2 bg-white/40 rounded-full"></div>
        </div>
      </div>
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-black/40">{s.titre}</div>
    </div>
  )
}

const FAQ_DATA = [
  { q: "Puis-je passer le concours FPC sans le baccalauréat ?", a: "Oui, c'est toujours possible — mais les règles ont changé. Depuis l'arrêté du 20 février 2026, l'accès à la formation demande le baccalauréat, une équivalence ou une dispense. Sans le bac, vous pouvez obtenir cette dispense grâce à la VAPP (validation des acquis), un dispositif pensé pour les adultes ayant interrompu leurs études depuis au moins 2 ans et âgés d'au moins 20 ans. L'ancienne règle des 3 ans de cotisation a disparu du nouveau texte. <a href='/blog/epreuves-selection-concours-fpc-2027'>Notre article sur la réforme 2027</a> détaille tout." },
  { q: "La plateforme est-elle adaptée si je suis nul(le) en maths ?", a: "Absolument ! C'est même pour vous qu'elle a été pensée. L'entraînement spécifique reprend les bases étape par étape : produits en croix, conversions, pourcentages, calculs de doses. Chaque exercice est suivi d'une correction détaillée qui explique la méthode simplement. Vous progressez sans pression : ce module n'est pas noté." },
  { q: "Y a-t-il une période d'essai gratuite ?", a: "Oui, vous bénéficiez de 7 jours d'essai gratuit dès votre inscription, sans carte bancaire. Pendant cette période, vous accédez à toute la plateforme : entraînements de mathématiques, sujets de rédaction, examens blancs et préparation à l'oral." },
  { q: "Combien de temps faut-il pour se préparer au concours ?", a: "Nous conseillons de démarrer vos révisions 3 à 6 mois avant les épreuves, à raison de 2 à 4 heures par semaine. La plateforme s'adapte à votre emploi du temps : sur mobile, tablette ou ordinateur, que vous ayez 15 minutes dans les transports ou une heure de libre le week-end." },
  { q: "Quelles sont les dates du concours FPC ?", a: "Les dates varient selon les IFSI et les régions. Généralement, les inscriptions ouvrent entre janvier et mars, les épreuves écrites se déroulent entre mars et mai, et les oraux entre mai et juin. Consultez <a href='/blog/dates-concours-fpc-infirmier-2026'>notre article dédié aux dates du concours FPC</a> pour le calendrier complet et à jour." },
  { q: "Comment puis-je financer ma formation en IFSI ?", a: "Plusieurs solutions existent selon votre situation : promotion professionnelle prise en charge par votre employeur, projet de transition professionnelle (Transitions Pro), financement France Travail si vous êtes demandeur d'emploi, ou autofinancement. Retrouvez tous les détails dans <a href='/blog'>notre espace Blog</a>." },
  { q: "Une question, un problème ? Comment nous contacter ?", a: "Écrivez-nous à <strong>support@prepa-fpc.fr</strong> : nous vous répondons dans les plus brefs délais, généralement sous 24 heures." }
]

export default function MaquettePage() {
  const [activeTab, setActiveTab] = useState(0)
  const [activeFaq, setActiveFaq] = useState(null)
  // Frise d'éligibilité : les 4 étapes du métier actuel jusqu'à l'IFSI
  const ETAPES = [
    { titre: 'Avoir 17 ans ou plus', desc: 'Au 31 décembre de l’année d’entrée en formation.', couleur: '#64748b', fond: '#f1f5f9',
      icone: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
    { titre: 'Le bac ou une dispense', desc: 'Baccalauréat, équivalence, ou dispense via la VAPP si vous ne l’avez pas.', couleur: '#64748b', fond: '#f1f5f9',
      icone: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></> },
    { titre: 'Le concours FPC', desc: 'Un écrit (maths + rédaction) et un oral. Nous sommes là pour que vous le réussissiez.', couleur: '#64748b', fond: '#f1f5f9', enCours: true,
      icone: <><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></> },
    { titre: 'L’IFSI', desc: 'Intégrez un IFSI grâce à l’obtention du concours et devenez infirmier(ère).', couleur: '#64748b', fond: '#f1f5f9',
      icone: <><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></> },
  ]
  // Sous-parties de l'examen pour la frise chronologique (durées proportionnelles)
  const SOUS_EPREUVES = [
    { court: 'Calculs', titre: 'Sous-épreuve de calculs', etiquette: '/10', duree: '30 min', bg: '#ef4444', clair: '#fca5a5', desc: 'Calculs de doses, conversions, pourcentages, produits en croix.' },
    { court: 'Rédaction', titre: 'Sous-épreuve de rédaction', etiquette: '/10', duree: '30 min', bg: '#dc2626', clair: '#fca5a5', desc: 'Analyse ou questions/réponses sur un texte de culture sanitaire et sociale.' },
    { court: 'Parcours', titre: 'Présentation du parcours', etiquette: '10 min', duree: '10 min', bg: '#3b82f6', clair: '#93c5fd', desc: 'Valorisez votre expérience professionnelle et votre projet.' },
    { court: 'Jury', titre: 'Entretien avec le jury', etiquette: '10 min', duree: '10 min', bg: '#2563eb', clair: '#93c5fd', desc: 'Vos motivations et votre connaissance du métier IDE.' },
  ]

  // Progression de la ligne verticale des 5 catégories (suit le scroll).
  // Chaque pastille s'allume quand le remplissage atteint sa position réelle.
  const catRef = useRef(null)
  const [catProgress, setCatProgress] = useState(0)
  const [catActifs, setCatActifs] = useState([false, false, false, false, false])
  useEffect(() => {
    const onScroll = () => {
      const el = catRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.55 - r.top) / r.height))
      setCatProgress(p)
      const hautPiste = r.top + 24
      const fillY = hautPiste + p * (r.height - 48)
      const rangees = [...el.children].filter(c => c.className.includes('grid'))
      setCatActifs(rangees.map(row => {
        const rr = row.getBoundingClientRect()
        return fillY >= rr.top + rr.height / 2
      }))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const CAT_COLORS = ['#2563eb', '#dc2626', '#9333ea', '#eab308', '#16a34a']
  const catActive = Math.max(0, catActifs.lastIndexOf(true))
  // Couleur du titre synchronisée avec la tuile affichée dans la pile du hero
  const [heroMod, setHeroMod] = useState(MODULES[0])


  // Fade-in au scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.12 })
    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>

      {/* ===================== HERO ===================== */}
      <section className="relative grid place-items-center px-5 pb-4 pt-[68px] md:pt-[150px] text-center">
        <div aria-hidden="true" className="hero-grid absolute inset-0 pointer-events-none"></div>
        {/* Brume bleu marine foncé sur le bas et les côtés du hero */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse 46% 324px at 5% calc(100% - 54px), rgba(30,58,138,0.17), transparent 70%), radial-gradient(ellipse 44% 46% at 98% 70%, rgba(30,58,138,0.15), transparent 70%), radial-gradient(ellipse 72% 252px at 50% calc(100% + 72px), rgba(30,58,138,0.12), transparent 70%), radial-gradient(ellipse 42% 306px at 96% calc(100% - 27px), rgba(30,58,138,0.16), transparent 70%), radial-gradient(ellipse 38% 216px at 50% calc(100% - 9px), rgba(30,58,138,0.13), transparent 70%)'}}></div>
        <ParticleField />
        <div className="relative z-10 grid place-items-center">
        <AppLogoStack onChange={setHeroMod} />
        <h1 className="mt-9 text-[2.7rem] sm:text-6xl lg:text-[4.6rem] font-extrabold tracking-[-0.035em] leading-[1.02] max-w-4xl">
          Réussissez le<br /><FlipWord color={heroMod.accent}>concours</FlipWord> infirmier <FlipWord color={heroMod.accent}>FPC</FlipWord>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-black/55 font-medium max-w-3xl leading-relaxed">
          La première plateforme web de révision conçue exclusivement pour les professionnels en reconversion. Maîtrisez parfaitement les <strong className="font-bold text-black/75">calculs de doses</strong> et la <strong className="font-bold text-black/75">culture sanitaire</strong>, et intégrez votre première année en IFSI.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
          <a href="/auth?mode=signup" className="btn-shine inline-flex items-center gap-2 justify-center bg-[#0d0d0d] hover:bg-black/85 text-white font-semibold text-base px-7 py-3.5 rounded-full transition group">
            Commencer l&apos;entraînement
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg>
          </a>
          <a href="#composition-examen" className="inline-flex items-center justify-center font-semibold text-base px-7 py-3.5 rounded-full ring-1 ring-black/10 hover:bg-black/5 transition">
            Découvrez l&apos;examen
          </a>
        </div>

        {/* Indice de scroll */}
        <a href="#eligibilite" aria-label="Faire défiler vers la suite" className="mt-8 flex flex-col items-center text-black/30 hover:text-black/60 transition-colors">
          <svg className="scroll-cue-1 w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6"/></svg>
          <svg className="scroll-cue-2 w-6 h-6 -mt-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6"/></svg>
        </a>

        </div>
      </section>

      {/* ===================== ÉLIGIBILITÉ ===================== */}
      <section id="eligibilite" className="relative overflow-hidden pt-8 pb-12 sm:pt-10 sm:pb-16 px-5 fade-in-up" style={{background: 'linear-gradient(to bottom, #ffffff 0%, #f7f6f4 90px, #f7f6f4 calc(100% - 140px), #ffffff 100%)', scrollMarginTop: '115px'}}>
        {/* Prolongement de la brume bleu marine du hero (mêmes positions, fondu vers le bas) */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[340px] pointer-events-none" style={{background: 'radial-gradient(ellipse 46% 324px at 5% -54px, rgba(30,58,138,0.17), transparent 70%), radial-gradient(ellipse 72% 252px at 50% 72px, rgba(30,58,138,0.12), transparent 70%), radial-gradient(ellipse 42% 306px at 96% -27px, rgba(30,58,138,0.16), transparent 70%), radial-gradient(ellipse 38% 216px at 50% -9px, rgba(30,58,138,0.13), transparent 70%)'}}></div>
        {/* Décorations */}
        <div aria-hidden="true" className="absolute top-20 -left-24 w-80 h-64 bg-red-500/[0.07] rounded-full blur-3xl pointer-events-none"></div>
        <div aria-hidden="true" className="absolute bottom-16 -right-20 w-72 h-56 bg-indigo-500/[0.06] rounded-full blur-3xl pointer-events-none"></div>
        <svg aria-hidden="true" className="absolute top-[30%] left-[10%] w-6 h-6 text-black/[0.12] hidden md:block pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{transform: 'rotate(-10deg)'}}><path d="M12 5v14M5 12h14"/></svg>
        <svg aria-hidden="true" className="absolute bottom-[22%] left-[16%] w-4 h-4 text-red-500/30 hidden md:block pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{transform: 'rotate(18deg)'}}><path d="M12 5v14M5 12h14"/></svg>
        <svg aria-hidden="true" className="absolute top-[62%] right-[9%] w-5 h-5 text-black/[0.1] hidden md:block pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{transform: 'rotate(-14deg)'}}><path d="M12 5v14M5 12h14"/></svg>
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.2]"><span style={{background: 'linear-gradient(100deg, rgba(100,116,139,0) 0.8%, rgba(100,116,139,0.32) 2.8%, rgba(100,116,139,0.25) 50%, rgba(100,116,139,0.32) 97%, rgba(100,116,139,0) 99.2%)', borderRadius: '0.45em 0.2em 0.55em 0.25em', padding: '0.04em 0.22em', margin: '0 -0.06em', WebkitBoxDecorationBreak: 'clone', boxDecorationBreak: 'clone'}}>Êtes-vous éligible au concours FPC&nbsp;?</span></h2>
            <p className="mt-5 text-lg text-black/55 font-medium leading-relaxed">La voie de la Formation Professionnelle Continue (FPC) est une passerelle spécifique qui permet d&apos;intégrer un IFSI. Quatre étapes vous séparent du diplôme d&apos;infirmier — et vous avez déjà fait une partie du chemin.</p>
          </div>
          {/* Frise du parcours : 4 étapes qui s'allument en cascade au scroll */}
          <div className="max-w-4xl mx-auto">
            <style>{`
              @keyframes frise-pop { from { opacity: 0; transform: translateY(18px) scale(0.92); } to { opacity: 1; transform: none; } }
              @keyframes frise-remplit { from { transform: scaleX(0); } to { transform: scaleX(1); } }
              @keyframes frise-remplit-v { from { transform: scaleY(0); } to { transform: scaleY(1); } }
              .frise-etape { opacity: 0; }
              .fade-in-up.visible .frise-etape { animation: frise-pop 0.55s cubic-bezier(0.25, 1, 0.4, 1) both; }
              .frise-ligne-h { transform: scaleX(0); transform-origin: left; }
              .fade-in-up.visible .frise-ligne-h { animation: frise-remplit 1.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both; }
              .frise-ligne-v { transform: scaleY(0); transform-origin: top; }
              .fade-in-up.visible .frise-ligne-v { animation: frise-remplit-v 1.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both; }
            `}</style>
            <div className="relative">
              {/* Ligne de liaison (desktop : horizontale, mobile : verticale) */}
              <div aria-hidden="true" className="hidden md:block absolute top-[34px] left-[12%] right-[12%] h-[3px] rounded-full bg-black/[0.07]"></div>
              <div aria-hidden="true" className="hidden md:block absolute top-[34px] left-[12%] right-[12%] h-[3px] rounded-full frise-ligne-h" style={{background: '#94a3b8'}}></div>
              <div aria-hidden="true" className="md:hidden absolute left-[27px] top-8 bottom-16 w-[3px] rounded-full bg-black/[0.07]"></div>
              <div aria-hidden="true" className="md:hidden absolute left-[27px] top-8 bottom-16 w-[3px] rounded-full frise-ligne-v" style={{background: '#94a3b8'}}></div>
              <div className="grid md:grid-cols-4 gap-8 md:gap-4">
                {ETAPES.map((e, i) => (
                  <div key={i} className="frise-etape relative flex md:flex-col items-start md:items-center gap-4 md:gap-0 md:text-center" style={{animationDelay: `${0.15 + i * 0.35}s`}}>
                    <div className={`relative z-10 w-[56px] h-[56px] md:w-[68px] md:h-[68px] shrink-0 rounded-2xl flex items-center justify-center ring-4 ring-[#f7f6f4] ${e.enCours ? 'micro-beat' : ''}`} style={{background: e.fond, color: e.couleur, boxShadow: `0 10px 24px ${e.couleur}2e`}}>
                      {e.enCours && (
                        <>
                          <span aria-hidden="true" className="micro-pulse absolute inset-0 rounded-2xl bg-slate-500/25"></span>
                          <span aria-hidden="true" className="micro-pulse-retard absolute inset-0 rounded-2xl bg-slate-500/15"></span>
                        </>
                      )}
                      <svg className="w-7 h-7 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{e.icone}</svg>
                    </div>
                    <div className="md:mt-4">
                      <p className="text-[11px] font-extrabold uppercase tracking-widest mb-1" style={{color: e.couleur}}>Étape {i + 1}</p>
                      <h3 className="text-lg font-extrabold tracking-tight leading-tight whitespace-nowrap">{e.titre}</h3>
                      <p className="mt-1.5 text-sm text-black/50 font-medium leading-relaxed md:px-1">{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center mt-12">
              <a href="/signup" className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-bold px-7 py-3.5 rounded-full transition shadow-lg shadow-slate-600/25 group/btn">
                Commencer ma préparation
                <svg className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== LES 5 CATÉGORIES D'ENTRAÎNEMENT (zigzag) ===================== */}
      <section className="px-5 py-16 sm:py-24 fade-in-up">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.05]">5 entraînements pour maximiser<br />vos chances de réussite</h2>
            <p className="mt-5 text-lg text-black/55 font-medium leading-relaxed">Chaque module cible une partie précise du concours.</p>
          </div>
          <div ref={catRef} className="relative space-y-16 sm:space-y-24">
            {/* Ligne de progression verticale */}
            <div aria-hidden="true" className="hidden md:block absolute left-1/2 -translate-x-1/2 top-6 bottom-6 w-[3px] rounded-full bg-black/[0.07]">
              <div className="w-full rounded-full transition-[height,background-color] duration-300" style={{height: `${catProgress * 100}%`, backgroundColor: CAT_COLORS[catActive]}}></div>
            </div>
            {[
              { ancre: 'entrainement-specifique', titre: 'Entraînement spécifique', desc: "Tous les types d'exercices de maths avec des explications pour réellement progresser", pied: 'Ne compte pas dans la moyenne', badge: null, bord: '#2563eb', teinte: '#eff6ff', num: '1', sur: 'Se concentrer sur un thème', points: ['Conversions, pourcentages, produits en croix, équations', 'Correction détaillée après chaque question', 'Aucune note, afin de progresser en amont des tests'], icone: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></> },
              { ancre: 'entrainement-maths', titre: 'Entraînement mathématiques', desc: "Conditions similaires à l'examen pour évaluer son niveau basé en partie sur les annales", pied: 'Note /10', badge: '30 min', bord: '#dc2626', teinte: '#fef2f2', num: '2', sur: 'Se mesurer à l’épreuve de calculs', points: ['Génération illimitée de sujets inspirés des annales', '30 minutes chrono, sans calculatrice, comme la sous-épreuve du concours', 'Note sur 10 et correction finale détaillée'], icone: <><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></> },
              { ancre: 'redaction', titre: 'Entraînement rédactionnel', desc: 'Analyse de texte, dissertations, culture sanitaire basée en partie sur les annales', pied: 'Note /10', badge: '30 min', bord: '#9333ea', teinte: '#faf5ff', num: '3', sur: 'Maîtriser l’épreuve de rédaction', points: ['Analyse de texte ou dissertation sur la culture sanitaire et sociale', 'Correction complète : argumentation, structure et chaque faute relevée', 'Note sur 10 comme à l’écrit du concours'], icone: <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></> },
              { ancre: 'examen-blanc', titre: 'Examen blanc', desc: "Conditions réelles, sans calculatrice, vous disposez d'un temps imparti d'1H", pied: 'Note /20', badge: '1H', bord: '#eab308', teinte: '#fefce8', num: '4', sur: 'Répéter le jour J', points: ['Maths puis rédaction à la suite, en conditions réelles', 'Une heure au total, sans calculatrice', 'Note sur 20, correction finale détaillée'], icone: <><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></> },
              { ancre: 'preparation-oral', titre: 'Questions sur votre parcours', desc: "Simulations de questions possibles sur votre parcours afin de passer l'examen oral dans les meilleures conditions", pied: 'Pas de note', badge: null, bord: '#16a34a', teinte: '#f0fdf4', num: '5', sur: 'Préparer l’oral sereinement', points: ['Importez votre CV et répondez aux questions personnalisées', 'Entraînez-vous à répondre à voix haute', 'Sans note, l’objectif est d’arriver confiant devant le jury'], icone: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
            ].map((c, i) => (
              <div key={i} id={c.ancre} style={{scrollMarginTop: '110px'}} className="relative grid md:grid-cols-2 gap-8 md:gap-24 items-center">
                {/* Pastille d'étape sur la ligne centrale */}
                <div
                  aria-hidden="true"
                  className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full items-center justify-center text-sm font-extrabold transition-all duration-300"
                  style={catActifs[i]
                    ? { backgroundColor: c.bord, color: '#ffffff', boxShadow: `0 6px 18px ${c.bord}55` }
                    : { backgroundColor: '#ffffff', color: 'rgba(0,0,0,0.35)', boxShadow: '0 0 0 2px rgba(0,0,0,0.10)' }}
                >{c.num}</div>
                {/* Aperçu d'interface */}
                <div className={`${i % 2 === 1 ? 'md:order-2' : ''}`}>
                  <ApercuModule i={i} bord={c.bord} teinte={c.teinte} titre={c.titre} badgeFenetre={['Sans note', '28:26', '24:59', '52:10', 'Question 2/8'][i]} />
                </div>
                {/* Explication */}
                <div className={`${i % 2 === 1 ? 'md:order-1' : ''}`}>
                  <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{color: c.bord}}>{c.titre}</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] leading-tight mb-5">{c.sur}</h3>
                  <ul className={i === 0 ? 'space-y-5' : 'space-y-3.5'}>
                    {c.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{background: c.teinte}}>
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke={c.bord} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        </span>
                        <span className={`text-[15px] text-black/60 font-medium leading-relaxed ${p.includes('votre CV') ? 'xl:whitespace-nowrap tracking-tight' : ''}`}>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-center mt-7">
                    <a href="/signup" className="inline-flex items-center gap-2 text-[15px] font-bold text-white px-6 py-3 rounded-full transition-transform duration-200 hover:scale-[1.04] group" style={{backgroundColor: c.bord, boxShadow: `0 8px 20px ${c.bord}40`}}>
                      Commencer cet entraînement
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== COMPOSITION DE L'EXAMEN ===================== */}
      <section id="composition-examen" className="relative overflow-hidden bg-[#0d0d0d] py-20 sm:py-28 px-5 fade-in-up">
        <div aria-hidden="true" className="absolute -top-32 -right-24 w-[32rem] h-[24rem] bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div aria-hidden="true" className="absolute -bottom-32 -left-24 w-[28rem] h-[20rem] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.05] text-white">Déroulement de l&apos;examen</h2>
            <p className="mt-5 text-lg text-white/55 font-medium leading-relaxed">Vous devez impérativement obtenir un total d&apos;au moins <strong className="font-bold text-white">20 sur 40</strong> aux épreuves pour être admis.</p>
          </div>
          <style>{`
            @keyframes chrono-pousse { from { transform: scaleX(0); } to { transform: scaleX(1); } }
            @keyframes chrono-fondu { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
            .chrono-seg { transform: scaleX(0); transform-origin: left; }
            .fade-in-up.visible .chrono-seg { animation: chrono-pousse 0.65s cubic-bezier(0.4, 0, 0.2, 1) both; }
            .chrono-detail { opacity: 0; }
            .fade-in-up.visible .chrono-detail { animation: chrono-fondu 0.5s ease-out both; }
          `}</style>

          {/* ===== Frise chronologique du jour J (desktop) ===== */}
          <div className="hidden md:block">
            {/* En-têtes des deux blocs */}
            <div className="flex gap-6 mb-4">
              <div className="flex items-center gap-2.5" style={{width: '72%'}}>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <h3 className="text-lg font-extrabold text-white">Épreuve écrite</h3>
                <span className="text-sm font-bold text-white/45">1 heure · 20 points</span>
              </div>
              <div className="flex items-center gap-2.5 flex-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <h3 className="text-lg font-extrabold text-white whitespace-nowrap">Épreuve orale</h3>
                <span className="text-sm font-bold text-white/45 whitespace-nowrap">20 min · 20 points</span>
              </div>
            </div>
            {/* Barre du temps : segments proportionnels aux durées */}
            <div className="flex items-stretch gap-6">
              <div className="flex h-14 rounded-2xl overflow-hidden ring-1 ring-white/10" style={{width: '72%'}}>
                {SOUS_EPREUVES.slice(0, 2).map((s, i) => (
                  <div key={i} className="chrono-seg flex items-center justify-center gap-2.5" style={{width: '50%', background: s.bg, animationDelay: `${0.1 + i * 0.45}s`}}>
                    <span className="text-[15px] font-extrabold text-white">{s.court}</span>
                    <span className="text-[11px] font-bold text-white/75">{s.duree}</span>
                  </div>
                ))}
              </div>
              <div className="flex h-14 rounded-2xl overflow-hidden ring-1 ring-white/10 flex-1">
                {SOUS_EPREUVES.slice(2).map((s, i) => (
                  <div key={i} className="chrono-seg flex items-center justify-center gap-2" style={{width: '50%', background: s.bg, animationDelay: `${1 + i * 0.25}s`}}>
                    <span className="text-[15px] font-extrabold text-white">{s.court}</span>
                    <span className="text-[11px] font-bold text-white/75">{s.duree}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Graduations */}
            <div className="flex gap-6 mt-2.5 text-[11px] font-bold text-white/35">
              <div className="relative h-4" style={{width: '72%'}}>
                <span className="absolute left-0">0</span>
                <span className="absolute left-1/2 -translate-x-1/2">30 min</span>
                <span className="absolute right-0">1 h</span>
              </div>
              <div className="relative h-4 flex-1">
                <span className="absolute left-0">0</span>
                <span className="absolute left-1/2 -translate-x-1/2">10 min</span>
                <span className="absolute right-0">20 min</span>
              </div>
            </div>
          </div>

          {/* ===== Version mobile : frise verticale ===== */}
          <div className="md:hidden space-y-3">
            {SOUS_EPREUVES.map((s, i) => (
              <div key={i}>
                {(i === 0 || i === 2) && (
                  <div className="flex items-center gap-2.5 mb-3 mt-5 first:mt-0">
                    <span className="w-2.5 h-2.5 rounded-full" style={{background: s.bg}}></span>
                    <h3 className="text-base font-extrabold text-white">{i === 0 ? 'Épreuve écrite' : 'Épreuve orale'}</h3>
                    <span className="text-[13px] font-bold text-white/45">{i === 0 ? '1 heure · 20 points' : '20 min · 20 points'}</span>
                  </div>
                )}
                <div className="flex items-stretch gap-3">
                  <div className="w-[64px] shrink-0 rounded-xl flex items-center justify-center text-[13px] font-extrabold text-white" style={{background: s.bg}}>{s.duree}</div>
                  <div className="flex-1 bg-white/[0.04] ring-1 ring-white/[0.06] rounded-xl px-4 py-3">
                    <p className="font-bold text-white text-[14px]">{s.titre} <span className="ml-1 text-[11px] font-extrabold px-1.5 py-0.5 rounded-md align-middle" style={{background: `${s.bg}33`, color: s.clair}}>{s.etiquette}</span></p>
                    <p className="text-[13px] text-white/55 font-medium leading-relaxed mt-0.5">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Détails des 4 temps forts (desktop, alignés sous la frise) */}
          <div className="hidden md:grid grid-cols-4 gap-4 mt-7">
            {SOUS_EPREUVES.map((s, i) => (
              <div key={i} className="chrono-detail bg-white/[0.04] ring-1 ring-white/[0.06] rounded-2xl p-5" style={{animationDelay: `${0.35 + i * 0.35}s`}}>
                <div className="h-1 w-9 rounded-full mb-4" style={{background: s.bg}}></div>
                <p className="font-bold text-white text-[15px] leading-snug">{s.titre} <span className="ml-1 text-[11px] font-extrabold px-1.5 py-0.5 rounded-md align-middle whitespace-nowrap" style={{background: `${s.bg}33`, color: s.clair}}>{s.etiquette}</span></p>
                <p className="text-sm text-white/55 font-medium leading-relaxed mt-2">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Seuil éliminatoire commun */}
          <div className="chrono-detail mt-8 flex items-center justify-center gap-2.5" style={{animationDelay: '1.6s'}}>
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <p className="text-sm text-red-200/90 font-medium">Une note en dessous de <strong className="font-bold text-white">8/20</strong> à l&apos;une ou l&apos;autre des épreuves est <strong className="font-bold text-white">éliminatoire</strong>.</p>
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      {/* Schéma FAQPage pour Google (réponses sans balises HTML) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_DATA.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') }
        }))
      })}} />
      <section id="faq" className="py-20 sm:py-28 px-5 fade-in-up">
        <div className="max-w-[860px] mx-auto">
          <h2 className="text-3xl sm:text-[52px] font-extrabold tracking-[-0.03em] leading-[1.05] text-center mb-12">Questions fréquentes</h2>
          <div>
            {FAQ_DATA.map((faq, index) => (
              <div key={index} className="border-b border-black/10 last:border-b-0">
                <button
                  className="w-full px-1 py-[22px] text-left flex justify-between items-center gap-4 cursor-pointer group"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  <span className="font-extrabold text-[19px] leading-snug group-hover:text-black/70 transition">{faq.q}</span>
                  <svg className={`w-5 h-5 shrink-0 text-black/45 transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6"/></svg>
                </button>
                <div className="px-1 overflow-hidden transition-all duration-300" style={{ maxHeight: activeFaq === index ? '400px' : '0', opacity: activeFaq === index ? 1 : 0 }}>
                  <p className="pb-6 text-black/55 font-medium leading-relaxed [&_a]:text-red-600 [&_a]:font-bold [&_a]:underline" dangerouslySetInnerHTML={{__html: faq.a}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}
