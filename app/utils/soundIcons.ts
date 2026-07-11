const SYNTH_ICONS: Record<string, string> = {
  'synth:chime': 'tabler:bell-ringing',
  'synth:fanfare': 'tabler:trophy',
  'synth:buzz': 'tabler:bug',
  'synth:blip': 'tabler:point-filled',
  'synth:tada': 'tabler:confetti',
  'synth:sparkle': 'tabler:sparkles',
  'synth:powerup': 'tabler:bolt',
  'synth:arcade': 'tabler:coin',
  'synth:disco': 'tabler:vinyl',
  'synth:sadtrombone': 'tabler:mood-sad',
  'synth:alarm': 'tabler:alarm',
  'synth:laser': 'tabler:target',
  'synth:womp': 'tabler:trending-down',
  'synth:bell': 'tabler:bell',
  'synth:cymbal': 'tabler:wave-square',
  'synth:pop': 'tabler:circle-filled',
  'synth:whoosh': 'tabler:wind',
  'synth:klaxon': 'tabler:alert-triangle',
  'synth:robot': 'tabler:robot',
  'synth:heartbeat': 'tabler:activity-heartbeat',
}

/** Icon name for a sound id, for the sound picker's grid. */
export function soundIcon(id: string): string {
  if (SYNTH_ICONS[id]) return SYNTH_ICONS[id]
  if (id.startsWith('file:')) return 'tabler:file-music'
  return 'tabler:music'
}
