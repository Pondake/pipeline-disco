/**
 * One AudioContext for the whole app. Synth sounds need no assets; file
 * sounds are discovered at build time from app/assets/sounds/.
 */

type SynthRecipe = {
  label: string
  /** Returns the sound's duration in seconds. */
  play: (ctx: AudioContext, out: GainNode) => number
}

function note(
  ctx: AudioContext,
  out: GainNode,
  type: OscillatorType,
  freq: number,
  start: number,
  length: number,
  peak = 0.5,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
  gain.gain.setValueAtTime(0, ctx.currentTime + start)
  gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + length)
  osc.connect(gain).connect(out)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + length + 0.05)
}

/** Oscillator whose pitch slides between segments: [freq, atSecond] pairs. */
function slide(
  ctx: AudioContext,
  out: GainNode,
  type: OscillatorType,
  points: Array<[number, number]>,
  start: number,
  length: number,
  peak = 0.5,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  const t0 = ctx.currentTime + start
  osc.frequency.setValueAtTime(points[0]![0], t0 + points[0]![1])
  for (const [freq, at] of points.slice(1)) {
    osc.frequency.linearRampToValueAtTime(freq, t0 + at)
  }
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + length)
  osc.connect(gain).connect(out)
  osc.start(t0)
  osc.stop(t0 + length + 0.05)
}

let cachedNoise: AudioBuffer | null = null

/** White-noise burst through a filter: hats, cymbals, thumps. */
function noise(
  ctx: AudioContext,
  out: GainNode,
  start: number,
  length: number,
  filterType: BiquadFilterType,
  filterFreq: number,
  peak = 0.4,
) {
  if (!cachedNoise) {
    cachedNoise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = cachedNoise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const source = ctx.createBufferSource()
  source.buffer = cachedNoise
  const filter = ctx.createBiquadFilter()
  filter.type = filterType
  filter.frequency.value = filterFreq
  const gain = ctx.createGain()
  const t0 = ctx.currentTime + start
  gain.gain.setValueAtTime(peak, t0)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + length)
  source.connect(filter).connect(gain).connect(out)
  source.start(t0)
  source.stop(t0 + length + 0.05)
}

