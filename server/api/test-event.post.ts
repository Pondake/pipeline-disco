import type { PipelineStatus } from '#shared/types'

const TITLES = [
  'Fix login redirect loop',
  'Bump node to 24 in CI image',
  'Refactor invoice exporter',
  'Add rate limiting to public API',
  'Migrate customer table to uuid keys',
]
const PROJECTS = [
  { name: 'billing-service', path: 'platform/billing-service' },
  { name: 'customer-portal', path: 'web/customer-portal' },
  { name: 'infra-tooling', path: 'ops/infra-tooling' },
]
const AUTHORS = ['Sam', 'Ines', 'Ruben', 'Priya']

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!

/**
 * Injects a fake event through the real store, so the Simulate button
 * exercises the full ingest -> poll -> audio pipeline. Session-gated by the
 * global auth middleware.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const status: PipelineStatus =
    body?.status === 'failed' ? 'failed' : body?.status === 'pending' ? 'pending' : 'success'
  const project =
    body?.project && body?.projectPath ? { name: body.project, path: body.projectPath } : pick(PROJECTS)
  const stored = await appendEvent({
    // Reused across the pending -> resolved pair so the client merges them into one row.
    pipelineId: typeof body?.pipelineId === 'number' ? body.pipelineId : Date.now(),
    status,
    project: project.name,
    projectPath: project.path,
    branch: body?.branch ?? 'feature/simulated',
    mrTitle: body?.mrTitle ?? pick(TITLES),
    mrIid: typeof body?.mrIid === 'number' ? body.mrIid : Math.floor(Math.random() * 900) + 100,
    author: body?.author ?? pick(AUTHORS),
    source: 'merge_request_event',
    duration: Math.floor(Math.random() * 500) + 60,
  })
  return { ok: true, event: stored }
})
