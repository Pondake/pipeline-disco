<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'xs' | 'sm' | 'md' | 'lg'
    pulse?: boolean
  }>(),
  { size: 'sm', pulse: false },
)

const sizeClass = { xs: 'size-[5px]', sm: 'size-1.5', md: 'size-2', lg: 'size-2.5' } as const
</script>

<template>
  <span
    class="inline-block shrink-0 rounded-full"
    :class="[sizeClass[size], { 'animate-pulse-dot': pulse }]"
    aria-hidden="true"
  />
</template>
