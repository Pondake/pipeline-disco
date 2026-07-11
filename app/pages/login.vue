<script setup lang="ts">
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { password: password.value } })
    // Full reload so the fresh cookie applies everywhere.
    window.location.href = '/'
  } catch {
    error.value = 'That password does not get you into the disco.'
    busy.value = false
  }
}
</script>

<template>
  <main class="flex h-dvh items-center justify-center px-6">
    <form class="w-full max-w-sm" @submit.prevent="submit">
      <h1 class="text-3xl font-extrabold text-night-50">Pipeline Disco</h1>
      <p class="mt-2 text-night-400">Passing pipelines, out loud.</p>

      <label for="password" class="mt-10 block text-sm font-semibold text-night-200">
        Password
      </label>
      <input
        id="password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        autofocus
        required
        class="mt-2 w-full rounded-md border border-night-800 bg-night-900 px-3 py-2.5 text-night-50 placeholder:text-night-600"
        placeholder="••••••••"
      />
      <p v-if="error" class="mt-2 text-sm text-stop-500" role="alert">{{ error }}</p>

      <AppButton type="submit" variant="primary" class="mt-6 w-full px-4 py-2.5" :disabled="busy">
        {{ busy ? 'Checking…' : 'Enter' }}
      </AppButton>
    </form>
  </main>
</template>
