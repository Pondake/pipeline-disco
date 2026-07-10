import type { DiscoEvent } from '#shared/types'

function humanDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins === 0) return `${secs} seconds`
  if (secs === 0) return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`
  return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ${secs} seconds`
}

/** Fill {placeholders} in a TTS template from an event. */
export function renderTemplate(template: string, event: DiscoEvent): string {
  const values: Record<string, string> = {
    mr_title: event.mrTitle || event.branch || event.project,
    project: event.project,
    branch: event.branch,
    status: event.status,
    author: event.author,
    duration: humanDuration(event.duration),
  }
  return template
    .replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}
