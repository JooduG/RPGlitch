# 👁️ Mesmer: Diegetic Immersion Protocol

RPGlitch uses **Diegetic Immersion**—UI elements that exist _within_ the fiction of the scene, treated as actual objects by characters and the system.

## 📟 1. Diegetic UI Types

When the AI renders an object for user interaction, it must follow one of the established container patterns:

| Type       | Name                 | Purpose                                               |
| :--------- | :------------------- | :---------------------------------------------------- |
| **Type A** | **The Viewport**     | For reading text (Books, terminals, letters).         |
| **Type B** | **The Interactable** | For hidden checks (Chests, envelopes, doors).         |
| **Type C** | **The Construct**    | For non-physical items (Magic, holograms, artifacts). |

## 📐 2. Implementation Rules

- **Inline Isolation:** All diegetic UI must use **inline styles**, ensuring components remain decoupled from the global CSS and portable across sessions.
- **Narrative Anchoring:** The UI should never be "just a button." It must be described in the prose before appearing as an interactive element.
- **Minimalist Feedback:** Interactions should use subtle, atmospheric feedback (Chalk Regime colors) rather than traditional "gamey" UI alerts.
