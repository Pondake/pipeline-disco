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

<template>
  <section>
    <h2 class="text-xl font-bold text-night-50">Sounds</h2>
    <p class="mt-1 text-sm text-night-400">
      Built-in synth sounds work with zero files. Drop .mp3/.wav/.ogg files into
      <code class="rounded bg-night-900 px-1 py-0.5">app/assets/sounds/</code> and redeploy to add
      your own.
    </p>

    <CheckboxField
      v-model="sound.enabled"
      label="Play a sound on pipeline events"
      class="mt-6"
    />

    <div
      class="mt-6 flex flex-col gap-4"
      :class="{ 'pointer-events-none opacity-40': !sound.enabled }"
    >
      <SettingsRow v-for="o in outcomes" :key="o.key" :label="o.label" :input-id="`sound-${o.key}`">
        <SoundPicker
          :id="`sound-${o.key}`"
          v-model="sound[o.key]"
          :sounds="availableSounds"
          :volume="sound.volume"
          :label="o.label"
          class="col-span-2"
        />
      </SettingsRow>

      <SettingsRow label="Volume" input-id="volume">
        <input
          id="volume"
          v-model.number="sound.volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          class="cursor-pointer accent-disco-500"
        />
        <span class="w-10 text-right text-sm text-night-400 tabular-nums">
          {{ Math.round(sound.volume * 100) }}%
        </span>
      </SettingsRow>
    </div>
  </section>
</template>
