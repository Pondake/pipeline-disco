<script setup lang="ts">
import type { StatusResponse } from '#shared/types'

const props = defineProps<{ store: StatusResponse['store'] | null }>()

const meta = computed(() => {
  switch (props.store) {
    case 'upstash':
      return { label: 'redis', dot: 'bg-go-500' }
    case 'memory':
      return { label: 'in-memory (events won\'t persist)', dot: 'bg-warn-500' }
    default:
      return { label: 'checking…', dot: 'bg-night-600' }
  }
})
</script>

<template>
  <span class="flex items-center gap-2 text-sm text-night-400" :title="meta.label">
    <span class="size-2 rounded-full" :class="meta.dot" aria-hidden="true" />
    {{ meta.label }}
  </span>
</template>
