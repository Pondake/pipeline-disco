<template>
  <div class="bg-night-950 fixed inset-0 z-50 flex flex-col items-center justify-center gap-8">
    <p class="text-night-400 text-lg">Pipeline Disco needs one click to unlock the speakers.</p>
    <app-button
      variant="primary"
      class="px-10 py-5 text-2xl hover:scale-105 active:scale-95"
      @click="onArm"
    >
      Start the disco
    </app-button>
    <p class="text-night-600 max-w-md text-center text-sm">
      Running a kiosk? Launch Chromium with
      <code class="bg-night-900 text-night-400 rounded px-1.5 py-0.5"
        >--autoplay-policy=no-user-gesture-required</code
      >
      and this screen skips itself.
    </p>
  </div>
</template>

<script setup lang="ts">
const { arm, playSound } = useAudio()

// Arming flips the shared `armed` state, which unmounts this overlay.
async function onArm() {
  const ok = await arm()
  if (ok) playSound('synth:chime', 0.6)
}
</script>
