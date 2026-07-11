<script setup lang="ts">
import type { StatusResponse } from '#shared/types'

const props = defineProps<{ store: StatusResponse['store'] | null }>()

const meta = computed(() => {
  switch (props.store) {
    case 'upstash':
      return { label: 'redis', dotClass: 'bg-go-500' }
    case 'memory':
      return { label: 'in-memory', dotClass: 'bg-warn-500' }
    default:
      return { label: 'checking…', dotClass: 'bg-night-600' }
  }
})
</script>

<template>
  <StatusIndicator :label="meta.label" :dot-class="meta.dotClass" />
</template>
