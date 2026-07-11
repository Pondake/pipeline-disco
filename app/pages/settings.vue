<script setup lang="ts">
import type { Settings } from '#shared/types'
import { defaultSettings } from '#shared/utils/defaults'

const { save, saving } = useSettings()

// Edit a local draft; nothing applies until Save.
const draft = ref<Settings>(defaultSettings())
const loaded = ref(false)
const { value: toast, show: showToastValue } = useAutoDismiss<{ kind: 'ok' | 'error'; text: string }>(
  3500,
)

onMounted(async () => {
  draft.value = await $fetch<Settings>('/api/settings')
  loaded.value = true
})

function showToast(kind: 'ok' | 'error', text: string) {
  showToastValue({ kind, text })
}

async function submit() {
  try {
    await save(draft.value)
    showToast('ok', 'Settings saved. Every device picks them up on its next poll.')
  } catch {
    showToast('error', 'Saving failed. Check the connection and try again.')
  }
}
</script>

<template>
  <main class="mx-auto max-w-2xl px-6 py-12">
    <header class="flex items-baseline justify-between">
      <h1 class="text-3xl font-extrabold text-night-50">Settings</h1>
      <NuxtLink to="/" class="text-sm text-disco-300 hover:underline">Back to the board</NuxtLink>
    </header>
    <p class="mt-2 text-night-400">
      Shared across every device: the wallboard, your laptop, all of it.
    </p>

    <form v-if="loaded" class="mt-12 flex flex-col gap-14" @submit.prevent="submit">
      <SettingsIgnoreRulesSection v-model="draft.ignore" />
      <SettingsSoundSection v-model="draft.sound" />
      <SettingsTtsSection v-model="draft.tts" />

      <section>
        <h2 class="text-xl font-bold text-night-50">Polling</h2>
        <p class="mt-1 text-sm text-night-400">
          How often open tabs check for new events. Slower polling saves Upstash free-tier quota.
        </p>
        <div class="mt-6 grid grid-cols-2 gap-4">
          <div>
            <label for="activeMs" class="block text-sm font-semibold text-night-200">
              Active interval (ms)
            </label>
            <p class="mt-0.5 text-sm text-night-600">Used for 10 min after an event.</p>
            <input
              id="activeMs"
              v-model.number="draft.polling.activeMs"
              type="number"
              min="2000"
              max="60000"
              step="500"
              class="mt-2 w-full rounded-md border border-night-800 bg-night-900 px-3 py-2 text-night-50"
            />
          </div>
          <div>
            <label for="idleMs" class="block text-sm font-semibold text-night-200">
              Idle interval (ms)
            </label>
            <p class="mt-0.5 text-sm text-night-600">Used when things are quiet.</p>
            <input
              id="idleMs"
              v-model.number="draft.polling.idleMs"
              type="number"
              min="5000"
              max="120000"
              step="1000"
              class="mt-2 w-full rounded-md border border-night-800 bg-night-900 px-3 py-2 text-night-50"
            />
          </div>
        </div>
      </section>

      <div class="flex items-center gap-4 border-t border-night-900 pt-6">
        <AppButton type="submit" variant="primary" class="px-6 py-2.5" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save settings' }}
        </AppButton>
        <p
          v-if="toast"
          role="status"
          class="text-sm"
          :class="toast.kind === 'ok' ? 'text-go-500' : 'text-stop-500'"
        >
          {{ toast.text }}
        </p>
      </div>
    </form>
    <p v-else class="mt-12 text-night-400">Loading settings…</p>
  </main>
</template>
