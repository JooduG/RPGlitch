# RPGlitch — "Thinking"/Busy Animation Inventory

Every loading/busy/thinking animation in the app, where it lives, when it fires, why, and what it looks like. Line refs are to the current `src/`.

---

## 1. FEED — the message stream

### 1.1 Busy bubble: 3 pulsing dots (`Body.svelte:88-102`)

- **What**: three `h-1.5 w-1.5` rounded dots, `animate-pulse`, staggered `animation-delay: 0/150/300ms`, signature color, `opacity-60`, centered.
- **When**: a message card is the active stream target with no text yet — i.e. the temp/busy bubble the engine pushes into the feed while a turn is being generated (`Storymode.svelte:44-56`, entry `{ busy: true }`), plus any message that streamed and is still mid-typewriter.
- **Why**: "engine is thinking / about to stream." Driven by `streaming.active` (AI/fractal/NPC turns, prologue, epilogue, ghostwriter).
- **Assessment & Architecture**:
  - _How bubbles and typewriter go together_: While `text` is empty, the card renders the 3 pulsing dots. The moment the first streamed tokens arrive (`text.length > 0`), the card flips to render `<Typewriter />` (revealing the streamed characters progressively).
  - _Why two copies exist_: In `Body.svelte:85-104`, there is an outer `{#if should_use_typewriter}` block and an `{:else}` block. Both branches independently contain an identical `{:else if busy}` fallback containing the 3 dots. This is pure code duplication and can be unified into a single `<TypingDots />` component.

### 1.2 Typewriter kinetic text (`ui/motion/Typewriter.svelte`)

- **What**: characters appear one-by-one with an HTML-token-safe reveal; optional blinking cursor (`|` / `▌` / `_`).
- **When**: `should_use_typewriter` — the message being streamed, or a just-streamed message that hasn't finished typing out yet (`Message.svelte:106`).
- **Why**: kinetic text reveal synced to speech; speed is adaptive — fast-forwards when >300 chars behind the stream (`base_speed` 0.3 vs 0.01 when nearly caught up), multiplied by `motion.intensity` and the TTS voice rate.
- **Assessment & Architecture**:
  - _Blinking cursor_: `Typewriter.svelte` includes `show_cursor` with `@keyframes blink`, but `show_cursor` defaults to `false` and `Body.svelte` never passes it. It is currently dormant code.
  - _Speech Rate Sync vs Karaoke_: It is a **global speed multiplier**, not word-by-word timestamps (karaoke). In `Typewriter.svelte:158-160`, `active_speed` reads `Audio.voice.enabled && Audio.voice.is_speaking ? Audio.voice.rate : 1.0`, ensuring typewriter speed accelerates when TTS is speaking faster so audio doesn't outpace text display.

### 1.3 Prologue "awaiting flight" (`Feed.svelte:262`, CSS `message--prologue.prologue-awaiting-flight`)

- **What**: the prologue message card is invisible (opacity 0) while the storyboard cards "fly" into it; fades in over 650ms.
- **When**: `app.begin_story_pending` and the entry is the prologue (reduced-motion exempt).
- **Why**: choreographs the storyboard→storymode transition.

### 1.4 Message entrance (`in:item_in`, `Feed.svelte:253,263`)

- **What**: messages slide/fade in (200ms; prologue 0ms).
- **When**: new feed entries mount.
- **Why**: feed choreography.
- **Assessment & Architecture**:
  - _Wired up status_: **Yes, properly wired up**. In `Feed.svelte:263`, every normal message card uses `in:item_in={{ duration: 300 }}` from `transitions.svelte.js` (10px gentle rise `translateY(10px) ➔ 0px` + fade). It is intentionally subtle so the feed doesn't feel jarring.

---

## 2. COMPOSER / BOTTOM CONSOLE

### 2.1 "Processing memory" badge (`StorymodeBar.svelte:152-160`)

- **What**: `size-2` **cyan** pulsing dot + uppercase "PROCESSING MEMORY" (`text-[10px]` slate-400); tooltip "Storing this turn into memory… send resumes momentarily."
- **When**: `simulation_state.is_consolidating` — turn finished streaming, engine silently writing memory in background (`phase === "idle" && intent_active`).
- **Why**: explains why send is momentarily blocked.
- **Assessment & Action**:
  - _User Feedback_: Candidate for removal. Removing this badge keeps the composer clean and eliminates visual clutter during the brief 500ms RAG memory consolidation.

### 2.2 "Queued" badge & Input Queuing (`StorymodeBar.svelte:141-151`)

