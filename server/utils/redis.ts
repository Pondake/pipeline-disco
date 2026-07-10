import { Redis } from '@upstash/redis'

/**
 * The subset of Redis commands this app uses. Values are stored as plain
 * strings (automaticDeserialization is off) so the real client and the
 * in-memory mock behave identically.
 */
export interface KV {
  get(key: string): Promise<string | null>
  set(
    key: string,
    value: string,
    opts?: { nx?: boolean; ex?: number },
  ): Promise<string | null>
  incr(key: string): Promise<number>
  zadd(key: string, entry: { score: number; member: string }): Promise<unknown>
  zrangeByScore(key: string, minExclusive: number, count: number): Promise<string[]>
  zrangeTail(key: string, count: number): Promise<string[]>
  zremrangebyrank(key: string, start: number, stop: number): Promise<unknown>
}

function upstashKV(): KV {
  const redis = Redis.fromEnv({ automaticDeserialization: false })
  return {
    get: (key) => redis.get<string>(key),
    set: (key, value, opts) =>
      redis.set(key, value, {
        ...(opts?.nx ? { nx: true } : {}),
        ...(opts?.ex ? { ex: opts.ex } : {}),
      }) as Promise<string | null>,
    incr: (key) => redis.incr(key),
    zadd: (key, entry) => redis.zadd(key, entry),
    zrangeByScore: (key, minExclusive, count) =>
      redis.zrange<string[]>(key, `(${minExclusive}`, '+inf', {
        byScore: true,
        offset: 0,
        count,
      }),
    zrangeTail: (key, count) => redis.zrange<string[]>(key, -count, -1),
    zremrangebyrank: (key, start, stop) => redis.zremrangebyrank(key, start, stop),
  }
}

interface MemoryStore {
  strings: Map<string, { value: string; expiresAt: number | null }>
  zsets: Map<string, Array<{ score: number; member: string }>>
}

function memoryKV(): KV {
  // Survive dev-server HMR reloads within the same process.
  const g = globalThis as { __discoMemoryStore?: MemoryStore }
  const store = (g.__discoMemoryStore ??= {
    strings: new Map(),
    zsets: new Map(),
  })

  const liveGet = (key: string) => {
    const entry = store.strings.get(key)
    if (!entry) return null
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      store.strings.delete(key)
      return null
    }
    return entry.value
  }

  return {
    async get(key) {
      return liveGet(key)
    },
    async set(key, value, opts) {
      if (opts?.nx && liveGet(key) !== null) return null
      store.strings.set(key, {
        value,
        expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : null,
      })
      return 'OK'
    },
    async incr(key) {
      const next = Number(liveGet(key) ?? '0') + 1
      store.strings.set(key, { value: String(next), expiresAt: null })
      return next
    },
    async zadd(key, entry) {
      const zset = store.zsets.get(key) ?? []
      const filtered = zset.filter((e) => e.member !== entry.member)
      filtered.push(entry)
      filtered.sort((a, b) => a.score - b.score)
      store.zsets.set(key, filtered)
      return 1
    },
    async zrangeByScore(key, minExclusive, count) {
      const zset = store.zsets.get(key) ?? []
      return zset
        .filter((e) => e.score > minExclusive)
        .slice(0, count)
        .map((e) => e.member)
    },
    async zrangeTail(key, count) {
      const zset = store.zsets.get(key) ?? []
      return zset.slice(-count).map((e) => e.member)
    },
    async zremrangebyrank(key, start, stop) {
      const zset = store.zsets.get(key) ?? []
      const len = zset.length
      const from = start < 0 ? Math.max(0, len + start) : start
      const to = stop < 0 ? len + stop : Math.min(stop, len - 1)
      if (to < from) return 0
      zset.splice(from, to - from + 1)
      store.zsets.set(key, zset)
      return 1
    },
  }
}

let kv: KV | null = null

export function getRedis(): KV {
  if (!kv) {
    kv = process.env.UPSTASH_REDIS_REST_URL ? upstashKV() : memoryKV()
  }
  return kv
}
