// Rate limiting en mémoire — 10 requêtes par minute par utilisateur
const requests = new Map()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10

export function checkRateLimit(userId) {
  const now = Date.now()
  const userRequests = requests.get(userId) || []

  // Garder uniquement les requêtes dans la fenêtre
  const recent = userRequests.filter(t => now - t < WINDOW_MS)

  if (recent.length >= MAX_REQUESTS) {
    return false // Limité
  }

  recent.push(now)
  requests.set(userId, recent)

  // Nettoyage périodique des anciens utilisateurs
  if (requests.size > 1000) {
    for (const [key, times] of requests) {
      if (times.every(t => now - t > WINDOW_MS)) requests.delete(key)
    }
  }

  return true // OK
}