const SYNTHS: Record<string, SynthRecipe> = {
  'synth:chime': {
    label: 'Chime',
    play(ctx, out) {
      note(ctx, out, 'sine', 523.25, 0, 0.9)
      note(ctx, out, 'sine', 659.25, 0.12, 0.9)
      note(ctx, out, 'sine', 783.99, 0.24, 1.1)
      return 1.4
    },
  },
  'synth:fanfare': {
    label: 'Fanfare',
    play(ctx, out) {
      note(ctx, out, 'triangle', 392, 0, 0.18, 0.45)
      note(ctx, out, 'triangle', 523.25, 0.16, 0.18, 0.45)
      note(ctx, out, 'triangle', 659.25, 0.32, 0.18, 0.45)
      note(ctx, out, 'triangle', 783.99, 0.48, 0.9, 0.5)
      note(ctx, out, 'triangle', 787.5, 0.48, 0.9, 0.25) // slight detune shimmer
      return 1.5
    },
  },
  'synth:buzz': {
    label: 'Buzz',
    play(ctx, out) {
      const osc = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc2.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(98, ctx.currentTime + 0.65)
      osc2.frequency.setValueAtTime(223, ctx.currentTime)
      osc2.frequency.exponentialRampToValueAtTime(101, ctx.currentTime + 0.65)
      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      osc.connect(gain)
      osc2.connect(gain)
      gain.connect(out)
      osc.start()
      osc2.start()
      osc.stop(ctx.currentTime + 0.85)
      osc2.stop(ctx.currentTime + 0.85)
      return 0.9
    },
  },
  'synth:blip': {
    label: 'Blip',
    play(ctx, out) {
      note(ctx, out, 'sine', 880, 0, 0.15, 0.4)
      return 0.2
    },
  },
  'synth:tada': {
    label: 'Tada',
    play(ctx, out) {
      for (const f of [392, 523.25, 659.25]) note(ctx, out, 'triangle', f, 0, 0.22, 0.3)
      for (const f of [523.25, 659.25, 783.99, 1046.5])
        note(ctx, out, 'triangle', f, 0.22, 1.1, 0.28)
      noise(ctx, out, 0.22, 0.5, 'highpass', 6000, 0.15)
      return 1.4
    },
  },
  'synth:sparkle': {
    label: 'Sparkle',
    play(ctx, out) {
      const freqs = [1046.5, 1318.5, 1568, 2093, 2637, 3136]
      freqs.forEach((f, i) => note(ctx, out, 'sine', f, i * 0.07, 0.45, 0.25))
      return 0.9
    },
  },
  'synth:powerup': {
    label: 'Power-up',
    play(ctx, out) {
      slide(
        ctx,
        out,
        'square',
        [
          [220, 0],
          [880, 0.45],
        ],
        0,
        0.5,
        0.25,
      )
      note(ctx, out, 'square', 1108.7, 0.48, 0.35, 0.25)
      return 0.9
    },
  },
  'synth:arcade': {
    label: 'Arcade coin',
    play(ctx, out) {
      note(ctx, out, 'square', 987.77, 0, 0.09, 0.25)
      note(ctx, out, 'square', 1318.5, 0.09, 0.5, 0.25)
      return 0.65
    },
  },
  'synth:disco': {
    label: 'Disco riff',
    play(ctx, out) {
      const bass = [110, 110, 130.81, 146.83]
      bass.forEach((f, i) => note(ctx, out, 'triangle', f, i * 0.16, 0.14, 0.5))
      for (let i = 0; i < 4; i++) noise(ctx, out, i * 0.16 + 0.08, 0.05, 'highpass', 8000, 0.12)
      for (const f of [220, 277.18, 329.63, 440]) note(ctx, out, 'sawtooth', f, 0.64, 0.5, 0.12)
      return 1.2
    },
  },
  'synth:sadtrombone': {
    label: 'Sad trombone',
    play(ctx, out) {
      const notes: Array<[number, number, number]> = [
        [311.13, 0, 0.32],
        [293.66, 0.36, 0.32],
        [277.18, 0.72, 0.32],
        [261.63, 1.08, 0.9],
      ]
      for (const [f, at, len] of notes) {
        slide(
          ctx,
          out,
          'sawtooth',
          [
            [f, 0],
            [f * 0.93, len],
          ],
          at,
          len,
          0.3,
        )
      }
      return 2.1
    },
  },
  'synth:alarm': {
    label: 'Alarm',
    play(ctx, out) {
      for (let i = 0; i < 4; i++) {
        note(ctx, out, 'square', i % 2 === 0 ? 880 : 660, i * 0.16, 0.14, 0.25)
      }
      return 0.7
    },
  },
  'synth:laser': {
    label: 'Laser',
    play(ctx, out) {
      slide(
        ctx,
        out,
        'square',
        [
          [1600, 0],
          [180, 0.28],
        ],
        0,
        0.3,
        0.3,
      )
      return 0.35
    },
  },
  'synth:womp': {
    label: 'Womp',
    play(ctx, out) {
      slide(
        ctx,
        out,
        'sawtooth',
        [
          [130, 0],
          [55, 0.7],
        ],
        0,
        0.85,
        0.4,
      )
      slide(
        ctx,
        out,
        'sawtooth',
        [
          [133, 0],
          [57, 0.7],
        ],
        0,
        0.85,
        0.4,
      )
      return 0.95
    },
  },
  'synth:bell': {
    label: 'Bell toll',
    play(ctx, out) {
      note(ctx, out, 'sine', 196, 0, 2, 0.5)
      note(ctx, out, 'sine', 392, 0, 1.4, 0.2)
      note(ctx, out, 'sine', 529.2, 0, 0.9, 0.12)
      note(ctx, out, 'sine', 792, 0, 0.5, 0.08)
      return 2.1
    },
  },
  'synth:cymbal': {
    label: 'Cymbal',
    play(ctx, out) {
      noise(ctx, out, 0, 0.9, 'highpass', 5000, 0.35)
      return 1
    },
  },
  'synth:pop': {
    label: 'Pop',
    play(ctx, out) {
      slide(
        ctx,
        out,
        'sine',
        [
          [500, 0],
          [120, 0.08],
        ],
        0,
        0.1,
        0.5,
      )
      return 0.15
    },
  },
  'synth:whoosh': {
    label: 'Whoosh',
    play(ctx, out) {
      slide(
        ctx,
        out,
        'sine',
        [
          [200, 0],
          [2000, 0.35],
        ],
        0,
        0.4,
        0.35,
      )
      noise(ctx, out, 0, 0.4, 'bandpass', 1200, 0.2)
      return 0.45
    },
  },
  'synth:klaxon': {
    label: 'Klaxon',
    play(ctx, out) {
      for (let i = 0; i < 3; i++) {
        slide(
          ctx,
          out,
          'sawtooth',
          [
            [500, 0],
            [350, 0.18],
          ],
          i * 0.22,
          0.2,
          0.35,
        )
      }
      return 0.7
    },
  },
  'synth:robot': {
    label: 'Robot',
    play(ctx, out) {
      const freqs = [440, 440, 587.33, 349.23, 440]
      freqs.forEach((f, i) => note(ctx, out, 'square', f, i * 0.09, 0.08, 0.22))
      return 0.55
    },
  },
  'synth:heartbeat': {
    label: 'Heartbeat',
    play(ctx, out) {
      noise(ctx, out, 0, 0.14, 'lowpass', 120, 0.5)
      noise(ctx, out, 0.22, 0.16, 'lowpass', 100, 0.4)
      return 0.5
    },
  },
}

