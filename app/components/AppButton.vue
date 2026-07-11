<script setup lang="ts">
/** One button shape everywhere (DESIGN.md: rounded-md, night-900 ground,
 * night-800 border, disco-500 for primary). Padding/text-size stay on the
 * caller via passthrough class; this component owns color, cursor, and
 * disabled/hover/focus behavior. */
withDefaults(
  defineProps<{
    variant?: 'default' | 'primary' | 'danger'
    active?: boolean
    to?: string
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  { variant: 'default', type: 'button', to: undefined },
)

const variantClass = {
  default: 'border border-night-800 bg-night-900 text-night-200 hover:border-night-600',
  danger: 'border border-night-800 bg-night-900 text-night-200 hover:border-stop-500 hover:text-stop-500',
  primary: 'bg-disco-500 font-bold text-night-950 hover:opacity-90',
} as const
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="app-btn"
    :class="[variantClass[variant], { 'app-btn-active': active }]"
  >
    <slot />
  </NuxtLink>
  <button
    v-else
    :type="type"
    :disabled="disabled"
    :aria-pressed="active"
    class="app-btn"
    :class="[variantClass[variant], { 'app-btn-active': active }]"
  >
    <slot />
  </button>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.app-btn {
  @apply inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md transition duration-150 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50;
}
.app-btn-active {
  @apply border-disco-500 text-disco-300;
}
</style>
