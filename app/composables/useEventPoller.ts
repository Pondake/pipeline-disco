import type { DiscoEvent, EventsResponse, PollingSettings } from '#shared/types'

const CURSOR_STORAGE_KEY = 'disco:cursor'
const ACTIVE_WINDOW_MS = 10 * 60 * 1000

export type ConnectionState = 'ok' | 'degraded' | 'offline'

export function useEventPoller(
  polling: () => PollingSettings,
  onEvents: (events: DiscoEvent[], initial: boolean) => void,
) {
  const connection = ref<ConnectionState>('ok')
  const lastEventAt = ref(0)
  const nextPollMs = ref(0)
  const pollCycle = ref(0)
  let cursor: number | null = null
  let failures = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let stopped = false
  let inFlight = false

  function interval(): number {
    const cfg = polling()
    const active = Date.now() - lastEventAt.value < ACTIVE_WINDOW_MS
    const base = active ? cfg.activeMs : cfg.idleMs
    // Back off while failing, capped at 30s.
    return failures > 0 ? Math.min(base * 2 ** failures, 30000) : base
  }

  async function poll() {
    if (stopped || inFlight) return
    if (document.visibilityState === 'hidden') return schedule()
    inFlight = true
    try {
      const query = cursor !== null ? { cursor } : {}
      const res = await $fetch<EventsResponse>('/api/events', { query })
      failures = 0
      connection.value = 'ok'
      cursor = res.cursor
      localStorage.setItem(CURSOR_STORAGE_KEY, String(res.cursor))
      if (res.events.length > 0) {
        if (!res.initial) lastEventAt.value = Date.now()
        onEvents(res.events, res.initial)
      }
    } catch (err) {
      // 401 means the session cookie expired: back to login, not endless retries.
      const status = err as { statusCode?: number; status?: number } | undefined
      if (status?.statusCode === 401 || status?.status === 401) {
        stopped = true
        return navigateTo('/login')
      }
      failures++
      connection.value = failures >= 3 ? 'offline' : 'degraded'
    } finally {
      inFlight = false
    }
    schedule()
  }

  /** Poll right now instead of waiting out the current interval. */
  function pollNow() {
    if (timer) clearTimeout(timer)
    poll()
  }

  function schedule() {
    if (stopped) return
    const ms = interval()
    nextPollMs.value = ms
    pollCycle.value++
    timer = setTimeout(poll, ms)
  }

  async function start() {
    stopped = false
    const saved = localStorage.getItem(CURSOR_STORAGE_KEY)
    cursor = saved !== null && saved !== '' && Number.isFinite(Number(saved)) ? Number(saved) : null
    document.addEventListener('visibilitychange', onVisible)
    if (cursor !== null) {
      // Repopulate the ledger after a reload, silently. Anything newer than
      // the cursor still arrives through the normal poll and gets announced.
      try {
        const res = await $fetch<EventsResponse>('/api/events')
        const seen = cursor
        // If the server's real cursor is behind what we stored, the event log
        // was reset underneath us (dev in-memory store restarted, or Redis was
        // flushed) — our cursor is now higher than any id the server will ever
        // produce again, so every future poll would return nothing forever.
        // Adopt the server's cursor so polling can recover.
        if (res.cursor < seen) {
          cursor = res.cursor
          localStorage.setItem(CURSOR_STORAGE_KEY, String(res.cursor))
        }
        const history = res.events.filter((e) => e.id <= seen)
        if (history.length) onEvents(history, true)
      } catch {
        // The first poll will surface connection trouble.
      }
    }
    poll()
  }

  function onVisible() {
    if (document.visibilityState === 'visible' && !stopped) {
      if (timer) clearTimeout(timer)
      poll()
    }
  }

  function stop() {
    stopped = true
    if (timer) clearTimeout(timer)
    document.removeEventListener('visibilitychange', onVisible)
  }

  return { connection, start, stop, pollNow, nextPollMs, pollCycle }
}
