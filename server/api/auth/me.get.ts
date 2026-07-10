// The global auth middleware already rejected unauthenticated requests.
export default defineEventHandler(() => ({ ok: true }))
