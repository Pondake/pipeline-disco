<script setup lang="ts">
import type { DiscoJob } from '#shared/types'

const props = defineProps<{ jobs: DiscoJob[]; stages?: string[] }>()

const groups = computed(() => {
  const order = props.stages?.length ? props.stages : [...new Set(props.jobs.map((j) => j.stage))]
  return order
    .map((stage) => ({ stage, jobs: props.jobs.filter((j) => j.stage === stage) }))
    .filter((g) => g.jobs.length > 0)
})
</script>

<template>
  <span class="inline-flex items-center gap-[3px] align-middle" aria-hidden="true">
    <template v-for="(group, gi) in groups" :key="group.stage">
      <span class="text-night-800 select-none">(</span>
      <StatusDot
        v-for="job in group.jobs"
        :key="job.name"
        size="xs"
        :pulse="job.status === 'running'"
        :class="jobDotClass(job)"
      />
      <span class="text-night-800 select-none">)</span>
      <span v-if="gi < groups.length - 1" class="text-night-800 select-none">-</span>
    </template>
  </span>
</template>
