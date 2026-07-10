import type { DiscoEvent } from '#shared/types'

const DEMO_INTERVAL_MS = 10000

const SAMPLES: Array<Pick<DiscoEvent, 'project' | 'projectPath' | 'branch' | 'mrTitle' | 'author'>> = [
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
export function useDemoMode(onEvent: (event: DiscoEvent) => void) {
  const running = ref(false)
  const countdown = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null
  let tick = 0

  function emit() {
    tick++
    const sample = SAMPLES[tick % SAMPLES.length]!
    onEvent({
      ...sample,
      id: -tick, // negative: never collides with server ids
      ts: Date.now(),
      pipelineId: -tick,
      status: tick % 2 === 0 ? 'failed' : 'success',
      source: 'merge_request_event',
      mrIid: 100 + tick,
      duration: 120 + tick * 7,
      demo: true,
    })
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
  }

  function toggle() {
    running.value ? stop() : start()
  }

  onUnmounted(stop)

  return { running, countdown, toggle, stop }
}
