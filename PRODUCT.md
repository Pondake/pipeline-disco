# Product

## Register

product

## Users

A dev team. The player page runs 24/7 in Chromium kiosk mode on a Raspberry Pi that drives a wall-mounted display with speakers in the office. Settings and login are used occasionally from laptops. The webhook consumer is a private GitLab instance; the audience is everyone within earshot of the speakers.

## Product Purpose

Ambient awareness and celebration of CI results. GitLab pipeline events arrive by webhook; when a pipeline passes or fails, the room hears a sound and a spoken announcement, and anyone who glances at the wall instantly knows what passed or failed. Success looks like: nobody opens GitLab to check pipeline status anymore, and a green flood on the wall gets a small cheer.

## Brand Personality

Playful disco energy: celebratory, confident, crisp. The fun lives in moments (event flashes, sounds, copy), not in permanent decoration. Idle, the board is calm and legible; when a pipeline lands, it gets theatrical for a few seconds, then settles.

## Anti-references

- Neon-cyberpunk overload: no glow-everything, no neon-on-black aesthetic.
- Generic SaaS dashboard slop: no KPI card grids, no gradient text, no glassmorphism.
- GitLab's own UI: this is its own thing, not an orange-and-purple clone.

## Design Principles

1. Readable from meters away. The wallboard is the product; type sizes and contrast are chosen for across-the-room glances.
2. Delight is an event, not a state. The idle screen is quiet; the moment a pipeline lands is the show.
3. Settings disappear into the task. Boring-good forms, standard affordances, nothing clever.
4. Zero-asset resilience. The app looks and sounds complete with no uploaded fonts or audio files.

## Accessibility & Inclusion

WCAG AA contrast on all text at rest. Status is never conveyed by color alone (words and icons accompany every status color). Motion respects prefers-reduced-motion: floods become simple fades. Forms are native elements with visible focus states.
