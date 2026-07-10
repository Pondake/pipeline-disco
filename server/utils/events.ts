import type { DiscoEvent, EventsResponse, IncomingEvent } from '#shared/types'

const SEQ_KEY = 'disco:seq'
const EVENTS_KEY = 'disco:events'
const RETAIN = 200
const PAGE_SIZE = 50
const INITIAL_SIZE = 20
const RETENTION_MS = 5 * 24 * 60 * 60 * 1000

export async function appendEvent(incoming: IncomingEvent): Promise<DiscoEvent> {
  const kv = getRedis()
  const id = await kv.incr(SEQ_KEY)
  const event: DiscoEvent = { ...incoming, id, ts: Date.now() }
  await kv.zadd(EVENTS_KEY, { score: id, member: JSON.stringify(event) })
  await kv.zremrangebyrank(EVENTS_KEY, 0, -(RETAIN + 1))
  await pruneStaleEvents()
  return event
}

/** Removes events older than the retention window. Piggybacks on ingest
 *  (rather than a cron job) since webhooks arrive far more often than 5 days. */
export async function pruneStaleEvents(): Promise<void> {
  const kv = getRedis()
  const cutoff = Date.now() - RETENTION_MS
  const raw = await kv.zrangeTail(EVENTS_KEY, RETAIN)
  const stale = raw.filter((member) => {
    try {
      return (JSON.parse(member) as DiscoEvent).ts < cutoff
    } catch {
      return true // corrupt entries are as good as stale
    }
  })
  if (stale.length) await kv.zrem(EVENTS_KEY, stale)
}

/** Deletes a single event by id. Returns false if it was already gone. */
export async function deleteEvent(id: number): Promise<boolean> {
  const kv = getRedis()
  const raw = await kv.zrangeByScore(EVENTS_KEY, id - 1, 1)
  const match = raw[0]
  if (!match) return false
  await kv.zrem(EVENTS_KEY, [match])
  return true
}

/** SET NX marker; returns false when this pipeline+status was already seen. */
export async function claimDedupe(pipelineId: number, status: string): Promise<boolean> {
  const result = await getRedis().set(`disco:dedupe:${pipelineId}:${status}`, '1', {
    nx: true,
    ex: 6 * 60 * 60,
  })
  return result !== null
}

function parseMembers(members: string[]): DiscoEvent[] {
  const events: DiscoEvent[] = []
  for (const member of members) {
    try {
      events.push(JSON.parse(member))
    } catch {
      // Skip corrupt entries rather than failing the poll.
    }
  }
  return events
}

export async function listEvents(cursor: number | null): Promise<EventsResponse> {
  const kv = getRedis()
  if (cursor === null) {
    const events = parseMembers(await kv.zrangeTail(EVENTS_KEY, INITIAL_SIZE))
    const last = events[events.length - 1]
    return { events, cursor: last?.id ?? 0, initial: true }
  }
  const events = parseMembers(await kv.zrangeByScore(EVENTS_KEY, cursor, PAGE_SIZE))
  const last = events[events.length - 1]
  return { events, cursor: last?.id ?? cursor, initial: false }
}
