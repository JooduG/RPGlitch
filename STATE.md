# 📍 RPGlitch Active State (The Baton)

> **AI DIRECTIVE:** You MUST read this file before planning any code changes. You MUST update this file's "Recent Changes" and "Active WIP" sections before concluding your session in `06-continue.md`.

**Last Updated:** 2026-03-11
**Current Version:** Prototype / Vibe-Coding Phase

## 1. Current Initiative

_What are we building right now?_

- Currently focusing on: **Setting up the local Antigravity AI orchestration and "Living Atlas" workflows.**
- Refer to `.agent/tasks/tracks.md` for the broader roadmap.

## 2. Architectural Reality

_How does the engine actually work today?_

- **State Management:** Svelte 5 Runes (`$state`, `$derived`) are the standard. Do NOT use legacy Svelte 4 stores (`writable`) unless maintaining an older file.
- **Deployment Target:** Perchance. The bundle must be completely self-contained (no external API calls, no heavy backend node modules).
- **Core Engine:** `ContextBroker.js` and `NarrativeDirector.js` handle the primary game loop and event routing.

## 3. UI / Visual Reality

_What does the game look like right now?_

- Strict adherence to the **Chalk Regime** (see `.agent/skills/styling/SKILL.md`).
- Glassmorphic, diegetic interfaces.
- Core CSS tokens (e.g., `var(--color-chalk)`) are heavily utilized.

## 4. Recent Changes (Changelog)

What did the last few agents just do? (Keep to the last 3-5 items)

- 2026-03-11 - _Initialized the STATE.md file to track active context._
- 2026-03-11 - _Updated 00-boot.md and 06-continue.md to enforce the State Baton read/write loop._

## 5. Active WIP & Known Quirks

_What is currently broken, half-finished, or explicitly "do not touch"?_

- ⚠️ **Local AI CLI:** Currently designing the `10-vibe-intake.md` workflow; do not execute AI swarms yet.
