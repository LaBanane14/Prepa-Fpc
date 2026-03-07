'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState([])
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)

  const emptyArticle = { title: '', slug: '', category: '', category_color: 'blue', excerpt: '', content: '', date: new Date().toISOString().split('T')[0], reading_time: '5 min de lecture', published: true, image_url: '' }
  const [form, setForm] = useState(emptyArticle)

  const ADMIN_EMAIL = 'pauldebruinier@gmail.com'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth'; return }
      if (session.user.email !== ADMIN_EMAIL) { window.location.href = '/'; return }
      setUser(session.user)
      setLoading(false)
    })
    fetchArticles()
  }, [])

  async function fetchArticles() {
    const { data } = await supabase.from('articles').select('*').order('date', { ascending: false })
    if (data) setArticles(data)
  }

  function generateSlug(title) {
    return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function handleChange(field, value) {
    const updated = { ...form, [field]: value }
    if (field === 'title' && !editing) {
      updated.slug = generateSlug(value)
    }
    setForm(updated)
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('articles-images')
      .upload(fileName, file)

    if (error) {
      setMessage('Erreur upload : ' + error.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('articles-images')
      .getPublicUrl(fileName)

    setForm({ ...form, image_url: urlData.publicUrl })
    setUploading(false)
  }

  async function handleDeleteImage() {
    if (!form.image_url) return
    const fileName = form.image_url.split('/').pop()
    await supabase.storage.from('articles-images').remove([fileName])
    setForm({ ...form, image_url: '' })
  }

  function insertImageInContent() {
    if (!form.image_url) return
    const imgTag = `<img src="${form.image_url}" alt="" style="width:100%;border-radius:12px;margin:16px 0;" />`
    setForm({ ...form, content: form.content + '\n' + imgTag })
    setMessage('Image insérée dans le contenu !')
  }

  function startEdit(article) {
    setEditing(article.id)
    setForm({ ...article, date: article.date?.split('T')[0] || article.date })
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditing(null)
    setForm(emptyArticle)
    setMessage('')
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    if (editing) {
      const { error } = await supabase.from('articles').update(form).eq('id', editing)
      if (error) setMessage('Erreur : ' + error.message)
      else { setMessage('Article mis à jour !'); cancelEdit() }
    } else {
      const { id, ...newArticle } = form
      const { error } = await supabase.from('articles').insert(newArticle)
      if (error) setMessage('Erreur : ' + error.message)
      else { setMessage('Article publié !'); setForm(emptyArticle) }
    }

    setSaving(false)
    fetchArticles()
  }

  async function handleDelete(id, title) {
    if (!confirm('Supprimer "' + title + '" ?')) return
    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (!error) { setMessage('Article supprimé'); fetchArticles() }
  }

  async function togglePublished(id, current) {
    await supabase.from('articles').update({ published: !current }).eq('id', id)
    fetchArticles()
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div></div>
  }

  const colorOptions = [
    { value: 'blue', label: 'Bleu' },
    { value: 'amber', label: 'Ambre' },
    { value: 'emerald', label: 'Émeraude' },
    { value: 'purple', label: 'Violet' },
    { value: 'rose', label: 'Rose' },
    { value: 'red', label: 'Rouge' }
  ]

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* HEADER ADMIN */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black text-lg">Admin</span>
            <span className="text-slate-400 text-sm">Prépa FPC</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/blog" className="text-slate-400 hover:text-white text-sm font-medium transition">Voir le blog</a>
            <a href="/" className="text-slate-400 hover:text-white text-sm font-medium transition">Accueil</a>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-slate-900 mb-8">{editing ? "Modifier l'article" : 'Nouvel article'}</h1>

        {message && (
          <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${message.startsWith('Erreur') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{message}</div>
        )}

        {/* FORMULAIRE */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-10 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Titre</label>
              <input type="text" required value={form.title} onChange={e => handleChange('title', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent outline-none font-medium" placeholder="Mon super article"/>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Slug (URL)</label>
              <input type="text" required value={form.slug} onChange={e => handleChange('slug', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent outline-none font-medium font-mono text-sm" placeholder="mon-super-article"/>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Catégorie</label>
              <input type="text" required value={form.category} onChange={e => handleChange('category', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent outline-none font-medium" placeholder="Mathématiques"/>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Couleur</label>
              <select value={form.category_color} onChange={e => handleChange('category_color', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent outline-none font-medium">
                {colorOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={e => handleChange('date', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent outline-none font-medium"/>
            </div>
          </div>

          {/* IMAGE UPLOAD */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Image de couverture</label>
            <div className="flex flex-col gap-3">
              {form.image_url ? (
                <div className="relative">
                  <img src={form.image_url} alt="Couverture" className="w-full h-48 object-cover rounded-xl border border-slate-200" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button type="button" onClick={insertImageInContent} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-md">
                      Insérer dans le contenu
                    </button>
                    <button type="button" onClick={handleDeleteImage} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-md">
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-xl cursor-pointer transition ${uploading ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-red-400 hover:bg-red-50/30'}`}>
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full"></div>
                      <span className="text-sm font-bold text-red-600">Upload en cours...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      <span className="text-sm font-bold text-slate-500">Cliquez pour uploader une image</span>
                      <span className="text-xs text-slate-400 mt-1">JPG, PNG, WebP</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
              {form.image_url && (
                <input type="text" value={form.image_url} readOnly className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-500" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Résumé (affiché sur la carte blog)</label>
            <textarea rows={2} value={form.excerpt} onChange={e => handleChange('excerpt', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent outline-none font-medium resize-none" placeholder="Un court résumé de l'article..."/>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Contenu (HTML)</label>
            <textarea rows={12} required value={form.content} onChange={e => handleChange('content', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-transparent outline-none font-mono text-sm resize-y" placeholder="<h2>Introduction</h2><p>Votre contenu ici...</p>"/>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="published" checked={form.published} onChange={e => handleChange('published', e.target.checked)} className="w-4 h-4 accent-red-600"/>
            <label htmlFor="published" className="text-sm font-bold text-slate-700">Publié (visible sur le blog)</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-red-600/20">
              {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : "Publier l'article"}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl transition">Annuler</button>
            )}
          </div>
        </form>

        {/* LISTE DES ARTICLES */}
        <h2 className="text-2xl font-black text-slate-900 mb-4">Articles existants ({articles.length})</h2>
        <div className="space-y-3">
          {articles.map(article => (
            <div key={article.id} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {article.image_url && (
                  <img src={article.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${article.published ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                    <h3 className="font-bold text-slate-900 truncate">{article.title}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span>{article.category}</span>
                    <span>•</span>
                    <span>{new Date(article.date).toLocaleDateString('fr-FR')}</span>
                    <span>•</span>
                    <span className="font-mono">/blog/{article.slug}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => togglePublished(article.id, article.published)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${article.published ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {article.published ? 'Publié' : 'Brouillon'}
                </button>
                <button onClick={() => startEdit(article)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition">Modifier</button>
                <button onClick={() => handleDelete(article.id, article.title)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
