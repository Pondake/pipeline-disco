import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

export const SESSION_COOKIE = 'disco_session'
const SESSION_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

function sessionSecret(): string {
  const config = useRuntimeConfig()
  if (config.sessionSecret) return config.sessionSecret
  return createHash('sha256').update(`disco:${config.appPassword}`).digest('hex')
}

/** Constant-time string comparison that tolerates unequal lengths. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    // Still burn a comparison so length mismatch isn't a timing shortcut.
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

export function signSession(issuedAt = Date.now()): string {
  const mac = createHmac('sha256', sessionSecret()).update(String(issuedAt)).digest('hex')
  return `${issuedAt}.${mac}`
}

export function verifySession(token: string | undefined | null): boolean {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const issuedAt = Number(token.slice(0, dot))
  if (!Number.isFinite(issuedAt)) return false
  if (Date.now() - issuedAt > SESSION_MAX_AGE_MS) return false
  return safeEqual(token, signSession(issuedAt))
}

export function setSessionCookie(event: H3Event) {
  setCookie(event, SESSION_COOKIE, signSession(), {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS / 1000,
    path: '/',
  })
}
