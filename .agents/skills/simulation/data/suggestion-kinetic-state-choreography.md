# Suggestion: Kinetic State Choreography & Motion Architecture

> **Status:** Architectural Proposal / Backlog Reference  
> **Domain:** Sensory Layer, Loading States & Kinetic Feedback  
> **Scope:** Unified `<TypingDots />` Primitive, Feed Stream Choreography, Shimmer Sweeps, Reduced-Motion Compliance  

---

## 1. Executive Summary

This specification unifies loading, busy, and kinetic states across the RPGlitch UI:
1. **The `<TypingDots />` Primitive:** Consolidates 4 duplicated pulsing dot implementations into one parameterized component.
2. **Feed Stream Choreography:** Eliminates visual jumping between empty stream bubbles, typewriter kinetic text, and speech-rate acceleration.
3. **Console & Busy Signals:** Defines the primary cyan shimmer sweep while removing redundant status clutter.
4. **Accessibility Compliance:** Enforces complete `motion-reduce:animate-none` compliance.

---

## 2. The Unified `<TypingDots />` Primitive

Currently, pulsing dot indicators are duplicated in `Body.svelte`, `Attachments.svelte`, `ImagePicker.svelte`, and `StorymodeBar.svelte`. 

### Specification (`src/ui/primitives/TypingDots.svelte`)

```svelte
<script>
  /**
   * Unified Loading / Busy Dots Primitive
   * @type {{ size?: 'sm' | 'md' | 'lg', color?: string, class?: string }}
   */
  let { size = 'md', color = 'bg-accent-cyan', class: extra_class = '' } = $props();

  const size_map = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3'
  };
</script>

<div class="flex items-center justify-center gap-1.5 {extra_class}" role="status" aria-label="Loading">
  <span class="{size_map[size]} {color} rounded-full animate-pulse motion-reduce:animate-none"></span>
  <span class="{size_map[size]} {color} rounded-full animate-pulse [animation-delay:150ms] motion-reduce:animate-none"></span>
  <span class="{size_map[size]} {color} rounded-full animate-pulse [animation-delay:300ms] motion-reduce:animate-none"></span>
</div>
```

---

## 3. Feed Stream & Console Choreography

### 3.1 Feed Turn Progression
1. **Awaiting Stream:** Message card mounts with `<TypingDots size="sm" />`.
2. **First Tokens Arrive:** Seamlessly flips to `<Typewriter />` kinetic character reveal.
3. **Speech Sync:** Typewriter speed accelerates when TTS is active (`Audio.voice.rate`).

### 3.2 Console Ambient Busy Signal
- Translucent **cyan light band sweep** (`console-shimmer-sweep`) indicates background ChronoEngine processing without displacing layout.
- User input captured during turn lock displays a single amber `QUEUED` indicator and auto-dispatches once the lock releases.
- Emergency `Unstick` (force reset) and `Interrupt` (abort stream) controls remain accessible during generation.

---

## 4. Image Generation & Profile Loading States

- **Attachments Placeholder:** Uses `<TypingDots size="md" />` in-place while diffusion image generation is in flight.
- **Failed Image Tiles:** Renders retry controls and failure explanations when diffusion calls time out.
- **Candidate Picker:** Uses `<TypingDots size="lg" />` centered in the Polaroid candidate picker modal.
- **Visual Engine Retry:** Renders pulsing "RETRYING" with attempt count during exponential backoff.

---

## 5. Unified Animation & Busy State Inventory

| Category | Component & Location | Visual Implementation | State Trigger | Architecture & Action Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Feed Stream** | `Body.svelte:88-102` | 3 staggered `h-1.5 w-1.5` pulsing dots | `entry.busy && !text` | Unify with `<TypingDots size="sm" />`. |
| **Feed Stream** | `Typewriter.svelte` | Kinetic text reveal + speech-rate sync | `should_use_typewriter` | Purge dormant `@keyframes blink` (`show_cursor=false`). |
| **Feed Stream** | `Feed.svelte:262` | Opacity fade 650ms (`prologue-awaiting-flight`) | `app.begin_story_pending` | Coordinated storyboard card flight transition. |
| **Feed Stream** | `Feed.svelte:263` | `in:item_in` (10px gentle rise + fade) | New feed entry mount | Subtle feed choreography. |
| **Console** | `Console.svelte:143-147` | Cyan light sweep (`console-shimmer-sweep`) | `app.simulation.loading` | Background-position keyframe (view-transition safe). |
| **Console** | `StorymodeBar.svelte:145-154` | Amber pulsing dot + "QUEUED" | `pending_count > 0` | Confirms user action was accepted during turn lock. |
| **Storyboard** | `StoryboardBar.svelte` | Indeterminate `ProgressBar` + "Generating..." | `!app.models_ready` / `app.simulation.loading` | Model-download progress gate + prologue busy button. |
| **Image Gen** | `Attachments.svelte:87-92` | 3 staggered `h-2 w-2` pulsing dots | Attachment `src === null` | Unify with `<TypingDots size="md" />`. |
| **Image Gen** | `ImagePicker.svelte:153-159` | 3 staggered `h-3 w-3` pulsing dots | `candidates.length < 2` | Unify with `<TypingDots size="lg" />`. |
| **Image Gen** | `VisualWing.svelte:376-389` | Pulsing "RETRYING" / static "ERROR" | `app.visual.attempts > 0` | Exponential backoff indicator in Profile drawer. |
| **Boot Overlay** | `Skeleton.svelte:55` | 2s diagonal shimmer sweep | `!app.entities_loaded` | IndexedDB cold boot skeleton (<50ms). |
| **Profile** | `Profile.svelte:663,853` | Text pulsing "ENHANCING…" | `profile_state.busy_fields` | Field-level LLM generation indicator. |
| **Dev Telemetry** | `TelemetryCard.svelte` | Cyan dev-accent pulsing dot & `pulse-resonance` | Dev Mode enabled | Active only when Dev Mode is toggled ON. |

---

## 6. Dead Code & Accessibility Audit

1. **Dead Keyframes in `Message.svelte:607-615`:** Safe to delete unused `@keyframes scan` block left over from legacy CRT scanline experiments.
2. **Dormant Cursor in `Typewriter.svelte`:** `show_cursor` is disabled by default and `@keyframes blink` is unused.
3. **Reduced Motion Accessibility:** Ensure all pulsing dots and shimmer sweeps include `motion-reduce:animate-none` for WCAG compliance.