- **What**: `size-2` **amber** pulsing dot + "QUEUED" / "N queued".
- **When**: messages typed while the turn is locked get queued (`pending`).
- **Why**: reassurance nothing was dropped.
- **Assessment & Architecture**:
  - _Keyboard vs Button Asymmetry_: While streaming, the right-hand action button flips to the ⏹ **Interrupt** button (so clicking it stops the stream). However, the `<textarea>` remains enabled, and pressing `Enter` on the keyboard captures your input into the `pending` queue. The badge signals that your message is held safely and will auto-send the instant the AI completes.

### 2.3 Composer action buttons & Unstick (`StorymodeBar.svelte:163-190`)

- **What**: while streaming → ⏹ **Interrupt** button; while locked/generating → amber ⚠ **Unstick** (force-recover) button; else send arrow.
- **When**: `streaming.active` / `simulation_state.busy` / `app.simulation.loading`.
- **Why**: stop control + safety valve.
- **Assessment & Architecture**:
  - _How Unstick works_: It is an emergency hard-reset (not an automatic retry). It calls `abort()` on active HTTP requests, forces `simulation_state.phase = 'idle'`, unfreezes UI locks, and clears busy state so the user can immediately resume without refreshing. (Turn retry is handled via the separate "Regenerate" button).

### 2.4 Console shimmer sweep (`Console.svelte:143-146`, CSS `console-shimmer`)

- **What**: a translucent **cyan light band sweeps the whole console** left→right every 2.4s (background-position keyframe, deliberately NOT transform — transform animations freeze on view-transition-captured elements).
- **When**: `app.simulation.loading` — the Chrono Engine is processing a turn (prologue writing `chrono.svelte.js:17,144`, turn dispatch; cleared at `:79,176,310`, freeze-watchdog `:49`).
- **Why**: whole-console "engine busy" signal while the feed waits for the first token.
- **Assessment & Action**:
  - Maintained as the primary, ambient "engine is working" indicator for the entire bottom console.

### 2.5 Model-load progress (`StoryboardBar.svelte:20-21`)

- **What**: `ProgressBar` (`primitives/ProgressBar.svelte`) — electric-cyan fill, 300ms quartOut tween, `%` label; `value=null` variant runs an indeterminate sliding band.
- **When**: boot, while embeddings + TTS models download/initialize (`app.models_ready` false).
- **Why**: gate before "BEGIN STORY"; replaced by the BEGIN button when ready.

### 2.6 BEGIN STORY button busy (`StoryboardBar.svelte`)

- **What**: `busy` prop → button disables (`cursor-wait brightness-90 grayscale-30` + `aria-busy`); label flips to **"Generating Prologue..."** while `app.simulation.loading`; `pulse` kinetic action scales the button when ready.
- **When**: prologue being authored.
- **Why**: shows prologue is in progress.
- **Assessment & Action**:
  - Harmonized with 2.4 console shimmer. Label updated to "Generating Prologue...".

---

## 3. IMAGE GENERATION

### 3.1 Attachment loading cell — 3 pulsing dots (`Attachments.svelte:87-91`)

- **What**: three `h-2 w-2` signature-color dots in the image-card-sized box (stagger 0/150/300ms).
- **When**: any attachment whose `src` is still `null`: image beats, `take_photo`/`take_group_photo` placeholders, prologue image, regenerate-in-flight.
- **Why**: "image being generated here" in-place.
- **Assessment**: Shares the exact same conceptual pattern as 3.3 (ImagePicker) and 1.1 (Feed bubble), differing only in dot size (`h-2 w-2`).

### 3.2 Failed image tile (`Attachments.svelte` — the `is_failed` branch)

- **What**: red card, warning-triangle SVG, "Image generation failed — the image service timed out. Retry or remove.", **Retry** (if a prompt is stored) + **Remove** buttons.
- **When**: `attachment.metadata.failed` (timeouts, dropped beats, no-image-returned).
- **Why**: communicates failures instead of spinning forever.
- **Assessment**: Pairs with 3.4 (`VisualWing.svelte`) for unified error and retry handling across image generation.

### 3.3 Regenerate picker loading (`ImagePicker.svelte:155-157`)

- **What**: three `h-3 w-3` white/60 pulsing dots centered in the modal.
- **When**: candidate generation running (`candidates.length < 2`).
- **Why**: picker modal busy state; error state shows a red message + Close instead.
- **Assessment**: Identical animation to 3.1 and 1.1, but currently styled with `h-3 w-3` and `bg-white/60`. Unifying with `<TypingDots />` will standardize modal and feed loaders.

### 3.4 VisualEngine retry status (`VisualWing.svelte:376-389`)

- **What**: pulsing uppercase **"RETRYING"** + "Attempt N"; error state shows static **"ERROR"** + message.
- **When**: `app.visual.attempts > 0` (image service retrying after failures) / `app.visual.error`.
- **Why**: profile/visual wing transparency during image-service backoff.

