<template>
  <section>
    <h2 class="text-night-50 text-xl font-bold">Sounds</h2>
    <p class="text-night-400 mt-1 text-sm">
      Built-in synth sounds work with zero files. Drop .mp3/.wav/.ogg files into
      <code class="bg-night-900 rounded px-1 py-0.5">app/assets/sounds/</code> and redeploy to add
      your own.
    </p>

    <checkbox-field v-model="sound.enabled" label="Play a sound on pipeline events" class="mt-6" />

    <div
      class="mt-6 flex flex-col gap-4"
      :class="{ 'pointer-events-none opacity-40': !sound.enabled }"
    >
      <settings-row
        v-for="o in outcomes"
        :key="o.key"
        :label="o.label"
        :input-id="`sound-${o.key}`"
      >
        <sound-picker
          :id="`sound-${o.key}`"
          v-model="sound[o.key]"
          :sounds="availableSounds"
          :volume="sound.volume"
          :label="o.label"
          class="col-span-2"
        />
      </settings-row>

      <settings-row label="Volume" input-id="volume">
        <input
          id="volume"
          v-model.number="sound.volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          class="accent-disco-500 cursor-pointer"
        />
        <span class="text-night-400 w-10 text-right text-sm tabular-nums">
          {{ Math.round(sound.volume * 100) }}%
        </span>
      </settings-row>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { SoundSettings } from '#shared/types'

const sound = defineModel<SoundSettings>({ required: true })
const { availableSounds } = useAudio()

const outcomes = [
  { key: 'success', label: 'On pass' },
  { key: 'failed', label: 'On fail' },
  { key: 'canceled', label: 'On cancel' },
] as const
</script>
