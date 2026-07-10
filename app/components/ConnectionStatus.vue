<script setup lang="ts">
import type { ConnectionState } from '~/composables/useEventPoller'

const props = defineProps<{ state: ConnectionState }>()

const meta = computed(() => {
  switch (props.state) {
    case 'ok':
      return { label: 'listening', dot: 'bg-go-500' }
    case 'degraded':
      return { label: 'reconnecting', dot: 'bg-warn-500' }
    default:
      return { label: 'offline', dot: 'bg-stop-500' }
  }
})
</script>

<template>
  <span class="flex items-center gap-2 text-sm text-night-400">
    <span class="size-2 rounded-full" :class="meta.dot" aria-hidden="true" />
    {{ meta.label }}
  </span>
</template>
