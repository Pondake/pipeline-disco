<script setup lang="ts">
/** Dot + label pairing used for connection/backend status chips. Color comes
 * in as a `bg-*` class via `dotClass` so this stays agnostic of any one
 * status vocabulary (connection state, store backend, pipeline status, ...). */
defineProps<{
  label: string
  dotClass: string
  pulse?: boolean
}>()
</script>

<template>
  <span class="flex items-center gap-2 text-sm text-night-400" :title="label">
    <StatusDot size="md" :pulse="pulse" :class="dotClass" />
    {{ label }}
  </span>
</template>
