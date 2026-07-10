import type { Settings } from '#shared/types'
import { defaultSettings } from '#shared/utils/defaults'

export function useSettings() {
  const settings = useState<Settings>('settings', () => defaultSettings())
  const loaded = useState('settings-loaded', () => false)
  const saving = ref(false)

  async function load() {
    settings.value = await $fetch<Settings>('/api/settings')
    loaded.value = true
  }

  async function save(next: Settings) {
    saving.value = true
    try {
      settings.value = await $fetch<Settings>('/api/settings', {
        method: 'PUT',
        body: next,
      })
    } finally {
      saving.value = false
    }
  }

  return { settings, loaded, saving, load, save }
}