// Build-time discovery of user-supplied sounds; keys are relative paths.
const soundFiles = import.meta.glob('../assets/sounds/*.{mp3,wav,ogg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const fileSoundUrls: Record<string, string> = {}
for (const [path, url] of Object.entries(soundFiles)) {
  const name = path.split('/').pop()!
  fileSoundUrls[`file:${name}`] = url
}

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
const bufferCache = new Map<string, AudioBuffer>()

const armed = ref(false)

function ensureContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    masterGain.connect(ctx.destination)
  }
  return ctx
}

export function useAudio() {
  /** Silently arms when autoplay is already allowed (kiosk flag). */
  async function checkAutoArm() {
    const context = ensureContext()
    if (context.state === 'running') armed.value = true
  }

  /** Must be called from a user gesture when autoplay is blocked. */
  async function arm() {
    const context = ensureContext()
    await context.resume()
    if (context.state === 'running') armed.value = true
    // Prime speechSynthesis inside the same gesture.
    if ('speechSynthesis' in window) {
      const primer = new SpeechSynthesisUtterance(' ')
      primer.volume = 0
      speechSynthesis.speak(primer)
    }
    return armed.value
  }

  /** Plays a sound by id ("synth:chime" or "file:x.mp3"); resolves duration in seconds. */
  async function playSound(id: string, volume: number): Promise<number> {
    const context = ensureContext()
    if (context.state !== 'running') return 0
    masterGain!.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), context.currentTime)

    const synth = SYNTHS[id]
    if (synth) return synth.play(context, masterGain!)

    const url = fileSoundUrls[id]
    if (!url) return 0
    let buffer = bufferCache.get(id)
    if (!buffer) {
      const data = await fetch(url).then((r) => r.arrayBuffer())
      buffer = await context.decodeAudioData(data)
      bufferCache.set(id, buffer)
    }
    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(masterGain!)
    source.start()
    return buffer.duration
  }

  const availableSounds = computed(() => [
    ...Object.entries(SYNTHS).map(([id, s]) => ({ id, label: s.label })),
    ...Object.keys(fileSoundUrls).map((id) => ({ id, label: id.replace(/^file:/, '') })),
  ])

  return { armed, arm, checkAutoArm, playSound, availableSounds }
}
