import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function checkAuth() {
  const cookieStore = await cookies()

  // Supabase stocke le token dans un cookie sb-<ref>-auth-token
  const allCookies = cookieStore.getAll()
  const authCookie = allCookies.find(c => c.name.includes('auth-token'))

  if (!authCookie) return null

  let token = authCookie.value
  // Le cookie peut être un JSON encodé contenant access_token
  try {
    const parsed = JSON.parse(decodeURIComponent(token))
    if (parsed.access_token) token = parsed.access_token
    else if (Array.isArray(parsed) && parsed[0]) token = parsed[0]
  } catch {
    // Le token est déjà brut
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}
