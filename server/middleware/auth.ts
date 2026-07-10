const PUBLIC_PREFIXES = [
  '/api/webhook/', // guarded by its own X-Gitlab-Token check
  '/api/auth/login',
  '/login',
  '/_nuxt',
  '/__nuxt',
  '/api/_',
  '/favicon',
  '/.well-known',
  '/robots.txt',
]

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const { pathname } = getRequestURL(event)

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return

  if (!config.appPassword) {
    if (import.meta.dev) return // no password configured: open in local dev only
    throw createError({ statusCode: 503, statusMessage: 'APP_PASSWORD is not configured' })
  }

  // Kiosk path: ?key=PASSWORD authenticates and sets the cookie, so a
  // Raspberry Pi can boot straight into an authenticated session.
  const key = getQuery(event).key
  if (typeof key === 'string' && safeEqual(key, config.appPassword)) {
    setSessionCookie(event)
    return
  }

  if (verifySession(getCookie(event, SESSION_COOKIE))) return

  if (pathname.startsWith('/api/')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return sendRedirect(event, '/login', 302)
})
