<script setup lang="ts">
import type { DiscoEvent } from '#shared/types'

defineProps<{ events: DiscoEvent[] }>()

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
})

function statusWord(e: DiscoEvent) {
  return e.status === 'success'
    ? 'passed'
    : e.status === 'failed'
      ? 'failed'
      : e.status === 'pending'
        ? 'running'
        : 'canceled'
}

function statusColor(e: DiscoEvent) {
  return e.status === 'success'
    ? 'text-go-500'
    : e.status === 'failed'
      ? 'text-stop-500'
      : e.status === 'pending'
        ? 'text-night-600'
        : 'text-warn-500'
}
</script>

<template>
  <TransitionGroup
    tag="ol"
    class="flex flex-col-reverse"
    enter-active-class="transition duration-200 [transition-timing-function:var(--ease-out-quint)]"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
  >
    <li
      v-for="e in events"
      :key="`${e.demo ? 'd' : 's'}${e.id}`"
      class="grid grid-cols-[4rem_7rem_1fr_auto] items-baseline gap-x-4 border-b border-night-900 py-2.5 text-lg"
    >
      <span class="text-night-600 tabular-nums">{{ timeFormat.format(e.ts) }}</span>
      <span class="font-bold uppercase tracking-wide" :class="statusColor(e)"
        ><span
          v-if="e.status === 'pending'"
          class="mr-2 inline-block size-1.5 animate-pulse-dot rounded-full bg-current align-[0.15em]"
          aria-hidden="true"
        />{{ statusWord(e) }}</span
      >
      <span class="flex min-w-0 items-baseline gap-2.5">
        <RepoBadge :project-path="e.projectPath || e.project" :project="e.project" />
        <span class="truncate text-night-50">{{ e.mrTitle || e.branch }}</span>
        <span
          v-if="e.demo"
          class="shrink-0 rounded bg-night-800 px-1.5 py-0.5 text-xs font-semibold uppercase text-night-400"
          >demo</span
        >
      </span>
      <span class="text-night-600">{{ e.author }}</span>
    </li>
  </TransitionGroup>
</template>
