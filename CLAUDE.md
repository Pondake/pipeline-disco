# Pipeline Disco

GitLab pipeline sound/TTS notifier. A private GitLab instance POSTs pipeline
webhooks here; open browser tabs (typically a Raspberry Pi kiosk on a wall
display with speakers) poll for new events and play a sound plus a spoken
announcement when a pipeline passes or fails. Hosted entirely on Vercel; Nuxt
server routes are the only backend.

## Commands

```bash
npm run dev        # dev server on :3000 (uses in-memory store, no Upstash needed)
npm run build      # production build (Vercel/Nitro)
npm run preview    # preview the production build locally
```

No test suite. Verify changes by running the dev server and using the
"Simulate pass/fail" buttons on the board, or POST to the webhook (see README).

## Architecture

```
GitLab webhook ──POST /api/webhook/gitlab──▶ Nuxt server route (Vercel function)
                                               │ token check, status gate,
                                               │ dedupe, ignore rules
                                               ▼
                                       Upstash Redis (ZSET)
                                               ▲
browser tab(s) ──GET /api/events?cursor=N──────┘  (adaptive polling)
      │
      ▼ new events
Web Audio synth/file sound + speechSynthesis TTS + full-screen status flood
```

- **Events are pulled, not pushed.** Vercel functions can't hold sockets, so
  the browser polls with a monotonic cursor. Poll cadence adapts:
  `polling.activeMs` (default 4s) for 10 minutes after an event, then
  `polling.idleMs` (12s). Hidden tabs pause polling entirely. This keeps
  Upstash free-tier command usage (~500k/month) in budget.
- **Settings are shared** (stored in Redis), fetched by every device.
  Audio/TTS voices are per-device.
- **Demo mode** is purely client-side: `useDemoMode` fabricates events through
  the same handler path as real ones; nothing is written server-side.
- **Sounds**: `synth:*` ids are Web Audio recipes in
  [useAudio.ts](app/composables/useAudio.ts) (zero assets required). Files in
  `app/assets/sounds/*.{mp3,wav,ogg}` are discovered at **build time** via
  `import.meta.glob` and appear as `file:<name>` — adding one requires a
  redeploy.
- **Auth**: single shared password. The global
  [server middleware](server/middleware/auth.ts) accepts either the HMAC
  session cookie or `?key=<APP_PASSWORD>` (which sets the cookie — this is how
  the kiosk logs in). The webhook route is exempt; it checks `X-Gitlab-Token`
  instead. Session signing is stateless HMAC in
  [server/utils/auth.ts](server/utils/auth.ts).
- **Local dev without Upstash**: [server/utils/redis.ts](server/utils/redis.ts)
  falls back to an in-memory store implementing just the commands used
  (state resets on server restart).

## Redis keys (prefix `disco:`)

| Key | Type | Purpose |
|---|---|---|
| `disco:seq` | int | INCR per accepted event; the id doubles as the poll cursor |
| `disco:events` | ZSET | member = JSON `DiscoEvent`, score = seq id, trimmed to last 200 |
| `disco:dedupe:{pipelineId}:{status}` | string | SET NX EX 6h, absorbs GitLab webhook retries |
| `disco:settings` | string | single JSON blob, defaults-merged on read |

## Env vars

| Var | Required | Notes |
|---|---|---|
| `APP_PASSWORD` | yes | login password, also accepted as `?key=` |
| `GITLAB_WEBHOOK_SECRET` | yes | must equal the webhook's Secret token |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | prod | injected by the Vercel Upstash integration; absent = in-memory store |
| `SESSION_SECRET` | no | cookie HMAC key; defaults to a hash of `APP_PASSWORD` |

Unset `APP_PASSWORD` means: auth disabled in dev, 503 in production.

## Conventions

- Types shared between server and app live in [shared/types.ts](shared/types.ts)
  (imported via the `#shared` alias). Server utils are Nitro auto-imports.
- Design tokens are defined once in [DESIGN.md](DESIGN.md) and mirrored in the
  Tailwind v4 `@theme` block in [main.css](app/assets/css/main.css). PRODUCT.md
  and DESIGN.md carry the design system context; consult them before UI work.
- Webhook handler always answers 2xx after the token check so GitLab never
  retry-storms; rejected events return `{ ok: true, skipped: <reason> }`.
