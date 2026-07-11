import type { DiscoEvent } from '#shared/types'
import { humanDuration } from './date'

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
