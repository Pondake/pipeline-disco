# Design

Single source of truth for visual tokens. The Tailwind v4 `@theme` block in
`app/assets/css/main.css` mirrors these values; change them there and here together.

## Theme

Dark, always. Scene: a wall TV in an open-plan office glanced at between tasks;
a white rectangle on a wall is a lamp, not a display. Dark tinted neutrals make
the status floods read from meters away.

Color strategy: **Restrained at idle, Drenched for event moments.** Tinted dark
neutrals plus one accent while idle; when a pipeline lands the whole viewport
floods with the outcome color for a few seconds, then eases back.

## Color (OKLCH, no pure black or white)

Neutrals are tinted toward the accent hue (h 320).

| Token | Value | Use |
|---|---|---|
| `night-950` | `oklch(0.16 0.012 320)` | page ground |
| `night-900` | `oklch(0.20 0.014 320)` | raised surface (toolbar, inputs) |
| `night-800` | `oklch(0.26 0.016 320)` | borders, dividers |
| `night-600` | `oklch(0.45 0.02 320)` | disabled, faint text |
| `night-400` | `oklch(0.62 0.02 320)` | secondary text |
| `night-200` | `oklch(0.80 0.015 320)` | primary text on dark |
| `night-50`  | `oklch(0.95 0.008 320)` | headline text |
| `disco-500` | `oklch(0.68 0.16 320)` | accent: primary actions, selection, focus |
| `disco-300` | `oklch(0.80 0.12 320)` | accent text on dark |
| `go-500`    | `oklch(0.70 0.16 150)` | success text/icons |
| `go-700`    | `oklch(0.48 0.12 150)` | success flood ground |
| `stop-500`  | `oklch(0.66 0.19 25)`  | failure text/icons |
| `stop-700`  | `oklch(0.45 0.15 25)`  | failure flood ground |
| `warn-500`  | `oklch(0.75 0.13 85)`  | degraded connection, canceled |

## Typography

One family: system sans (`Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
Tabular numerals (`font-variant-numeric: tabular-nums`) for times and durations.

- Wallboard "now" zone: fixed rem sizes, large (4.5rem+ headline, weight 800), scale ratio >= 1.25.
- Settings/login: tighter scale (1.125-1.2), weights 400-600, body max 65ch.

## Motion

- 150-250 ms transitions, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint family). No bounce.
- Event flood: fast in (~200 ms), hold ~4 s, slow ease-out (~800 ms).
- Idle heartbeat on the empty state: slow opacity pulse, nothing else moves at rest.
- `prefers-reduced-motion`: floods become opacity-only fades; feed rows appear without translate.

## Components

- Buttons: one shape everywhere (rounded-md, night-900 ground, night-800 border, disco-500 for primary). States: default, hover, focus-visible ring (disco-500), active, disabled.
- Feed: typographic rows (ledger), never cards. Status shown as word + color.
- Forms: styled native elements; labels above inputs; section headings with whitespace separation, no boxed cards.
- Bans (absolute): side-stripe borders, gradient text, glassmorphism, hero-metric tiles, identical card grids, modals.
