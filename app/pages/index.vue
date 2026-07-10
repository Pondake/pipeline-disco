<script setup lang="ts">
import type { DiscoEvent } from '#shared/types'

const { settings, load: loadSettings } = useSettings()
const { armed, checkAutoArm, playSound } = useAudio()
const tts = useTts()

const feed = ref<DiscoEvent[]>([])
const latest = ref<DiscoEvent | null>(null)
const flash = ref<DiscoEvent | null>(null)
const muted = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | null = null

const FEED_LIMIT = 30

function pushToFeed(event: DiscoEvent) {
  feed.value.push(event)
  if (feed.value.length > FEED_LIMIT) feed.value.splice(0, feed.value.length - FEED_LIMIT)
  latest.value = event
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
  if (silent) return
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
  await $fetch('/api/test-event', { method: 'POST', body: { status } })
  poller.pollNow() // don't make the room wait out the poll interval
}

function testSound() {
  playSound(settings.value.sound.success, settings.value.sound.volume)
}

onMounted(async () => {
  await Promise.all([loadSettings(), checkAutoArm()])
  tts.loadVoices()
  poller.start()
})

onUnmounted(() => {
  poller.stop()
  if (flashTimer) clearTimeout(flashTimer)
})

const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
const statusWord = (e: DiscoEvent) =>
  e.status === 'success' ? 'passed' : e.status === 'failed' ? 'failed' : 'canceled'
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
        :class="flash.status === 'success' ? 'bg-go-700' : flash.status === 'failed' ? 'bg-stop-700' : 'bg-night-800'"
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
          class="text-2xl font-bold uppercase tracking-wide"
          :class="
            latest.status === 'success'
              ? 'text-go-500'
              : latest.status === 'failed'
                ? 'text-stop-500'
                : 'text-warn-500'
          "
        >
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
      <EventFeed :events="feed" />
    </section>

    <!-- Toolbar -->
    <footer class="mt-4 flex shrink-0 items-center gap-3 border-t border-night-900 pt-4">
      <ConnectionStatus :state="poller.connection.value" />
      <span class="flex-1" />
      <button class="toolbar-btn" :class="{ 'toolbar-btn-active': demo.running.value }" @click="demo.toggle()">
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
