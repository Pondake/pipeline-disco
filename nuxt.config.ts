import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxt/eslint', '@nuxt/icon'],
  icon: {
    // The icon set used (app/utils/soundIcons.ts) is small and fully known
    // up front, so bundle exactly those into the client and skip both the
    // Iconify API and the (~2MB) whole-collection server bundle.
    provider: 'none',
    serverBundle: false,
    clientBundle: {
      icons: [
        'tabler:bell-ringing',
        'tabler:trophy',
        'tabler:bug',
        'tabler:point-filled',
        'tabler:confetti',
        'tabler:sparkles',
        'tabler:bolt',
        'tabler:coin',
        'tabler:vinyl',
        'tabler:mood-sad',
        'tabler:alarm',
        'tabler:target',
        'tabler:trending-down',
        'tabler:bell',
        'tabler:wave-square',
        'tabler:circle-filled',
        'tabler:wind',
        'tabler:alert-triangle',
        'tabler:robot',
        'tabler:activity-heartbeat',
        'tabler:file-music',
        'tabler:music',
        'tabler:chevron-down',
        'tabler:x',
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      title: 'Pipeline Disco',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex' },
      ],
    },
  },
  runtimeConfig: {
    appPassword: process.env.APP_PASSWORD || '',
    gitlabWebhookSecret: process.env.GITLAB_WEBHOOK_SECRET || '',
    sessionSecret: process.env.SESSION_SECRET || '',
  },
})
