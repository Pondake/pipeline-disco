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
  <AppBadge
    :size="size === 'lg' ? 'lg' : 'md'"
    class="max-w-[16ch] border"
    :class="size === 'lg' ? 'text-xl' : 'text-sm'"
    :style="style"
    :title="projectPath"
  >
    {{ label }}
  </AppBadge>
</template>
