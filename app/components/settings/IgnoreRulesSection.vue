<template>
  <section>
    <h2 class="text-night-50 text-xl font-bold">Ignore rules</h2>
    <p class="text-night-400 mt-1 text-sm">
      Matching pipelines are dropped at ingest: no sound, no feed entry.
    </p>

    <div class="mt-6 flex flex-col gap-6">
      <tag-list-input
        v-model="ignore.projects"
        label="Projects"
        hint="Project path (group/repo), name, or numeric id."
        placeholder="group/sandbox"
      />
      <tag-list-input
        v-model="ignore.branchPatterns"
        label="Branch patterns"
        hint="Glob patterns matched against the branch name. * matches anything."
        placeholder="renovate/*"
      />
      <tag-list-input
        v-model="ignore.titlePatterns"
        label="MR title patterns"
        hint="Glob patterns matched against the merge request title."
        placeholder="Draft:*"
      />

      <checkbox-field
        v-model="ignore.onlyMrPipelines"
        label="Merge request pipelines only"
        description="Ignore push, schedule, and manual pipelines."
      />

      <checkbox-field
        v-model="ignore.reactToCanceled"
        label="Announce canceled pipelines"
        description="Off by default; cancels are usually noise."
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { IgnoreSettings } from '#shared/types'

const ignore = defineModel<IgnoreSettings>({ required: true })
</script>
