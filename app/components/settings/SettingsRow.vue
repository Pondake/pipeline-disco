<script setup lang="ts">
defineProps<{ label: string; inputId?: string }>()
</script>

<template>
  <div class="grid grid-cols-[6rem_1fr_auto] items-center gap-3">
    <label :for="inputId" class="text-sm font-semibold text-night-200">{{ label }}</label>
    <slot />
  </div>
</template>
