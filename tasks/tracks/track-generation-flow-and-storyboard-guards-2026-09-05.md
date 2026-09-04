---
id: track-generation-flow-and-storyboard-guards-2026-09-05
role: active-track
status: active
last_synchronized: 2026-09-05
classification: feature-and-ux-architecture
references:
  - scribbles.md
  - tasks/PRESENT.md
  - DESIGN.md
  - GEMINI.md
---

# 🎯 Track: Generation Flow, Speaker Avatar Thinking Indicators & Storyboard Active Session Guards

## 1.0 Vision & High-Level Architecture

Translate the core experiential concepts captured in `scribbles.md` into clean, hardened, reactive Svelte 5 architectures:

### 1.1 Generation Lifecycle & Speaker Avatar Thinking Indicator
Currently, during turn generation, the UI either waits on a generic loading state or immediately renders incoming streamed typewriter text. We will formalize a deterministic 5-stage generation lifecycle:

```text
[1. Turn Trigger] 
       │
       ▼
[2. Director Thinking] ────► Subtle feed Director shimmer indicator
       │
       ▼
[3. Speaker Delegated] ────► Speaker portrait badge appears in Feed left column
       │
       ▼
[4. Speaker Thinking]  ────► Speaker portrait displays subtle kinetic thinking pulse
       │
       ▼
[5. Prose Streaming]   ────► Chat bubble chassis spawns & Typewriter animates
       │
       ▼
[6. Stream Complete]   ────► Portrait thinking resolves & completion audio chime plays
```

### 1.2 Storyboard Active Session Guard
When the user is in the Storyboard and clicks to begin a story while a session is already active (`runtime.story_id` exists):
- Display a modal dialog presenting explicit choices:
  - **Resume Story**: Navigate directly to the ongoing storymode session.
  - **Conclude & Start New**: Gracefully conclude/archive the current session in Dexie and begin the newly selected story.
  - **Cancel**: Close the modal and remain in the Storyboard.

### 1.3 Shimmer Harmonization
- Soften aggressive image generation shimmer contrast/opacity in `src/ui/motion/Shimmer.svelte` and attachment preview cards.
- Align shimmer pulse cadence with the typewriter rhythm for visual cohesion.

---

## 2.0 Technical Architecture & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Storyboard as Storyboard / Feed
    participant Chrono as ChronoEngine
    participant Status as SimulationStateStore
    participant Pipeline as StoryPipeline
    participant Director as Director Quick Shot
    participant Audio as AudioEngine

    User->>Storyboard: Submit Action / Prompt
    Storyboard->>Chrono: advance_turn()
    Chrono->>Status: start_director_stage()
    Note over Storyboard: Director thinking shimmer visible in feed

    Chrono->>Pipeline: execute_turn()
    Pipeline->>Director: Quick Shot
    Director-->>Pipeline: Next speaker delegated (AI / NPC / Fractal)
    Pipeline->>Status: set_delegated_speaker(entity)
    Note over Storyboard: Speaker portrait pops up in left column with thinking pulse

    Pipeline->>Pipeline: Stream prose text
    Pipeline->>Status: start_stream_stage()
    Note over Storyboard: Chat bubble chassis appears; Typewriter renders text

    Pipeline-->>Chrono: Stream completed
    Chrono->>Status: complete()
    Note over Storyboard: Portrait thinking stops
    Status->>Audio: Play notification chime
```

---

## 3.0 Implementation Playbook

### Phase 1: Test-Driven Red Suite (State & Lifecycle Contracts)
- [ ] `task-1.1`: Extend `src/state/status.test.js` with failing unit tests covering fine-grained generation stages: `director_thinking`, `speaker_thinking`, `start_director_stage()`, `set_delegated_speaker()`, `start_stream_stage()`, and state resets on `complete()`.
- [ ] `task-1.2`: Extend `src/state/chrono.test.js` with tests verifying state transitions from Director Quick Shot initiation to speaker delegation and stream completion.

### Phase 2: Simulation State Machine Hardening (GREEN)
- [ ] `task-2.1`: Update `src/state/status.svelte.js` to add private runes `#director_thinking` and `#speaker_thinking` with getters/setters, lifecycle methods (`start_director_stage`, `set_delegated_speaker`, `start_stream_stage`, `complete`), and derived helper properties.
- [ ] `task-2.2`: Wire stage transitions in `src/state/chrono.svelte.js` and `src/intelligence/story-pipeline.js` ensuring `set_delegated_speaker` is called as soon as Director Quick Shot finishes and before streaming begins.

### Phase 3: Feed & Speaker Thinking Indicator UI (GREEN)
- [ ] `task-3.1`: Create or integrate a pending turn indicator slot in `src/ui/message/Feed.svelte` that activates during `simulation_state.busy` when streaming content is not yet committed to `visible_feed`.
- [ ] `task-3.2`: Render the Director thinking shimmer when `simulation_state.director_thinking`.
- [ ] `task-3.3`: Render the speaker portrait in the left gutter when `simulation_state.generating_entity` is populated, with kinetic signature-color thinking indicator animation.
- [ ] `task-3.4`: Transition into `Message.svelte` chassis when typewriter streaming starts, ensuring completion chime triggers on typewriter finish.

### Phase 4: Storyboard Active Story Guard Dialog (GREEN)
- [ ] `task-4.1`: Add unit tests for active story guard logic in `src/ui/storyboard.test.js` or `src/ui/Storyboard.svelte.test.js`.
- [ ] `task-4.2`: Update `src/ui/console/StoryboardBar.svelte` and `src/ui/storyboard.svelte.js` to trigger a confirmation Dialog when attempting to begin a story while `has_active_story` is true.
- [ ] `task-4.3`: Implement the 3 actions: Resume Story, Conclude & Start New, and Cancel.

### Phase 5: Shimmer Harmonization & Verification
- [ ] `task-5.1`: Tune `src/ui/motion/Shimmer.svelte` gradient opacity and animation timing to soften harsh visual sweep.
- [ ] `task-5.2`: Run full test suite (`npm run verify`), ensure 0 linter errors, 0 Svelte diagnostics, and clean single-file production build (`npm run build`).

---

<!-- CHANGELOG
  - 2026-09-05: Initialized track file adhering to Universal File Architecture, defining 5-stage generation lifecycle, speaker thinking indicators, storyboard active story guard dialog, and shimmer harmonization per scribbles.md.
-->
