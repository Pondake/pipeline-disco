export default defineNuxtRouteMiddleware(async (to) => {
  // SSR requests are gated by the server middleware already.
  if (import.meta.server) return
  if (to.path === '/login') return
  const authed = useState('authed', () => false)
  if (authed.value) return
  try {
    await $fetch('/api/auth/me')
    authed.value = true
  } catch {
    return navigateTo('/login')
  }
})
