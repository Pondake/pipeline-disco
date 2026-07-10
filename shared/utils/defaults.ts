import type { Settings } from '../types'

export function defaultSettings(): Settings {
  return {
    version: 1,
    ignore: {
      projects: [],
      branchPatterns: [],
      titlePatterns: [],
      onlyMrPipelines: false,
      reactToCanceled: false,
    },
    sound: {
      enabled: true,
      success: 'synth:chime',
      failed: 'synth:buzz',
      canceled: 'synth:blip',
      volume: 0.8,
    },
    tts: {
      enabled: true,
      successTemplate: '{mr_title} by {author} passed!',
      failedTemplate: '{mr_title} on {project} failed.',
      canceledTemplate: '{mr_title} on {project} was canceled.',
      voice: '',
      rate: 1,
    },
    polling: {
      activeMs: 4000,
      idleMs: 12000,
    },
  }
}
