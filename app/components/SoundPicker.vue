<template>
  <button
    type="button"
    v-bind="$attrs"
    class="border-night-800 bg-night-900 text-night-50 hover:border-night-600 flex w-full cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors duration-150"
    :aria-label="`${label}: ${current?.label}. Choose a sound.`"
    @click="openPicker"
  >
    <icon :name="soundIcon(modelValue)" class="text-night-400 size-5 shrink-0" />
    <span class="flex-1 truncate">{{ current?.label }}</span>
    <icon name="tabler:chevron-down" class="text-night-600 size-4 shrink-0" />
  </button>

  <teleport to="body">
    <transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="bg-night-950/70 fixed inset-0 z-50 flex items-center justify-center p-6"
        @click.self="cancel"
        @keydown.esc="cancel"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          class="border-night-800 bg-night-900 flex max-h-[80vh] w-full max-w-xl flex-col rounded-md border"
          @keydown.esc="cancel"
        >
          <header
            class="border-night-800 flex shrink-0 items-center justify-between border-b px-5 py-4"
          >
            <h2 :id="titleId" class="text-night-50 text-lg font-bold">
              Choose a sound — {{ label }}
            </h2>
            <button
              type="button"
              class="text-night-400 hover:text-night-50 cursor-pointer rounded-md p-1 transition-colors duration-150"
              aria-label="Close"
              @click="cancel"
            >
              <icon name="tabler:x" class="size-5" />
            </button>
          </header>

          <div class="grid grow grid-cols-3 gap-3 overflow-y-auto p-5 sm:grid-cols-4">
            <button
              v-for="s in sounds"
              :key="s.id"
              type="button"
              class="flex cursor-pointer flex-col items-center gap-2 rounded-md border px-2 py-3 text-center transition-colors duration-150"
              :class="
                draft === s.id
                  ? 'border-disco-500 bg-night-800 text-disco-300'
                  : 'border-night-800 bg-night-950/40 text-night-200 hover:border-night-600'
              "
              @click="pick(s.id)"
            >
              <icon :name="soundIcon(s.id)" class="size-6" />
              <span class="line-clamp-2 text-xs leading-tight">{{ s.label }}</span>
            </button>
          </div>

          <footer
            class="border-night-800 flex shrink-0 items-center justify-between gap-4 border-t px-5 py-4"
          >
            <span class="text-night-400 truncate text-sm">
              {{ draftSound ? `Selected: ${draftSound.label}` : 'Nothing selected' }}
            </span>
            <span class="flex shrink-0 gap-2">
              <app-button class="px-4 py-2 text-sm" @click="cancel">Cancel</app-button>
              <app-button variant="primary" class="px-4 py-2 text-sm" @click="apply"
                >Apply</app-button
              >
            </span>
          </footer>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  sounds: Array<{ id: string; label: string }>
  volume: number
  /** Used for the dialog heading and the trigger's accessible name. */
  label: string
}>()
const emit = defineEmits<{ 'update:modelValue': [id: string] }>()

const { playSound } = useAudio()

const open = ref(false)
const draft = ref(props.modelValue)
const titleId = useId()

const current = computed(
  () => props.sounds.find((s) => s.id === props.modelValue) ?? props.sounds[0],
)
const draftSound = computed(() => props.sounds.find((s) => s.id === draft.value))

function openPicker() {
  draft.value = props.modelValue
  open.value = true
}

function pick(id: string) {
  draft.value = id
  playSound(id, props.volume)
}

function apply() {
  emit('update:modelValue', draft.value)
  open.value = false
}

function cancel() {
  open.value = false
}
</script>
