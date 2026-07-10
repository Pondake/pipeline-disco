import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxt/eslint'],
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
