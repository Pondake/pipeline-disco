<template>
  <label class="flex items-center gap-3">
    <input v-model="model" type="checkbox" class="checkbox" />
    <span v-if="description">
      <span class="text-night-200 block font-semibold">{{ label }}</span>
      <span class="text-night-400 block text-sm">{{ description }}</span>
    </span>
    <span v-else class="text-night-200 font-semibold">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
defineProps<{ label: string; description?: string }>()
</script>

<style scoped>
@reference "~/assets/css/main.css";

.checkbox {
  @apply accent-disco-500 size-4 cursor-pointer;
}
</style>
