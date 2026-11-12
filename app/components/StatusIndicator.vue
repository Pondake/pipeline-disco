<template>
  <span class="text-night-400 flex items-center gap-2 text-sm" :title="label">
    <status-dot size="md" :pulse="pulse" :class="dotClass" />
    {{ label }}
  </span>
</template>

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
