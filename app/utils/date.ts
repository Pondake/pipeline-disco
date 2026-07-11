/** Shared HH:MM formatter for event timestamps (ts is epoch ms). */
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

export function formatEventTime(ts: number): string {
  return timeFormat.format(ts)
}

/** e.g. 192 -> "3 minutes 12 seconds". Empty string for falsy/non-positive input. */
export function humanDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins === 0) return `${secs} seconds`
  if (secs === 0) return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`
  return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ${secs} seconds`
}
