<script setup lang="ts">
/** Collapses a row of toolbar actions into a single trigger below the width
 * where they'd otherwise wrap into a cramped multi-row grid (see footer in
 * index.vue). Native popover API: light-dismiss and top-layer stacking for
 * free, no portal/z-index bookkeeping. */
const menuId = `actions-menu-${useId()}`
const panel = ref<HTMLElement | null>(null)

function closeMenu() {
  panel.value?.hidePopover()
}
</script>

<template>
  <div class="actions-menu">
    <AppButton
      class="px-3 py-1.5 text-sm"
      type="button"
      :popovertarget="menuId"
      popovertargetaction="toggle"
      aria-haspopup="true"
      :aria-controls="menuId"
    >
      <slot name="trigger">
        <svg viewBox="0 0 20 20" fill="currentColor" class="size-4" aria-hidden="true">
          <circle cx="4" cy="10" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
        </svg>
        Menu
      </slot>
    </AppButton>
    <div :id="menuId" ref="panel" popover class="actions-menu-panel" @click="closeMenu">
      <slot />
    </div>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.actions-menu {
  position: relative;
}

.actions-menu-panel {
  @apply m-0 w-56 gap-1 rounded-md border border-night-800 bg-night-900 p-2;
  position: fixed;
  inset: auto 1rem 4.75rem auto;
  overflow: visible;
}

/* The popover UA stylesheet only sets `display: none` on the closed state,
   not `!important` — an unconditional `display: flex` above would win the
   cascade and leave the menu visible even when closed. Gating display (and
   the animation) behind `:popover-open` keeps the closed state truly hidden. */
.actions-menu-panel:popover-open {
  @apply flex flex-col;
  animation: actions-menu-in 150ms var(--ease-out-quint);
}

@keyframes actions-menu-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .actions-menu-panel:popover-open {
    animation: none;
  }
}
</style>
