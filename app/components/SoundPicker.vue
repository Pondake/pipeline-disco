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

<template>
  <button
    type="button"
    v-bind="$attrs"
    class="flex w-full cursor-pointer items-center gap-2 rounded-md border border-night-800 bg-night-900 px-3 py-2 text-left text-night-50 transition-colors duration-150 hover:border-night-600"
    :aria-label="`${label}: ${current?.label}. Choose a sound.`"
    @click="openPicker"
  >
    <Icon :name="soundIcon(modelValue)" class="size-5 shrink-0 text-night-400" />
    <span class="flex-1 truncate">{{ current?.label }}</span>
    <Icon name="tabler:chevron-down" class="size-4 shrink-0 text-night-600" />
  </button>

  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-night-950/70 p-6"
        @click.self="cancel"
        @keydown.esc="cancel"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          class="flex max-h-[80vh] w-full max-w-xl flex-col rounded-md border border-night-800 bg-night-900"
          @keydown.esc="cancel"
        >
          <header class="flex shrink-0 items-center justify-between border-b border-night-800 px-5 py-4">
            <h2 :id="titleId" class="text-lg font-bold text-night-50">Choose a sound — {{ label }}</h2>
            <button
              type="button"
              class="cursor-pointer rounded-md p-1 text-night-400 transition-colors duration-150 hover:text-night-50"
              aria-label="Close"
              @click="cancel"
            >
              <Icon name="tabler:x" class="size-5" />
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
              <Icon :name="soundIcon(s.id)" class="size-6" />
              <span class="line-clamp-2 text-xs leading-tight">{{ s.label }}</span>
            </button>
          </div>

          <footer class="flex shrink-0 items-center justify-between gap-4 border-t border-night-800 px-5 py-4">
            <span class="truncate text-sm text-night-400">
              {{ draftSound ? `Selected: ${draftSound.label}` : 'Nothing selected' }}
            </span>
            <span class="flex shrink-0 gap-2">
              <AppButton class="px-4 py-2 text-sm" @click="cancel">Cancel</AppButton>
              <AppButton variant="primary" class="px-4 py-2 text-sm" @click="apply">Apply</AppButton>
            </span>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
