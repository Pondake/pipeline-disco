export default defineEventHandler(async (event) => {
  const raw = getQuery(event).cursor
  const cursor = typeof raw === 'string' && raw !== '' ? Number(raw) : null
  return listEvents(cursor !== null && Number.isFinite(cursor) ? cursor : null)
})
