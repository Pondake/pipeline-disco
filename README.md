# Pipeline Disco 🪩

Passing pipelines, out loud. A private GitLab instance sends pipeline webhooks
here; a browser tab on speakers (say, a Raspberry Pi under the office TV) plays
a sound and announces the result: _"Fix login redirect loop by Marthijn passed!"_

Runs entirely on Vercel. No servers to keep alive: webhooks land in a
serverless Nuxt route, events sit in Upstash Redis, open tabs poll and do the
noise-making with the Web Audio API and browser text-to-speech.

## Setup

### 1. Deploy to Vercel

1. Push this repo to Git and import it into Vercel (framework preset: Nuxt).
2. Add the **Upstash Redis** integration from the Vercel Marketplace
   (free tier is plenty). Depending on when you connect it, it injects either
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` or the legacy Vercel
   KV names `KV_REST_API_URL` / `KV_REST_API_TOKEN` — the app checks both.
3. Add environment variables:
   - `APP_PASSWORD` — the shared password for the site
   - `GITLAB_WEBHOOK_SECRET` — any long random string
4. Deploy.

### 2. Point GitLab at it

Add a webhook per project — every repo uses the **same URL and secret**, and the
board tells them apart automatically (each repo gets its own colored badge). If
all repos live under one group, a single group-level webhook covers them all
instead. Per project:

1. **Settings → Webhooks → Add new webhook**
2. URL: `https://<your-app>.vercel.app/api/webhook/gitlab`
3. Secret token: the same value as `GITLAB_WEBHOOK_SECRET`
4. Trigger: check **Pipeline events** only
5. Save, then use GitLab's **Test → Pipeline events** button; the response
   should be `{ "ok": true, ... }`

Only `success` and `failed` pipelines make noise (`canceled` is opt-in under
Settings → Ignore rules). Running/pending events are dropped immediately.

### 3. Open the board

Visit the site, enter the password, click **Start the disco** once to unlock
audio. Done: the wallboard shows pipelines as they land and plays your chosen
sounds. Everything is tunable on the **Settings** page (shared across devices):

- **Ignore rules**: mute whole projects, branch patterns (`renovate/*`), or MR
  title patterns (`Draft:*`); optionally react to MR pipelines only
- **Sounds**: pick per-outcome sounds, preview them, set the volume
- **Text to speech**: templates with `{mr_title}`, `{project}`, `{branch}`,
  `{status}`, `{author}`, `{duration}` placeholders, voice and rate
- **Demo mode** (button on the board): fake events every 10 seconds through the
  real audio path, for testing the speaker setup without touching GitLab

### Custom sounds

The built-in sounds are synthesized, so no files are needed. To add your own,
drop `.mp3`/`.wav`/`.ogg` files into `app/assets/sounds/` and redeploy; they
appear in the sound pickers automatically.

## Raspberry Pi kiosk

The `?key=` URL parameter logs in without a form, and a Chromium flag removes
the audio-unlock click, so the Pi is fully hands-off after boot:

```bash
chromium-browser --kiosk \
  --autoplay-policy=no-user-gesture-required \
  --noerrdialogs --disable-session-crashed-bubble \
  "https://<your-app>.vercel.app/?key=<APP_PASSWORD>"
```

Put that in the Pi's autostart (e.g. `~/.config/labwc/autostart` or a systemd
user unit). Two Linux gotchas:

- **No TTS voices**: install `speech-dispatcher` and `espeak-ng`
  (`sudo apt install speech-dispatcher espeak-ng`), then restart Chromium.
  Without them the app degrades to sound-only.
- **Screen blanking**: disable it if the display should stay on
  (`wlr-randr`/`xset s off -dpms` depending on the session type).

## Local development

```bash
cp .env.example .env   # defaults: password "disco", webhook secret "local-webhook-secret"
pnpm install
pnpm dev
```

Without Upstash env vars the app uses an in-memory store, so no account is
needed locally (events vanish on server restart). Fake events: use the
**Simulate pass/fail** buttons on the board, or POST a webhook by hand:

```powershell
$payload = @{
  object_kind = 'pipeline'
  object_attributes = @{ id = 1234; status = 'success'; ref = 'main'; source = 'merge_request_event'; duration = 194 }
  merge_request = @{ title = 'Fix login redirect loop'; iid = 42; url = 'https://gitlab.example.com/mr/42' }
  project = @{ id = 7; name = 'customer-portal'; path_with_namespace = 'web/customer-portal' }
  user = @{ name = 'Marthijn' }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri http://localhost:3000/api/webhook/gitlab -Method Post `
  -Body $payload -ContentType 'application/json' `
  -Headers @{ 'X-Gitlab-Token' = 'local-webhook-secret' }
```

## Costs and quotas

An always-open tab polls adaptively (4s for 10 minutes after an event, 12s when
idle, paused while hidden), which lands around 220k Upstash commands per month
per tab — inside the 500k free tier. Intervals are adjustable in Settings if
you run several boards.
