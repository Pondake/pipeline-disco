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

      <CheckboxField
        v-model="ignore.onlyMrPipelines"
        label="Merge request pipelines only"
        description="Ignore push, schedule, and manual pipelines."
      />

      <CheckboxField
        v-model="ignore.reactToCanceled"
        label="Announce canceled pipelines"
        description="Off by default; cancels are usually noise."
      />
    </div>
  </section>
</template>
