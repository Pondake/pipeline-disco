<script setup lang="ts">
defineProps<{
  label: string
  hint?: string
  placeholder?: string
}>()

const tags = defineModel<string[]>({ required: true })
const draft = ref('')
const inputId = useId()

function add() {
  const value = draft.value.trim()
  if (!value || tags.value.includes(value)) return
  tags.value = [...tags.value, value]
  draft.value = ''
}

function remove(tag: string) {
  tags.value = tags.value.filter((t) => t !== tag)
}
</script>

<template>
  <div>
    <label :for="inputId" class="block text-sm font-semibold text-night-200">{{ label }}</label>
    <p v-if="hint" class="mt-0.5 text-sm text-night-600">{{ hint }}</p>
    <div class="mt-2 flex gap-2">
      <input
        :id="inputId"
        v-model="draft"
        type="text"
        :placeholder="placeholder"
        class="flex-1 rounded-md border border-night-800 bg-night-900 px-3 py-2 text-night-50 placeholder:text-night-600"
        @keydown.enter.prevent="add"
      />
      <AppButton class="px-4 text-sm font-semibold" @click="add"> Add </AppButton>
    </div>
    <ul v-if="tags.length" class="mt-3 flex flex-wrap gap-2">
      <li
        v-for="tag in tags"
        :key="tag"
        class="flex items-center gap-1.5 rounded-md bg-night-800 py-1 pr-1.5 pl-2.5 text-sm text-night-200"
      >
        {{ tag }}
        <button
          type="button"
          class="cursor-pointer rounded px-1 text-night-400 transition-colors duration-150 hover:text-stop-500"
          :aria-label="`Remove ${tag}`"
          @click="remove(tag)"
        >
          ×
        </button>
      </li>
    </ul>
  </div>
</template>
