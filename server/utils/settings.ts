import type { Settings } from '#shared/types'
import { defaultSettings } from '#shared/utils/defaults'

const SETTINGS_KEY = 'disco:settings'

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && s.trim() !== '').map((s) => s.trim()) : []

/** Merge an untrusted partial onto defaults, clamping numeric fields. */
export function normalizeSettings(raw: unknown): Settings {
  const d = defaultSettings()
  if (!raw || typeof raw !== 'object') return d
  const r = raw as Record<string, any>
  return {
    version: 1,
    ignore: {
      projects: strings(r.ignore?.projects),
      branchPatterns: strings(r.ignore?.branchPatterns),
      titlePatterns: strings(r.ignore?.titlePatterns),
      onlyMrPipelines: Boolean(r.ignore?.onlyMrPipelines ?? d.ignore.onlyMrPipelines),
      reactToCanceled: Boolean(r.ignore?.reactToCanceled ?? d.ignore.reactToCanceled),
    },
    sound: {
      enabled: Boolean(r.sound?.enabled ?? d.sound.enabled),
      success: typeof r.sound?.success === 'string' ? r.sound.success : d.sound.success,
      failed: typeof r.sound?.failed === 'string' ? r.sound.failed : d.sound.failed,
      canceled: typeof r.sound?.canceled === 'string' ? r.sound.canceled : d.sound.canceled,
      volume: clamp(Number(r.sound?.volume ?? d.sound.volume) || d.sound.volume, 0, 1),
    },
    tts: {
      enabled: Boolean(r.tts?.enabled ?? d.tts.enabled),
      successTemplate:
        typeof r.tts?.successTemplate === 'string' ? r.tts.successTemplate : d.tts.successTemplate,
      failedTemplate:
        typeof r.tts?.failedTemplate === 'string' ? r.tts.failedTemplate : d.tts.failedTemplate,
      canceledTemplate:
        typeof r.tts?.canceledTemplate === 'string' ? r.tts.canceledTemplate : d.tts.canceledTemplate,
      voice: typeof r.tts?.voice === 'string' ? r.tts.voice : d.tts.voice,
      rate: clamp(Number(r.tts?.rate ?? d.tts.rate) || d.tts.rate, 0.5, 2),
    },
    polling: {
      activeMs: clamp(Number(r.polling?.activeMs ?? d.polling.activeMs) || d.polling.activeMs, 2000, 60000),
      idleMs: clamp(Number(r.polling?.idleMs ?? d.polling.idleMs) || d.polling.idleMs, 5000, 120000),
    },
  }
}

export async function getSettings(): Promise<Settings> {
  const raw = await getRedis().get(SETTINGS_KEY)
  if (!raw) return defaultSettings()
  try {
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return defaultSettings()
  }
}

export async function saveSettings(raw: unknown): Promise<Settings> {
  const settings = normalizeSettings(raw)
  await getRedis().set(SETTINGS_KEY, JSON.stringify(settings))
  return settings
}
