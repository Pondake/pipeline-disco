<script setup lang="ts">
import type { IgnoreSettings } from '#shared/types'

const ignore = defineModel<IgnoreSettings>({ required: true })
</script>

<template>
  <section>
    <h2 class="text-xl font-bold text-night-50">Ignore rules</h2>
    <p class="mt-1 text-sm text-night-400">
      Matching pipelines are dropped at ingest: no sound, no feed entry.
    </p>

    <div class="mt-6 flex flex-col gap-6">
      <TagListInput
        v-model="ignore.projects"
        label="Projects"
        hint="Project path (group/repo), name, or numeric id."
        placeholder="group/sandbox"
      />
      <TagListInput
        v-model="ignore.branchPatterns"
        label="Branch patterns"
        hint="Glob patterns matched against the branch name. * matches anything."
        placeholder="renovate/*"
      />
      <TagListInput
        v-model="ignore.titlePatterns"
        label="MR title patterns"
        hint="Glob patterns matched against the merge request title."
        placeholder="Draft:*"
      />

      <label class="flex items-center gap-3">
        <input v-model="ignore.onlyMrPipelines" type="checkbox" class="checkbox" />
        <span>
          <span class="block font-semibold text-night-200">Merge request pipelines only</span>
          <span class="block text-sm text-night-400"
            >Ignore push, schedule, and manual pipelines.</span
          >
        </span>
      </label>

      <label class="flex items-center gap-3">
        <input v-model="ignore.reactToCanceled" type="checkbox" class="checkbox" />
        <span>
          <span class="block font-semibold text-night-200">Announce canceled pipelines</span>
          <span class="block text-sm text-night-400"
            >Off by default; cancels are usually noise.</span
          >
        </span>
      </label>
    </div>
  </section>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.checkbox {
  @apply size-4 accent-disco-500;
}
</style>
