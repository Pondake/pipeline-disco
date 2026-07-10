<script setup lang="ts">
import type { SoundSettings } from '#shared/types'

const sound = defineModel<SoundSettings>({ required: true })
const { playSound, availableSounds } = useAudio()

const outcomes = [
  { key: 'success', label: 'On pass' },
  { key: 'failed', label: 'On fail' },
  { key: 'canceled', label: 'On cancel' },
] as const

function preview(id: string) {
  playSound(id, sound.value.volume)
}
</script>

<template>
  <section>
    <h2 class="text-xl font-bold text-night-50">Sounds</h2>
    <p class="mt-1 text-sm text-night-400">
      Built-in synth sounds work with zero files. Drop .mp3/.wav/.ogg files into
      <code class="rounded bg-night-900 px-1 py-0.5">app/assets/sounds/</code> and redeploy to add
      your own.
    </p>

    <label class="mt-6 flex items-center gap-3">
      <input v-model="sound.enabled" type="checkbox" class="size-4 accent-disco-500" />
      <span class="font-semibold text-night-200">Play a sound on pipeline events</span>
    </label>

    <div
      class="mt-6 flex flex-col gap-4"
      :class="{ 'pointer-events-none opacity-40': !sound.enabled }"
    >
      <div
        v-for="o in outcomes"
        :key="o.key"
        class="grid grid-cols-[6rem_1fr_auto] items-center gap-3"
      >
        <label :for="`sound-${o.key}`" class="text-sm font-semibold text-night-200">
          {{ o.label }}
        </label>
        <select
          :id="`sound-${o.key}`"
          v-model="sound[o.key]"
          class="rounded-md border border-night-800 bg-night-900 px-3 py-2 text-night-50"
        >
          <option v-for="s in availableSounds" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>
        <button
          type="button"
          class="rounded-md border border-night-800 bg-night-900 px-3 py-2 text-sm text-night-200 transition-colors duration-150 hover:border-night-600"
          @click="preview(sound[o.key])"
        >
          Play
        </button>
      </div>

      <div class="grid grid-cols-[6rem_1fr_auto] items-center gap-3">
        <label for="volume" class="text-sm font-semibold text-night-200">Volume</label>
        <input
          id="volume"
          v-model.number="sound.volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          class="accent-disco-500"
        />
        <span class="w-10 text-right text-sm text-night-400 tabular-nums">
          {{ Math.round(sound.volume * 100) }}%
        </span>
      </div>
    </div>
  </section>
</template>
