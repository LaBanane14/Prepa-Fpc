'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const checks = {
    len: password.length >= 8,
    upper: /[A-Z]/.test(password),
    num: /[0-9]/.test(password),
    spec: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
  const allValid = Object.values(checks).every(Boolean)
  const matches = password === confirmPassword && password !== ''
  const canSubmit = allValid && matches

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password
    })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl relative z-10 p-8 sm:p-10 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Mot de passe modifié !</h2>
          <p className="text-slate-500 font-medium">Votre mot de passe a été mis à jour avec succès.</p>
          <a href="/login" className="inline-block mt-6 bg-slate-900 hover:bg-black text-white font-bold px-6 py-3 rounded-xl transition">Se connecter</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl relative z-10 p-8 sm:p-10 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-red-600 text-white p-3 rounded-2xl shadow-sm mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1 text-center">Nouveau mot de passe</h1>
          <p className="text-slate-500 font-medium text-center">Choisissez votre nouveau mot de passe.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold p-3 rounded-xl mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Nouveau mot de passe</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
              <input type={showPass?"text":"password"} required placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent outline-none transition font-medium"/>
              <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition">
                {showPass ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs font-bold">
              <div className={`flex items-center gap-1.5 transition-colors ${checks.len?'text-red-600':'text-slate-400'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path strokeLinecap="round" strokeLinejoin="round" d="M22 4 12 14.01l-3-3"/></svg> 8+ caractères</div>
              <div className={`flex items-center gap-1.5 transition-colors ${checks.upper?'text-red-600':'text-slate-400'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path strokeLinecap="round" strokeLinejoin="round" d="M22 4 12 14.01l-3-3"/></svg> 1 Majuscule</div>
              <div className={`flex items-center gap-1.5 transition-colors ${checks.num?'text-red-600':'text-slate-400'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path strokeLinecap="round" strokeLinejoin="round" d="M22 4 12 14.01l-3-3"/></svg> 1 Chiffre</div>
              <div className={`flex items-center gap-1.5 transition-colors ${checks.spec?'text-red-600':'text-slate-400'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path strokeLinecap="round" strokeLinejoin="round" d="M22 4 12 14.01l-3-3"/></svg> 1 Caractère spécial</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirmer le mot de passe</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
              <input type="password" required placeholder="••••••••" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent outline-none transition font-medium"/>
            </div>
            {confirmPassword && !matches && <p className="text-xs text-red-600 font-bold mt-1.5">Les mots de passe ne correspondent pas.</p>}
          </div>

          <button type="submit" disabled={!canSubmit||loading} className={`w-full font-bold text-lg py-4 rounded-xl mt-2 transition-all shadow-lg flex items-center justify-center gap-2 ${canSubmit&&!loading?'bg-slate-900 hover:bg-black text-white shadow-slate-200':'bg-slate-200 text-slate-400 cursor-not-allowed shadow-slate-100'}`}>
            {loading?'Modification en cours...':'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}
