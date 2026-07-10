export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid event id' })
  }
  const deleted = await deleteEvent(id)
  return { ok: deleted }
})
