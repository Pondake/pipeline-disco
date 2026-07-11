<script setup lang="ts">
import type { DiscoEvent, StatusResponse } from '#shared/types'

const { settings, load: loadSettings } = useSettings()
const { armed, checkAutoArm, playSound } = useAudio()
const tts = useTts()

const storeBackend = ref<StatusResponse['store'] | null>(null)

const feed = ref<DiscoEvent[]>([])
const latest = ref<DiscoEvent | null>(null)
const { value: flash, show: showFlash } = useAutoDismiss<DiscoEvent>(4000)
const muted = ref(false)

const FEED_LIMIT = 30

function pushToFeed(event: DiscoEvent) {
  // Same pipelineId as an existing row (it resolved, or a retry reused the
  // id): drop the old row and re-append instead of updating in place, so the
  // freshest activity always surfaces at the top rather than sitting wherever
  // that pipeline first appeared.
  const existingIndex = feed.value.findIndex((e) => e.pipelineId === event.pipelineId)
  if (existingIndex !== -1) feed.value.splice(existingIndex, 1)
  feed.value.push(event)
  if (feed.value.length > FEED_LIMIT) feed.value.splice(0, feed.value.length - FEED_LIMIT)
  latest.value = event
}

function removeFromFeed(id: number) {
  const index = feed.value.findIndex((e) => e.id === id)
  if (index !== -1) feed.value.splice(index, 1)
}

async function announce(event: DiscoEvent) {
  if (muted.value || !armed.value) return
  const s = settings.value
  let soundSeconds = 0
  if (s.sound.enabled) {
    const soundId = s.sound[event.status]
    soundSeconds = await playSound(soundId, s.sound.volume)
  }
  if (s.tts.enabled) {
    const template =
      event.status === 'success'
        ? s.tts.successTemplate
        : event.status === 'failed'
          ? s.tts.failedTemplate
          : s.tts.canceledTemplate
    const text = renderTemplate(template, event)
    setTimeout(() => tts.speak(text, { voice: s.tts.voice, rate: s.tts.rate }), soundSeconds * 1000)
  }
}

function handleEvent(event: DiscoEvent, silent = false) {
  pushToFeed(event)
  // Pending is a quiet placeholder: no sound, no flood, until it resolves.
  if (silent || event.status === 'pending') return
  showFlash(event)
  announce(event)
}

const poller = useEventPoller(
  () => settings.value.polling,
  (events, initial) => {
    if (initial) {
      events.forEach((e) => pushToFeed(e))
      return
    }
    // A tab that was closed for a while can get a backlog: announce only the
    // most recent instead of blasting the room.
    const backlog = events.length > 3
    events.forEach((e, i) => handleEvent(e, backlog && i < events.length - 1))
  },
)

const demo = useDemoMode((event) => handleEvent(event))

async function simulate(status: 'success' | 'failed') {
  // Mirrors a real pipeline: a pending placeholder first, then the resolved
  // outcome for the same pipelineId a couple seconds later.
  const { event: pending } = await $fetch('/api/test-event', {
    method: 'POST',
    body: { status: 'pending' },
  })
  poller.pollNow() // don't make the room wait out the poll interval
  setTimeout(async () => {
    await $fetch('/api/test-event', {
      method: 'POST',
      body: {
        status,
        pipelineId: pending.pipelineId,
        project: pending.project,
        projectPath: pending.projectPath,
        branch: pending.branch,
        mrTitle: pending.mrTitle,
        mrIid: pending.mrIid,
        author: pending.author,
      },
    })
    poller.pollNow()
  }, 2500)
}

function testSound() {
  playSound(settings.value.sound.success, settings.value.sound.volume)
}

const toolbarActions = computed(() => [
  {
    key: 'demo',
    label: demo.running.value ? `Demo on · next in ${demo.countdown.value}s` : 'Demo mode',
    active: demo.running.value,
    onClick: () => demo.toggle(),
  },
  { key: 'test-sound', label: 'Test sound', onClick: testSound },
  { key: 'simulate-pass', label: 'Simulate pass', onClick: () => simulate('success') },
  { key: 'simulate-fail', label: 'Simulate fail', onClick: () => simulate('failed') },
  {
    key: 'mute',
    label: muted.value ? 'Muted' : 'Mute',
    active: muted.value,
    onClick: () => (muted.value = !muted.value),
  },
  { key: 'settings', label: 'Settings', to: '/settings' },
])

onMounted(async () => {
  await Promise.all([loadSettings(), checkAutoArm()])
  tts.loadVoices()
  poller.start()
  $fetch<StatusResponse>('/api/status')
    .then((s) => (storeBackend.value = s.store))
    .catch(() => {})
})

onUnmounted(() => {
  poller.stop()
})
</script>

