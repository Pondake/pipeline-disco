<template>
  <label class="flex items-center gap-3">
    <input v-model="model" type="checkbox" class="checkbox" />
    <span v-if="description">
      <span class="block font-semibold text-night-200">{{ label }}</span>
      <span class="block text-sm text-night-400">{{ description }}</span>
    </span>
    <span v-else class="font-semibold text-night-200">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
defineProps<{ label: string; description?: string }>()
</script>

<style scoped>
@reference "~/assets/css/main.css";

.checkbox {
  @apply size-4 cursor-pointer accent-disco-500;
}
</style>
