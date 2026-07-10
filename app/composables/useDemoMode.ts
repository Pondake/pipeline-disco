import type { DiscoEvent, DiscoJob } from '#shared/types'

const DEMO_INTERVAL_MS = 10000

const DEMO_STAGES = ['build', 'test', 'deploy']
// failStage: index into DEMO_STAGES to fail a hard (non-allowed) job in, or
// null for an all-pass pipeline. flaky-e2e always fails but is allow_failure,
// exercising the amber "soft failure" case regardless of overall outcome.
function demoJobs(failStage: number | null): DiscoJob[] {
  return [
    { name: 'compile', stage: 'build', status: 'success' },
    { name: 'unit', stage: 'test', status: failStage === 1 ? 'failed' : 'success' },
    { name: 'lint', stage: 'test', status: 'success' },
    { name: 'flaky-e2e', stage: 'test', status: 'failed', allowFailure: true },
    {
      name: 'deploy-staging',
      stage: 'deploy',
      status: failStage === 2 ? 'failed' : failStage !== null ? 'skipped' : 'success',
    },
  ]
}

const SAMPLES: Array<
  Pick<DiscoEvent, 'project' | 'projectPath' | 'branch' | 'mrTitle' | 'author'>
> = [
  {
    project: 'customer-portal',
    projectPath: 'web/customer-portal',
    branch: 'feature/sso-login',
    mrTitle: 'Add SSO login flow',
    author: 'Ines',
  },
  {
    project: 'billing-service',
    projectPath: 'platform/billing-service',
    branch: 'fix/rounding-error',
    mrTitle: 'Fix invoice rounding error',
    author: 'Sam',
  },
  {
    project: 'infra-tooling',
    projectPath: 'ops/infra-tooling',
    branch: 'chore/upgrade-terraform',
    mrTitle: 'Upgrade terraform to 1.10',
    author: 'Priya',
  },
  {
    project: 'mobile-api',
    projectPath: 'platform/mobile-api',
    branch: 'feat/push-notifications',
    mrTitle: 'Wire up push notifications',
    author: 'Ruben',
  },
]

/**
 * Client-only fake event generator for auditioning the audio setup.
 * Emits through the same handler as real events; nothing touches the server.
 */
// Chance a demo pipeline shows a pending placeholder before it resolves,
// same as a real GitLab pipeline landing on the board.
const PENDING_CHANCE = 0.6
const PENDING_MIN_MS = 1500
const PENDING_MAX_MS = 3500

export function useDemoMode(onEvent: (event: DiscoEvent) => void) {
  const running = ref(false)
  const countdown = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null
  let resolveTimer: ReturnType<typeof setTimeout> | null = null
  let tick = 0
  let eventId = 0

  // negative: never collides with server ids
  const nextId = () => --eventId

  function emit() {
    tick++
    const sample = SAMPLES[tick % SAMPLES.length]!
    const base = {
      ...sample,
      pipelineId: -tick,
      source: 'merge_request_event',
      mrIid: 100 + tick,
      duration: 120 + tick * 7,
      demo: true,
    }
    const status = tick % 2 === 0 ? 'failed' : 'success'
    // jobs are only meaningful once a pipeline resolves (mirrors the real
    // webhook, where builds[] is stale while still running), so they're only
    // attached on the resolved event, never the pending placeholder.
    const resolve = () =>
      onEvent({
        ...base,
        id: nextId(),
        ts: Date.now(),
        status,
        stages: DEMO_STAGES,
        jobs: demoJobs(status === 'failed' ? (tick % 4 === 0 ? 1 : 2) : null),
      })

    if (Math.random() < PENDING_CHANCE) {
      onEvent({ ...base, id: nextId(), ts: Date.now(), status: 'pending' })
      resolveTimer = setTimeout(
        resolve,
        PENDING_MIN_MS + Math.random() * (PENDING_MAX_MS - PENDING_MIN_MS),
      )
    } else {
      resolve()
    }
    countdown.value = DEMO_INTERVAL_MS / 1000
  }

  function start() {
    if (running.value) return
    running.value = true
    emit()
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) emit()
    }, 1000)
  }

  function stop() {
    running.value = false
    if (timer) clearInterval(timer)
    timer = null
    if (resolveTimer) clearTimeout(resolveTimer)
    resolveTimer = null
  }

  function toggle() {
    if (running.value) stop()
    else start()
  }

  onUnmounted(stop)

  return { running, countdown, toggle, stop }
}