---

## 4. BOOT / LOADING OVERLAYS

### 4.1 Skeleton shimmer (`App.svelte:449,475,498,508` + `primitives/Skeleton.svelte:55`)

- **What**: card-shaped placeholder with a diagonal **shimmer** sweep (2s ease-in-out).
- **When**: `!app.entities_loaded` — entities/stories loading from IndexedDB at boot (left/center/right panels).
- **Why**: boot skeleton.
- **Assessment**:
  - Compact ~70 LOC utility that prevents Cumulative Layout Shift (CLS) / flash of empty content on cold boots and slower mobile devices during IndexedDB hydration.

---

## 5. PROFILE / IMPORT FLOWS

### 5.1 "ENHANCING…" (`Profile.svelte:663`, `:853`)

- **What**: `animate-pulse` uppercase text "ENHANCING…" on the Enhance button and inline "ENHANCING" per-field while AI fills fields.
- **When**: `profile_state.busy_fields` non-empty (LLM enhancement of character/fractal profiles).
- **Why**: field-level busy state during AI enhancement.

### 5.2 "Fetching..." (`SourceField.svelte:290`)

- **What**: pulsing uppercase "Fetching..." inside the fetch button.
- **When**: `is_fetching` — URL fetch in the import modal.
- **Why**: import fetch progress.
- **Assessment**: For local JSON/file drag-and-drop it is instantaneous, but when scraping remote third-party character card URLs over CORS proxies, it can take 1–3s.

### 5.3 Import busy (`ImportModal.svelte:167,198`)

- **What**: `busy` button state (`cursor-wait`, grayscale) while importing.
- **Why**: import in progress.
- **Assessment**: Replace whole-modal graying with the unified `<TypingDots />` primitive inside the Import button for consistent feedback.

---

## 6. MESSAGE HEADER / AUDIO

### 6.1 Speaking indicator (`MessageHeader.svelte:147`)

- **What**: pause/resume icon button on the header of the message currently being read aloud.
- **When**: `Audio.voice.is_speaking && active_message_id === id`.
- **Why**: TTS control (no animation, but a busy-state affordance).

---

## 7. DEV-MODE TELEMETRY

### 7.1 Telemetry pulsing dots (`TelemetryCard.svelte:59,84`)

- **What**: `h-2 w-2` dev-accent pulsing dot + label ("Story Initiated", "Trigger Image" + tier/source).
- **When**: dev-mode telemetry cards for STORY_START / image triggers.
- **Why**: dev signal that an event fired.
- **Assessment**: Only visible when **Dev Mode** is toggled ON in the Console settings (`app.settings.dev_mode`).

### 7.2 Memory resonance (`DataBox.svelte:32`)

- **What**: `animate-[pulse-resonance_3s_infinite]` — 3s glow pulse + accent border on the DataBox.
- **When**: `isResonating` — MEMORY_FORMATION / VECTOR_RESOLUTION telemetry.
- **Why**: "memory forged" highlight.
- **Assessment**: Only visible in Dev Mode.

### 7.3 Undo toast dot (`UndoToast.svelte:35`)

- **What**: rose pulsing dot + "Message deleted".
- **When**: undo window open after a message delete.
- **Why**: deletion confirmation.

---

## 8. KINETIC ACTIONS & TRANSITIONS (movement, not "busy")

- `pulse` (BEGIN STORY), `shimmy` (shuffle), `stab` (send), `roll` — `ui/motion/kinetic.svelte.js`; triggered on interaction, playback scaled by `motion.intensity`, fully disabled under `motion.is_reduced` (prefers-reduced-motion).
- `overlay_in/out` (Dialogs/Modals), `item_in` (feed), shuffle `deal-reveal` — transitions.

---

## Observations & Independent Audit Findings

1. **The "3 pulsing dots" pattern is implemented 4× independently**: `Body.svelte` (`h-1.5 w-1.5`), `Attachments.svelte` (`h-2 w-2`), `ImagePicker.svelte` (`h-3 w-3`), and `StorymodeBar.svelte` (`size-2`). A unified `<TypingDots />` component in `src/ui/primitives/` will eliminate duplicate DOM/CSS, harmonize dot geometry, and guarantee consistent rhythm across feed, attachments, and modals.
2. **Dead Animation in `Message.svelte:607-615`**: Unused `@keyframes scan` block left over from an old CRT scanline experiment. Safe to delete.
3. **Unused Blinking Cursor in `Typewriter.svelte`**: `show_cursor` is disabled by default and unused by `Body.svelte`. `@keyframes blink` is dormant.
4. **Image Generation Missing Feed-Level Thinking Bubble**:
   - _Step 1_: User triggers an image action (`take_photo` / `take_group_photo`).
   - _Step 2_: Engine sets `simulation_state.phase = 'generating'`.
   - _Step 3_: `Storymode.svelte` only creates a new feed entry when `app.streaming.active === true` (which is only true for text streaming).
   - _Step 4_: The feed displays no typing bubble during pure image generation; the user only sees the composer shimmer and the loading cell on the prior turn card.
