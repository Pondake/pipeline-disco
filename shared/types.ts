export type PipelineStatus = 'pending' | 'success' | 'failed' | 'canceled'

/** Normalized job status. created/pending/manual/scheduled/waiting_for_resource/preparing
 *  collapse to 'pending', same idea as pipeline status collapsing. */
export type JobStatus = 'pending' | 'running' | 'success' | 'failed' | 'canceled' | 'skipped'

export interface DiscoJob {
  name: string
  stage: string
  status: JobStatus
  /** True when GitLab allow_failure is set — a failed job with this true is a soft/expected
   *  failure and should render warn/amber, not stop/red. */
  allowFailure?: boolean
}

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
  /** Ordered stage names (object_attributes.stages). Groups `jobs` and preserves stage
   *  order even if job order in the payload doesn't match. Present only on terminal
   *  events — builds[] is stale/incomplete while the pipeline is still running. */
  stages?: string[]
  /** Flat job list; group client-side by `stage` in `stages` order to render the glyph.
   *  Omitted on pending events. */
  jobs?: DiscoJob[]
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
