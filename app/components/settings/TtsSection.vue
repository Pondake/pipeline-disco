<script setup lang="ts">
import type { DiscoEvent, TtsSettings } from '#shared/types'

const tts = defineModel<TtsSettings>({ required: true })
const engine = useTts()

onMounted(() => engine.loadVoices())

const SAMPLE_EVENT: DiscoEvent = {
  id: 0,
  ts: Date.now(),
  pipelineId: 0,
  status: 'success',
  project: 'customer-portal',
  projectPath: 'web/customer-portal',
  branch: 'feature/sso-login',
  mrTitle: 'Add SSO login flow',
  author: 'Ines',
  source: 'merge_request_event',
  duration: 192,
}

const templates = [
  { key: 'successTemplate', label: 'On pass' },
  { key: 'failedTemplate', label: 'On fail' },
  { key: 'canceledTemplate', label: 'On cancel' },
] as const

function speakTest(template: string) {
  engine.speak(renderTemplate(template, SAMPLE_EVENT), {
    voice: tts.value.voice,
    rate: tts.value.rate,
  })
}
</script>

<template>
  <section>
    <h2 class="text-xl font-bold text-night-50">Text to speech</h2>
    <p class="mt-1 text-sm text-night-400">
      Placeholders:
      <code
        v-for="p in ['{mr_title}', '{project}', '{branch}', '{status}', '{author}', '{duration}']"
        :key="p"
        class="mr-1.5 rounded bg-night-900 px-1 py-0.5"
        >{{ p }}</code
      >
    </p>

    <CheckboxField v-model="tts.enabled" label="Speak an announcement" class="mt-6" />

    <div
      class="mt-6 flex flex-col gap-4"
      :class="{ 'pointer-events-none opacity-40': !tts.enabled }"
    >
      <SettingsRow v-for="t in templates" :key="t.key" :label="t.label" :input-id="`tts-${t.key}`">
        <input
          :id="`tts-${t.key}`"
          v-model="tts[t.key]"
          type="text"
          class="rounded-md border border-night-800 bg-night-900 px-3 py-2 text-night-50"
        />
        <AppButton class="px-3 py-2 text-sm" @click="speakTest(tts[t.key])">Speak</AppButton>
      </SettingsRow>

      <SettingsRow label="Voice" input-id="voice">
        <select
          id="voice"
          v-model="tts.voice"
          class="cursor-pointer rounded-md border border-night-800 bg-night-900 px-3 py-2 text-night-50"
        >
          <option value="">Browser default</option>
          <option v-for="v in engine.voices.value" :key="v.voiceURI" :value="v.voiceURI">
            {{ v.name }} ({{ v.lang }})
          </option>
        </select>
        <span />
      </SettingsRow>

      <SettingsRow label="Rate" input-id="rate">
        <input
          id="rate"
          v-model.number="tts.rate"
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          class="cursor-pointer accent-disco-500"
        />
        <span class="w-10 text-right text-sm text-night-400 tabular-nums"
          >{{ tts.rate.toFixed(1) }}×</span
        >
      </SettingsRow>

      <p v-if="!engine.available.value" class="text-sm text-warn-500">
        No speech voices found on this device. Voices are per-device; on a Raspberry Pi, install
        espeak / speech-dispatcher so Chromium can speak.
      </p>
    </div>
  </section>
</template>
