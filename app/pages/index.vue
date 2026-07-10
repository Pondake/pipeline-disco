<script setup lang="ts">
import type { DiscoEvent, StatusResponse } from '#shared/types'

const { settings, load: loadSettings } = useSettings()
const { armed, checkAutoArm, playSound } = useAudio()
const tts = useTts()

const storeBackend = ref<StatusResponse['store'] | null>(null)

const feed = ref<DiscoEvent[]>([])
const latest = ref<DiscoEvent | null>(null)
const flash = ref<DiscoEvent | null>(null)
const muted = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | null = null

const FEED_LIMIT = 30

function pushToFeed(event: DiscoEvent) {
  // Same pipelineId as an existing row: update it in place (keeps its
  // chronological slot) instead of appending a second row when it resolves.
  const existingIndex = feed.value.findIndex((e) => e.pipelineId === event.pipelineId)
  if (existingIndex !== -1) {
    feed.value[existingIndex] = event
  } else {
    feed.value.push(event)
    if (feed.value.length > FEED_LIMIT) feed.value.splice(0, feed.value.length - FEED_LIMIT)
  }
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

function showFlash(event: DiscoEvent) {
  flash.value = event
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => (flash.value = null), 4000)
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
  if (flashTimer) clearTimeout(flashTimer)
})

const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
const statusWord = (e: DiscoEvent) =>
  e.status === 'success'
    ? 'passed'
    : e.status === 'failed'
      ? 'failed'
      : e.status === 'pending'
        ? 'running'
        : 'canceled'
const failedJobs = (e: DiscoEvent) => (e.jobs ?? []).filter((j) => j.status === 'failed')
</script>

<template>
  <main class="flex h-dvh flex-col overflow-hidden px-8 pt-10 pb-4 lg:px-14">
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
        class="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 px-12 text-center"
        :class="
          flash.status === 'success'
            ? 'bg-go-700'
            : flash.status === 'failed'
              ? 'bg-stop-700'
              : 'bg-night-800'
        "
      >
        <p class="text-4xl font-bold uppercase tracking-widest text-night-50/80">
          {{ statusWord(flash) }}
        </p>
        <h2 class="line-clamp-3 max-w-[24ch] text-7xl font-extrabold leading-tight text-night-50">
          {{ flash.mrTitle || flash.branch }}
        </h2>
        <p class="flex items-center gap-3 text-3xl text-night-50/80">
          <!-- Neutral chip on the flood: the viewport already carries the color. -->
          <span class="rounded-md bg-night-950/35 px-3 py-1 font-semibold text-night-50">
            {{ flash.project || flash.projectPath }}
          </span>
          {{ flash.author }}
        </p>
      </div>
    </Transition>

    <!-- Now zone -->
    <header class="shrink-0">
      <div class="flex items-baseline justify-between">
        <h1 class="text-sm font-semibold uppercase tracking-[0.3em] text-night-600">
          Pipeline Disco
        </h1>
        <span v-if="latest" class="text-sm text-night-600 tabular-nums">
          last event {{ timeFormat.format(latest.ts) }}
        </span>
      </div>

      <div v-if="latest" class="mt-6">
        <p
          class="flex items-center gap-3 text-2xl font-bold uppercase tracking-wide"
          :class="
            latest.status === 'success'
              ? 'text-go-500'
              : latest.status === 'failed'
                ? 'text-stop-500'
                : latest.status === 'pending'
                  ? 'text-night-600'
                  : 'text-warn-500'
          "
        >
          <span
            v-if="latest.status === 'pending'"
            class="size-2.5 shrink-0 animate-pulse-dot rounded-full bg-current"
            aria-hidden="true"
          />
          {{ statusWord(latest) }}
        </p>
        <p class="mt-1 truncate text-6xl font-extrabold leading-tight text-night-50">
          {{ latest.mrTitle || latest.branch }}
        </p>
        <p class="mt-3 flex items-center gap-3 text-2xl text-night-400">
          <RepoBadge
            :project-path="latest.projectPath || latest.project"
            :project="latest.project"
            size="lg"
          />
          {{ latest.author }}
        </p>
        <p v-if="latest.jobs?.length" class="mt-2 flex items-center gap-3 text-xl">
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
      <div v-else class="mt-6">
        <p class="animate-heartbeat text-6xl font-extrabold leading-tight text-night-600">
          All quiet on main
        </p>
        <p class="mt-2 text-2xl text-night-600">Waiting for the first pipeline</p>
      </div>
    </header>

    <!-- Ledger -->
    <section class="mt-10 min-h-0 flex-1 overflow-hidden" aria-label="Recent pipelines">
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
      <button
        class="toolbar-btn"
        :class="{ 'toolbar-btn-active': demo.running.value }"
        @click="demo.toggle()"
      >
        {{ demo.running.value ? `Demo on · next in ${demo.countdown.value}s` : 'Demo mode' }}
      </button>
      <button class="toolbar-btn" @click="testSound">Test sound</button>
      <button class="toolbar-btn" @click="simulate('success')">Simulate pass</button>
      <button class="toolbar-btn" @click="simulate('failed')">Simulate fail</button>
      <button class="toolbar-btn" :class="{ 'toolbar-btn-active': muted }" @click="muted = !muted">
        {{ muted ? 'Muted' : 'Mute' }}
      </button>
      <NuxtLink to="/settings" class="toolbar-btn">Settings</NuxtLink>
    </footer>
  </main>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.toolbar-btn {
  @apply rounded-md border border-night-800 bg-night-900 px-3 py-1.5 text-sm text-night-200 transition-colors duration-150 hover:border-night-600;
}
.toolbar-btn-active {
  @apply border-disco-500 text-disco-300;
}
</style>
