import type { IncomingEvent, PipelineStatus, Settings } from '#shared/types'
import { matchesAny } from '#shared/utils/match'

const TERMINAL_STATUSES: PipelineStatus[] = ['success', 'failed', 'canceled']
// GitLab fires the pipeline webhook again for each of these; all collapse to
// our single 'pending' status so the dedupe key stays stable and the ledger
// gets one gray placeholder instead of a flicker of updates.
const PENDING_GITLAB_STATUSES = ['created', 'pending', 'running', 'waiting_for_resource', 'preparing']

/**
 * Extract a DiscoEvent from a GitLab pipeline webhook payload.
 * Returns null for statuses we never react to (skipped, manual, scheduled, ...).
 */
export function parsePipelineEvent(body: any): IncomingEvent | null {
  const attrs = body?.object_attributes
  if (!attrs || typeof attrs.id !== 'number') return null
  const rawStatus = attrs.status as string
  const status: PipelineStatus | null = TERMINAL_STATUSES.includes(rawStatus as PipelineStatus)
    ? (rawStatus as PipelineStatus)
    : PENDING_GITLAB_STATUSES.includes(rawStatus)
      ? 'pending'
      : null
  if (!status) return null

  const mr = body.merge_request
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
