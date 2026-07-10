export type PipelineStatus = 'success' | 'failed' | 'canceled'

export interface DiscoEvent {
  /** Monotonic sequence id assigned at ingest; doubles as the polling cursor. */
  id: number
  /** Epoch ms at ingest. */
  ts: number
  pipelineId: number
  status: PipelineStatus
  project: string
  projectPath: string
  projectId?: number
  branch: string
  mrTitle?: string
  mrIid?: number
  mrUrl?: string
  author: string
  source: string
  /** Seconds, when GitLab reports it. */
  duration?: number
  /** True for locally generated demo events (never stored server-side). */
  demo?: boolean
}

/** A DiscoEvent before ingest assigns id/ts. */
export type IncomingEvent = Omit<DiscoEvent, 'id' | 'ts'>

export interface IgnoreSettings {
  /** Project path_with_namespace or numeric id as string. */
  projects: string[]
  /** Glob patterns matched against branch names. */
  branchPatterns: string[]
  /** Glob patterns matched against MR titles. */
  titlePatterns: string[]
  onlyMrPipelines: boolean
  reactToCanceled: boolean
}

export interface SoundSettings {
  enabled: boolean
  success: string
  failed: string
  canceled: string
  volume: number
}

export interface TtsSettings {
  enabled: boolean
  successTemplate: string
  failedTemplate: string
  canceledTemplate: string
  /** voiceURI; empty string means the browser default. */
  voice: string
  rate: number
}

export interface PollingSettings {
  activeMs: number
  idleMs: number
}

export interface Settings {
  version: number
  ignore: IgnoreSettings
  sound: SoundSettings
  tts: TtsSettings
  polling: PollingSettings
}

export interface EventsResponse {
  events: DiscoEvent[]
  cursor: number
  /** True when no cursor was supplied: render history, play no audio. */
  initial: boolean
}

export interface StatusResponse {
  /** 'memory' means events don't survive across serverless invocations. */
  store: 'upstash' | 'memory'
}
