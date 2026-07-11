<script setup lang="ts">
const { arm, playSound } = useAudio()

// Arming flips the shared `armed` state, which unmounts this overlay.
async function onArm() {
  const ok = await arm()
  if (ok) playSound('synth:chime', 0.6)
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-night-950">
    <p class="text-lg text-night-400">Pipeline Disco needs one click to unlock the speakers.</p>
    <AppButton
      variant="primary"
      class="px-10 py-5 text-2xl hover:scale-105 active:scale-95"
      @click="onArm"
    >
      Start the disco
    </AppButton>
    <p class="max-w-md text-center text-sm text-night-600">
      Running a kiosk? Launch Chromium with
      <code class="rounded bg-night-900 px-1.5 py-0.5 text-night-400"
        >--autoplay-policy=no-user-gesture-required</code
      >
      and this screen skips itself.
    </p>
  </div>
</template>