5. **Reduced Motion Gap**: Standard Tailwind `animate-pulse` classes in `Body.svelte`, `StorymodeBar.svelte`, and `ImagePicker.svelte` ignore `prefers-reduced-motion`. Adding `motion-reduce:animate-none` ensures complete accessibility compliance.
6. **Stacked Loading Semantics**: "Generating Prologue..." + console shimmer + busy bubble + model queue can all overlap during prologue initialization.
7. **Composer "Queued" Status**: Preserves user input entered while the AI turn is active and sends it sequentially once the lock releases.

---

## Unified Status & Architecture Matrix

| Category          | Component / File                          | Visual Implementation                                            | State Trigger                                  | Notes / Audit Status                                    |
| :---------------- | :---------------------------------------- | :--------------------------------------------------------------- | :--------------------------------------------- | :------------------------------------------------------ |
| **Feed Stream**   | `Body.svelte:88-102`                      | 3 staggered `h-1.5 w-1.5` `animate-pulse` signature-colored dots | `entry.busy && !text` (via `streaming.active`) | Duplicated in both typewriter and standard branches.    |
| **Feed Stream**   | `Typewriter.svelte`                       | Kinetic text reveal + dormant `@keyframes blink`                 | `should_use_typewriter`                        | Cursor currently dormant (`show_cursor = false`).       |
| **Feed Stream**   | `Feed.svelte:262`                         | Opacity fade 650ms (`prologue-awaiting-flight`)                  | `app.begin_story_pending`                      | Coordinated with storyboard card flight.                |
| **Console**       | `StorymodeBar.svelte:155-163`             | Single `size-2` cyan pulsing dot + "PROCESSING MEMORY"           | `simulation_state.is_consolidating`            | Candidate for removal per user preference.              |
| **Console**       | `StorymodeBar.svelte:145-154`             | Single `size-2` amber pulsing dot + "QUEUED"                     | `pending_count > 0`                            | Confirms user action was accepted during turn lock.     |
| **Console**       | `Console.svelte:143-147`                  | Cyan horizontal light sweep (`console-shimmer-sweep`)            | `app.simulation.loading`                       | Keyframe on background-position (view-transition safe). |
| **Storyboard**    | `StoryboardBar.svelte`                    | Indeterminate `ProgressBar` + "Generating Prologue..."           | `!app.models_ready` / `app.simulation.loading` | Model-download progress gate + prologue busy button.    |
| **Image Gen**     | `Attachments.svelte:87-92`                | 3 staggered `h-2 w-2` `animate-pulse` dots                       | Attachment `src === null`                      | In-place card loading placeholder.                      |
| **Image Gen**     | `ImagePicker.svelte:153-159`              | 3 staggered `h-3 w-3` `animate-pulse` white/60 dots              | `candidates.length < 2`                        | Modal loading state before candidate Polaroids render.  |
| **Image Gen**     | `VisualWing.svelte:376-389`               | Pulsing "RETRYING" / static "ERROR"                              | `app.visual.attempts > 0`                      | Exponential backoff indicator in Profile drawer.        |
| **Boot Overlay**  | `Skeleton.svelte:55`                      | 2s diagonal shimmer sweep (`@keyframes shimmer`)                 | `!app.entities_loaded`                         | IndexedDB cold boot skeleton (<50ms).                   |
| **Profile**       | `Profile.svelte:663,853`                  | Text pulsing `animate-pulse` "ENHANCING…" / "ENHANCING"          | `profile_state.busy_fields`                    | Field-level LLM generation indicator.                   |
| **Profile**       | `SourceField.svelte:290`                  | Pulsing uppercase "Fetching..."                                  | `is_fetching`                                  | URL scraper fetch indicator (1-3s remote proxy).        |
| **Dev Telemetry** | `TelemetryCard.svelte` / `DataBox.svelte` | Cyan dev-accent pulsing dot & `pulse-resonance` glow             | Dev telemetry events / memory formation        | Only active when Dev Mode is toggled on.                |
| **Toast**         | `UndoToast.svelte:35`                     | Rose pulsing dot + "Message deleted"                             | Message deletion undo window                   | Ephemeral undo timer confirmation.                      |
