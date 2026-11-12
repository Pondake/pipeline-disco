<template>
  <div>
    <label :for="inputId" class="text-night-200 block text-sm font-semibold">{{ label }}</label>
    <p v-if="hint" class="text-night-600 mt-0.5 text-sm">{{ hint }}</p>
    <div class="mt-2 flex gap-2">
      <input
        :id="inputId"
        v-model="draft"
        type="text"
        :placeholder="placeholder"
        class="border-night-800 bg-night-900 text-night-50 placeholder:text-night-600 flex-1 rounded-md border px-3 py-2"
        @keydown.enter.prevent="add"
      />
      <app-button class="px-4 text-sm font-semibold" @click="add"> Add </app-button>
    </div>
    <ul v-if="tags.length" class="mt-3 flex flex-wrap gap-2">
      <li
        v-for="tag in tags"
        :key="tag"
        class="bg-night-800 text-night-200 flex items-center gap-1.5 rounded-md py-1 pr-1.5 pl-2.5 text-sm"
      >
        {{ tag }}
        <button
          type="button"
          class="text-night-400 hover:text-stop-500 cursor-pointer rounded px-1 transition-colors duration-150"
          :aria-label="`Remove ${tag}`"
          @click="remove(tag)"
        >
          ×
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const tags = defineModel<string[]>({ required: true })

defineProps<{
  label: string
  hint?: string
  placeholder?: string
}>()

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
