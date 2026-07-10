export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!config.appPassword || !safeEqual(password, config.appPassword)) {
    throw createError({ statusCode: 401, statusMessage: 'Wrong password' })
  }
  setSessionCookie(event)
  return { ok: true }
})
