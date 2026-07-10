<script setup lang="ts">
const props = defineProps<{
  projectPath: string
  /** Short display name; falls back to the last path segment. */
  project?: string
  size?: 'sm' | 'lg'
}>()

const label = computed(
  () => props.project || props.projectPath.split('/').pop() || props.projectPath,
)
const style = computed(() => repoChipStyle(props.projectPath))
</script>

<template>
  <span
    class="inline-block max-w-[16ch] truncate rounded-md border align-middle font-semibold"
    :class="size === 'lg' ? 'px-3 py-1 text-xl' : 'px-2 py-0.5 text-sm'"
    :style="style"
    :title="projectPath"
  >
    {{ label }}
  </span>
</template>
