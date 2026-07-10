import type { StatusResponse } from '#shared/types'

export default defineEventHandler((): StatusResponse => {
  return { store: getStoreBackend() }
})
