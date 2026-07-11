<script setup lang="ts">
import type { DiscoEvent } from '#shared/types'

defineProps<{ events: DiscoEvent[] }>()
const emit = defineEmits<{ deleted: [id: number] }>()

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
      <div class="feed-row items-baseline gap-x-4 gap-y-1 text-base sm:text-lg">
        <span class="feed-row-time text-night-600 tabular-nums">{{ formatEventTime(e.ts) }}</span>
        <span
          class="feed-row-status font-bold uppercase tracking-wide"
          :class="pipelineStatusTextClass(e.status)"
          ><StatusDot
            v-if="e.status === 'pending'"
            size="sm"
            pulse
            class="mr-2 bg-current align-[0.15em]"
          />{{ pipelineStatusWord(e.status) }}</span
        >
        <span class="feed-row-title flex min-w-0 flex-wrap items-baseline gap-2.5">
          <RepoBadge :project-path="e.projectPath || e.project" :project="e.project" />
          <span class="truncate text-night-50">{{ e.mrTitle || e.branch }}</span>
          <PipelineStages v-if="e.jobs?.length" :jobs="e.jobs" :stages="e.stages" />
          <AppBadge
            v-if="e.demo"
            size="sm"
            class="shrink-0 bg-night-800 text-xs uppercase text-night-400"
          >
            demo
          </AppBadge>
        </span>
        <span class="feed-row-author truncate text-night-600">{{ e.author }}</span>
      </div>

      <!-- Fade masks the author column so the delete button never collides
           with it; sits above the row content, below the button itself. -->
      <div
        class="pointer-events-none absolute inset-y-0 right-0 w-36 bg-gradient-to-l from-night-950 from-35% to-transparent opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        aria-hidden="true"
      />
      <AppButton
        variant="danger"
        class="absolute right-0 top-1/2 -translate-y-1/2 px-2.5 py-1 text-sm opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100"
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
      </AppButton>

      <!-- Always-on sub-row for failed pipelines with hard job failures: a
           ledger sub-line, not a card/modal, no interaction required (this
           board typically runs on a kiosk with no mouse/touch). -->
      <div
        v-if="e.status === 'failed' && failedJobs(e).length"
        class="mt-1.5 flex flex-wrap text-sm text-night-400 sm:pl-[11rem] sm:text-base"
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
/* Below sm, the time/status/title/author row has nowhere to put a fixed
   4-column grid — it stacks into two lines instead of squeezing columns
   until they overlap. */
.feed-row {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'status time'
    'title title'
    'author author';
}

.feed-row-time {
  grid-area: time;
  justify-self: end;
}
.feed-row-status {
  grid-area: status;
}
.feed-row-title {
  grid-area: title;
}
.feed-row-author {
  grid-area: author;
}

@media (min-width: 640px) {
  .feed-row {
    grid-template-columns: 4rem 7rem 1fr auto;
    grid-template-areas: 'time status title author';
  }

  .feed-row-time {
    justify-self: start;
  }
}
</style>
