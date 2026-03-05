'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password'
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl relative z-10 p-8 sm:p-10 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Email envoyé !</h2>
          <p className="text-slate-500 font-medium">Un lien de réinitialisation a été envoyé à <strong className="text-slate-800">{email}</strong>. Vérifiez votre boîte mail et vos spams.</p>
          <a href="/login" className="inline-block mt-6 bg-slate-900 hover:bg-black text-white font-bold px-6 py-3 rounded-xl transition">Retour à la connexion</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl relative z-10 p-8 sm:p-10 border border-slate-100">
        <a href="/login" className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 transition bg-slate-50 hover:bg-slate-100 p-2 rounded-full">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </a>

        <div className="flex flex-col items-center mb-8">
          <div className="bg-red-600 text-white p-3 rounded-2xl shadow-sm mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1 text-center">Mot de passe oublié</h1>
          <p className="text-slate-500 font-medium text-center">Entrez votre email et nous vous enverrons un lien de réinitialisation.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold p-3 rounded-xl mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Adresse email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></div>
              <input type="email" required placeholder="marie.as@hopital.fr" value={email} onChange={e=>setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent outline-none transition font-medium"/>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white font-bold text-lg py-4 rounded-xl mt-2 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2">
            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
            {!loading && <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg>}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-slate-500 font-medium text-sm">Vous vous souvenez ? <a href="/login" className="text-red-600 font-bold hover:text-red-700 transition ml-1">Se connecter</a></p>
        </div>
      </div>
    </div>
  )
}