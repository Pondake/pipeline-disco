import type { Ref } from 'vue'

/** A value that clears itself after `ms`; each `show()` resets the timer.
 * Used for transient UI (event flood, save toast) that should vanish on its
 * own without every caller re-implementing the ref+setTimeout dance. */
export function useAutoDismiss<T>(ms: number) {
  const value = ref<T | null>(null) as Ref<T | null>
  let timer: ReturnType<typeof setTimeout> | null = null

  function clear() {
    if (timer) clearTimeout(timer)
    timer = null
  }

  function show(next: T) {
    value.value = next
    clear()
    timer = setTimeout(() => (value.value = null), ms)
  }

  onUnmounted(clear)

  return { value, show, clear }
}
