/**
 * Deterministic per-repo chip colors. Hues avoid the status vocabulary
 * (green = success, red = failure, yellow = warn) so a badge never reads
 * as an outcome.
 */
// Continuous hue bands that stay clear of the status vocabulary
// (red ~25 = failure, yellow ~85 = warn, green ~150 = success).
const BANDS: Array<[number, number]> = [
  [30, 70], // orange..amber
  [165, 355], // cyan..blue..violet..magenta..pink
]
const BAND_TOTAL = BANDS.reduce((sum, [from, to]) => sum + (to - from), 0)

// FNV-1a: spreads short, similar strings much better than h*31.
function hash(value: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function repoHue(projectPath: string): number {
  let x = hash(projectPath) % BAND_TOTAL
  for (const [from, to] of BANDS) {
    if (x < to - from) return from + x
    x -= to - from
  }
  return BANDS[0]![0]
}

export function repoChipStyle(projectPath: string): Record<string, string> {
  const hue = repoHue(projectPath)
  return {
    backgroundColor: `oklch(0.27 0.045 ${hue})`,
    color: `oklch(0.84 0.09 ${hue})`,
    borderColor: `oklch(0.42 0.07 ${hue})`,
  }
}
