<script setup lang="ts">
import type { DiscoJob } from '#shared/types'

const props = defineProps<{ jobs: DiscoJob[]; stages?: string[] }>()

const groups = computed(() => {
  const order = props.stages?.length ? props.stages : [...new Set(props.jobs.map((j) => j.stage))]
  return order
    .map((stage) => ({ stage, jobs: props.jobs.filter((j) => j.stage === stage) }))
    .filter((g) => g.jobs.length > 0)
})

function dotClass(job: DiscoJob) {
  if (job.status === 'failed') return job.allowFailure ? 'bg-warn-500' : 'bg-stop-500'
  if (job.status === 'success') return 'bg-go-500'
  if (job.status === 'canceled') return 'bg-warn-500'
  if (job.status === 'running') return 'bg-night-400 animate-pulse-dot'
  if (job.status === 'skipped') return 'bg-night-800'
  return 'bg-night-600' // pending
}
</script>

<template>
  <span class="inline-flex items-center gap-[3px] align-middle" aria-hidden="true">
    <template v-for="(group, gi) in groups" :key="group.stage">
      <span class="text-night-800 select-none">(</span>
      <span
        v-for="job in group.jobs"
        :key="job.name"
        class="inline-block size-[5px] rounded-full"
        :class="dotClass(job)"
      />
      <span class="text-night-800 select-none">)</span>
      <span v-if="gi < groups.length - 1" class="text-night-800 select-none">-</span>
    </template>
  </span>
</template>
