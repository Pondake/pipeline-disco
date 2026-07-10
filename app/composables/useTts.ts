const voices = ref<SpeechSynthesisVoice[]>([])
let voicesLoaded = false

export function useTts() {
  function loadVoices() {
    if (voicesLoaded || !('speechSynthesis' in window)) return
    voicesLoaded = true
    voices.value = speechSynthesis.getVoices()
    // Chromium populates the list asynchronously.
    speechSynthesis.addEventListener('voiceschanged', () => {
      voices.value = speechSynthesis.getVoices()
    })
  }

  const available = computed(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window && voices.value.length > 0,
  )

  function speak(text: string, opts: { voice?: string; rate?: number; volume?: number } = {}) {
    if (!('speechSynthesis' in window) || !text.trim()) return
    const utterance = new SpeechSynthesisUtterance(text)
    if (opts.voice) {
      const match = voices.value.find((v) => v.voiceURI === opts.voice)
      if (match) utterance.voice = match
    }
    utterance.rate = opts.rate ?? 1
    utterance.volume = opts.volume ?? 1
    speechSynthesis.speak(utterance)
  }

  return { voices, available, loadVoices, speak }
}