<template>
  <main class="flex h-dvh flex-col overflow-hidden px-4 pt-6 pb-3 sm:px-8 sm:pt-10 sm:pb-4 lg:px-14">
    <ArmAudioOverlay v-if="!armed" />

    <!-- Drenched event moment: the whole viewport becomes the outcome. -->
    <Transition
      enter-active-class="transition-opacity duration-200 [transition-timing-function:var(--ease-out-quint)]"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-700 [transition-timing-function:var(--ease-out-quint)]"
      leave-to-class="opacity-0"
    >
      <div
        v-if="flash"
        class="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 px-6 text-center sm:gap-6 sm:px-12"
        :class="
          flash.status === 'success'
            ? 'bg-go-700'
            : flash.status === 'failed'
              ? 'bg-stop-700'
              : 'bg-night-800'
        "
      >
        <p class="text-2xl font-bold uppercase tracking-widest text-night-50/80 sm:text-3xl md:text-4xl">
          {{ pipelineStatusWord(flash.status) }}
        </p>
        <h2
          class="line-clamp-3 max-w-[24ch] text-4xl font-extrabold leading-tight text-night-50 sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {{ flash.mrTitle || flash.branch }}
        </h2>
        <p class="flex flex-wrap items-center justify-center gap-3 text-xl text-night-50/80 sm:text-2xl md:text-3xl">
          <!-- Neutral chip on the flood: the viewport already carries the color. -->
          <AppBadge size="lg" class="bg-night-950/35 text-night-50">
            {{ flash.project || flash.projectPath }}
          </AppBadge>
          {{ flash.author }}
        </p>
      </div>
    </Transition>

    <!-- Now zone -->
    <header class="shrink-0">
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 class="text-xs font-semibold uppercase tracking-[0.2em] text-night-600 sm:text-sm sm:tracking-[0.3em]">
          Pipeline Disco
        </h1>
        <span v-if="latest" class="text-xs text-night-600 tabular-nums sm:text-sm">
          last event {{ formatEventTime(latest.ts) }}
        </span>
      </div>

      <div v-if="latest" class="mt-4 sm:mt-6">
        <p
          class="flex items-center gap-3 text-lg font-bold uppercase tracking-wide sm:text-2xl"
          :class="pipelineStatusTextClass(latest.status)"
        >
          <StatusDot v-if="latest.status === 'pending'" size="lg" pulse class="bg-current" />
          {{ pipelineStatusWord(latest.status) }}
        </p>
        <p
          class="mt-1 line-clamp-2 break-words text-3xl font-extrabold leading-tight text-night-50 sm:line-clamp-1 sm:truncate sm:text-5xl lg:text-6xl"
        >
          {{ latest.mrTitle || latest.branch }}
        </p>
        <p class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-night-400 sm:mt-3 sm:text-2xl">
          <RepoBadge
            :project-path="latest.projectPath || latest.project"
            :project="latest.project"
            size="lg"
          />
          {{ latest.author }}
        </p>
        <p
          v-if="latest.jobs?.length"
          class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-xl"
        >
          <PipelineStages :jobs="latest.jobs" :stages="latest.stages" class="text-base" />
          <span
            v-if="latest.status === 'failed' && failedJobs(latest).length"
            class="text-stop-500"
          >
            failed:
            {{
              failedJobs(latest)
                .map((j) => j.name)
                .join(', ')
            }}
          </span>
        </p>
      </div>
      <div v-else class="mt-4 sm:mt-6">
        <p class="animate-heartbeat text-3xl font-extrabold leading-tight text-night-600 sm:text-5xl lg:text-6xl">
          All quiet on main
        </p>
        <p class="mt-2 text-base text-night-600 sm:text-2xl">Waiting for the first pipeline</p>
      </div>
    </header>

    <!-- Ledger -->
    <section class="mt-6 min-h-0 flex-1 overflow-hidden sm:mt-10" aria-label="Recent pipelines">
      <EventFeed :events="feed" @deleted="removeFromFeed" />
    </section>

    <!-- Toolbar -->
    <footer class="relative mt-4 flex shrink-0 items-center gap-3 pt-4">
      <!-- Replaces a static border-t: the resting track is always visible,
           and while listening an accent line sits on top of it, full width,
           closing in from both edges toward the center. It meeting at the
           center is the next poll firing. Linear timing (not the usual
           ease-out-quint) because it represents real elapsed time, not
           decoration. No accent line outside 'ok' — a stalled retry has no
           meaningful countdown, so the track goes back to plain and static. -->
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-px bg-night-900"
        aria-hidden="true"
      />
      <div
        v-if="poller.connection.value === 'ok'"
        :key="poller.pollCycle.value"
        class="pointer-events-none absolute inset-x-0 top-0 h-px bg-disco-500/50"
        :style="{
          animation: `poll-countdown ${poller.nextPollMs.value || 4000}ms linear 1 forwards`,
        }"
        aria-hidden="true"
      />
      <ConnectionStatus :state="poller.connection.value" />
      <StoreStatus :store="storeBackend" />
      <span class="flex-1" />

      <!-- Full row from sm up; below that the row would wrap into a cramped
           multi-line grid, so it collapses into a single popover trigger. -->
      <div class="hidden items-center gap-3 sm:flex">
        <AppButton
          v-for="action in toolbarActions"
          :key="action.key"
          class="px-3 py-1.5 text-sm"
          :active="action.active"
          :to="action.to"
          @click="action.onClick?.()"
        >
          {{ action.label }}
        </AppButton>
      </div>
      <ActionsMenu class="sm:hidden">
        <AppButton
          v-for="action in toolbarActions"
          :key="action.key"
          class="w-full justify-start px-3 py-2 text-sm"
          :active="action.active"
          :to="action.to"
          @click="action.onClick?.()"
        >
          {{ action.label }}
        </AppButton>
      </ActionsMenu>
    </footer>
  </main>
</template>
