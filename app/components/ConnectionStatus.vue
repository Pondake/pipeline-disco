<script setup lang="ts">
import type { ConnectionState } from '~/composables/useEventPoller'

const props = defineProps<{ state: ConnectionState }>()

const meta = computed(() => {
  switch (props.state) {
    case 'ok':
      return { label: 'listening', dotClass: 'bg-go-500' }
    case 'degraded':
      return { label: 'reconnecting', dotClass: 'bg-warn-500' }
    default:
      return { label: 'offline', dotClass: 'bg-stop-500' }
  }
})
</script>

<template>
  <StatusIndicator :label="meta.label" :dot-class="meta.dotClass" />
</template>
