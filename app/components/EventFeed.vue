<script setup lang="ts">
import type { DiscoEvent } from '#shared/types'

defineProps<{ events: DiscoEvent[] }>()
const emit = defineEmits<{ deleted: [id: number] }>()

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
})

const deleting = ref<number | null>(null)

async function removeEvent(e: DiscoEvent) {
  if (deleting.value !== null) return
  if (!confirm('Delete this event?')) return
  emit('deleted', e.id)
  if (e.demo) return // demo events only ever exist client-side
  deleting.value = e.id
  try {
    await $fetch(`/api/events/${e.id}`, { method: 'DELETE' })
  } finally {
    deleting.value = null
  }
}

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

function failedJobs(e: DiscoEvent) {
  return (e.jobs ?? []).filter((j) => j.status === 'failed')
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
      class="group relative border-b border-night-900 py-2.5"
    >
      <div class="grid grid-cols-[4rem_7rem_1fr_auto] items-baseline gap-x-4 text-lg">
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
          <PipelineStages v-if="e.jobs?.length" :jobs="e.jobs" :stages="e.stages" />
          <span
            v-if="e.demo"
            class="shrink-0 rounded bg-night-800 px-1.5 py-0.5 text-xs font-semibold uppercase text-night-400"
            >demo</span
          >
        </span>
        <span class="text-night-600">{{ e.author }}</span>
      </div>

      <!-- Fade masks the author column so the delete button never collides
           with it; sits above the row content, below the button itself. -->
      <div
        class="pointer-events-none absolute inset-y-0 right-0 w-36 bg-gradient-to-l from-night-950 from-35% to-transparent opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        aria-hidden="true"
      />
      <button
        type="button"
        class="delete-btn absolute right-0 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-30"
        :disabled="deleting === e.id"
        :aria-label="`Delete event: ${e.mrTitle || e.branch}`"
        title="Delete"
        @click="removeEvent(e)"
      >
        <svg viewBox="0 0 20 20" fill="none" class="size-4" aria-hidden="true">
          <path
            d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m-6.5 0 .6 9.3A1.5 1.5 0 0 0 7.6 17h4.8a1.5 1.5 0 0 0 1.5-1.7l.6-9.3"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Delete
      </button>

      <!-- Always-on sub-row for failed pipelines with hard job failures: a
           ledger sub-line, not a card/modal, no interaction required (this
           board typically runs on a kiosk with no mouse/touch). -->
      <div
        v-if="e.status === 'failed' && failedJobs(e).length"
        class="mt-1.5 pl-[11rem] text-base text-night-400"
      >
        <span class="text-stop-500">failed:</span>
        <span
          v-for="job in failedJobs(e)"
          :key="job.name"
          class="ml-2"
          :class="job.allowFailure ? 'text-warn-500' : 'text-night-200'"
        >
          {{ job.name }}{{ job.allowFailure ? ' (allowed)' : '' }}
        </span>
      </div>
    </li>
  </TransitionGroup>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.delete-btn {
  @apply flex items-center gap-1.5 rounded-md border border-night-800 bg-night-900 px-2.5 py-1 text-sm text-night-200 transition-colors duration-150 hover:border-stop-500 hover:text-stop-500;
}
</style>
