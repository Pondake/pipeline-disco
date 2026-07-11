<script setup lang="ts">
/** Generic pill/chip shape. Color/text-size are supplied by the caller via
 * passthrough class so this stays reusable for repo chips, the demo tag, and
 * the project chip on the event flood. */
withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), { size: 'sm' })

const sizeClass = { sm: 'px-1.5 py-0.5', md: 'px-2 py-0.5', lg: 'px-3 py-1' } as const
</script>

<template>
  <span
    class="inline-flex max-w-full items-center gap-1.5 truncate rounded-md align-middle font-semibold"
    :class="sizeClass[size]"
  >
    <slot />
  </span>
</template>
