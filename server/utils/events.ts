import type { DiscoEvent, EventsResponse, IncomingEvent } from '#shared/types'

const SEQ_KEY = 'disco:seq'
const EVENTS_KEY = 'disco:events'
const RETAIN = 200
const PAGE_SIZE = 50
const INITIAL_SIZE = 20

export async function appendEvent(incoming: IncomingEvent): Promise<DiscoEvent> {
  const kv = getRedis()
  const id = await kv.incr(SEQ_KEY)
  const event: DiscoEvent = { ...incoming, id, ts: Date.now() }
  await kv.zadd(EVENTS_KEY, { score: id, member: JSON.stringify(event) })
  await kv.zremrangebyrank(EVENTS_KEY, 0, -(RETAIN + 1))
  return event
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
