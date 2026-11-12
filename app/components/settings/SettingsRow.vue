<template>
  <div class="grid grid-cols-[6rem_1fr_auto] items-center gap-3">
    <label :for="inputId" class="text-night-200 text-sm font-semibold">{{ label }}</label>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; inputId?: string }>()
</script>
