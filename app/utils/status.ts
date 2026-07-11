import type { DiscoEvent, DiscoJob, PipelineStatus } from '#shared/types'

const PIPELINE_STATUS_META: Record<PipelineStatus, { word: string; text: string; dot: string }> = {
  success: { word: 'passed', text: 'text-go-500', dot: 'bg-go-500' },
  failed: { word: 'failed', text: 'text-stop-500', dot: 'bg-stop-500' },
  pending: { word: 'running', text: 'text-night-600', dot: 'bg-night-600' },
  canceled: { word: 'canceled', text: 'text-warn-500', dot: 'bg-warn-500' },
}

export function pipelineStatusWord(status: PipelineStatus): string {
  return PIPELINE_STATUS_META[status].word
}

/** Tailwind text-color class for a pipeline status (status word, flood text, etc). */
export function pipelineStatusTextClass(status: PipelineStatus): string {
  return PIPELINE_STATUS_META[status].text
}

/** Tailwind bg-color class for a pipeline status dot. */
export function pipelineStatusDotClass(status: PipelineStatus): string {
  return PIPELINE_STATUS_META[status].dot
}

export function failedJobs(event: DiscoEvent): DiscoJob[] {
  return (event.jobs ?? []).filter((j) => j.status === 'failed')
}

/** Tailwind bg-color class for a single job's stage dot. */
export function jobDotClass(job: DiscoJob): string {
  if (job.status === 'failed') return job.allowFailure ? 'bg-warn-500' : 'bg-stop-500'
  if (job.status === 'success') return 'bg-go-500'
  if (job.status === 'canceled') return 'bg-warn-500'
  if (job.status === 'running') return 'bg-night-400'
  if (job.status === 'skipped') return 'bg-night-800'
  return 'bg-night-600' // pending
}
