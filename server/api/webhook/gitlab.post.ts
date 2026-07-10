export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getHeader(event, 'x-gitlab-token')
  if (!config.gitlabWebhookSecret || !token || !safeEqual(token, config.gitlabWebhookSecret)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid webhook token' })
  }

  // Past the token check, always answer 2xx so GitLab doesn't retry-storm.
  const body = await readBody(event)
  if (body?.object_kind !== 'pipeline') return { ok: true, skipped: 'not-pipeline' }

  const parsed = parsePipelineEvent(body)
  if (!parsed) return { ok: true, skipped: 'status' }

  if (!(await claimDedupe(parsed.pipelineId, parsed.status))) {
    return { ok: true, skipped: 'duplicate' }
  }

  const settings = await getSettings()
  if (parsed.status === 'canceled' && !settings.ignore.reactToCanceled) {
    return { ok: true, skipped: 'canceled-ignored' }
  }
  if (shouldIgnore(parsed, settings)) return { ok: true, skipped: 'ignored' }

  const stored = await appendEvent(parsed)
  return { ok: true, id: stored.id }
})
