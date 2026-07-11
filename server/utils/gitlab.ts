import type { PipelineEvent } from 'gitlab-event-types'
import type { DiscoJob, IncomingEvent, JobStatus, PipelineStatus, Settings } from '#shared/types'
import { matchesAny } from '#shared/utils/match'

/**
 * `gitlab-event-types` is the closest thing to an authoritative TS source for
 * GitLab's webhook shapes — GitLab doesn't publish its own package.
 * object_attributes, builds[], project, and user match GitLab's own docs
 * (https://docs.gitlab.com/user/project/integrations/webhook_events/)
 * closely, so those come straight from the library; patched below only for
 * two confirmed-real-but-missing fields, object_attributes.source and
 * builds[].allow_failure. `merge_request` is the one exception: the library
 * reuses the full merge-request-event shape for it, which doesn't match what
 * a pipeline event actually sends (a stripped payload that's missing `url`,
 * which the docs confirm IS sent) — so that field stays hand-shaped rather
 * than inherited, verified line-by-line against GitLab's example payload
 * (also how we confirmed object_attributes has no `updated_at` — pending
 * statuses genuinely have no stable per-run timestamp to dedupe against).
 */
export type GitlabPipelineEvent = Omit<
  PipelineEvent,
  'object_attributes' | 'builds' | 'merge_request'
> & {
  object_attributes: PipelineEvent['object_attributes'] & { source?: string }
  builds: Array<PipelineEvent['builds'][number] & { allow_failure?: boolean }>
  merge_request?: { title?: string; iid?: number; url?: string }
}

const TERMINAL_STATUSES: PipelineStatus[] = ['success', 'failed', 'canceled']
// GitLab fires the pipeline webhook again for each of these; all collapse to
// our single 'pending' status so the dedupe key stays stable and the ledger
// gets one gray placeholder instead of a flicker of updates.
const PENDING_GITLAB_STATUSES = [
  'created',
  'pending',
  'running',
  'waiting_for_resource',
  'preparing',
]

const JOB_LIVE_OR_TERMINAL: Record<string, JobStatus> = {
  success: 'success',
  failed: 'failed',
  canceled: 'canceled',
  skipped: 'skipped',
  running: 'running',
}
function normalizeJobStatus(raw: string): JobStatus {
  return JOB_LIVE_OR_TERMINAL[raw] ?? 'pending'
}

// builds[] is only reliable once the pipeline has resolved (GitLab fires the
// pipeline webhook on pipeline-level transitions, not per job), so this is
// only called for terminal statuses.
function extractJobs(builds: GitlabPipelineEvent['builds'] | undefined): DiscoJob[] | undefined {
  if (!Array.isArray(builds) || builds.length === 0) return undefined
  return builds.map((b) => ({
    name: b.name,
    stage: b.stage,
    status: normalizeJobStatus(b.status),
    ...(b.allow_failure ? { allowFailure: true } : {}),
  }))
}

/**
 * Extract a DiscoEvent from a GitLab pipeline webhook payload.
 * Returns null for statuses we never react to (skipped, manual, scheduled, ...).
 */
export function parsePipelineEvent(body: GitlabPipelineEvent): IncomingEvent | null {
  // Still guarded at runtime despite the type saying these are required —
  // the type is a hint for untrusted external JSON, not a guarantee.
  const attrs = body?.object_attributes
  if (!attrs || typeof attrs.id !== 'number') return null
  const rawStatus = attrs.status
  const status: PipelineStatus | null = TERMINAL_STATUSES.includes(rawStatus as PipelineStatus)
    ? (rawStatus as PipelineStatus)
    : PENDING_GITLAB_STATUSES.includes(rawStatus)
      ? 'pending'
      : null
  if (!status) return null

  const mr = body.merge_request
  const jobs = status !== 'pending' ? extractJobs(body.builds) : undefined
  const stages = jobs && Array.isArray(attrs.stages) ? attrs.stages : undefined
  return {
    pipelineId: attrs.id,
    status,
    project: body.project?.name ?? body.project?.path_with_namespace ?? 'unknown project',
    projectPath: body.project?.path_with_namespace ?? '',
    projectId: typeof body.project?.id === 'number' ? body.project.id : undefined,
    branch: attrs.ref ?? '',
    mrTitle: mr?.title ?? undefined,
    mrIid: mr?.iid ?? undefined,
    mrUrl: mr?.url ?? undefined,
    author: body.user?.name ?? 'someone',
    source: attrs.source ?? 'unknown',
    duration: typeof attrs.duration === 'number' ? attrs.duration : undefined,
    stages,
    jobs,
  }
}

export function shouldIgnore(event: IncomingEvent, settings: Settings): boolean {
  const { ignore } = settings
  if (ignore.onlyMrPipelines && event.source !== 'merge_request_event') return true
  if (
    ignore.projects.some(
      (p) => p === event.projectPath || p === String(event.projectId ?? '') || p === event.project,
    )
  ) {
    return true
  }
  if (ignore.branchPatterns.length && matchesAny(event.branch, ignore.branchPatterns)) return true
  if (
    ignore.titlePatterns.length &&
    event.mrTitle &&
    matchesAny(event.mrTitle, ignore.titlePatterns)
  ) {
    return true
  }
  return false
}
