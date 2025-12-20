# 🔮 Possibilities & Ideas (The "Might Do" List)

A menu of potential expansions, grouped by narrative impact.
**Legend:** `S`=Small, `M`=Medium, `L`=Large, `XL`=Epic

---

## 🕯️ Concept 1: Narrative Transparency

_Tools to visualize the invisible forces driving the story._

| Item                     | Category | Impact | Effort | Notes                                                                                                     |
| :----------------------- | :------- | :----- | :----- | :-------------------------------------------------------------------------------------------------------- |
| **Dynamics Visualizer**  | [UI]     | XL     | M      | Dashboard for `Entropy`, `Velocity`, `Permeability`, `Resonance`. Users see the narrative forces at work. |
| **Emotional Syntax**     | [Logic]  | M      | S      | Engine alters _sentence structure_ based on mood (e.g., Fear = short, breathless sentences).              |
| **Atmospheric Pacing**   | [Sim]    | M      | M      | Autonomous `Entropy` updates (Weather/Mood) based on turn count; triggers "Twists" at 100%.               |
| **Narrative Motifs**     | [Logic]  | M      | M      | Context triggers (`loc=court`) inject stylistic modifiers (`motif=lavish_food`).                          |
| **Style Drift**          | [UI]     | M      | M      | Bind CSS variables to `Entropy`; subtly distort fonts/colors as narrative chaos rises.                    |
| **Memory Density Meter** | [UI]     | S      | S      | Visual bar showing how "full" the AI's context window is.                                                 |

## ⏳ Concept 3: The Loom of Time

_Features that break the linear flow of storytelling._

| Item                    | Category  | Impact | Effort | Notes                                                                                     |
| :---------------------- | :-------- | :----- | :----- | :---------------------------------------------------------------------------------------- |
| **Narrative Branching** | [Feature] | XL     | XL     | "Multiverse" Node Graph. Branch a story from Turn X without losing the original timeline. |
| **The Lorebook (RAG)**  | [Feature] | L      | L      | Structured UI for World Info/Factions. Contextually injected via keyword triggers.        |
| **Scene Director**      | [Feature] | L      | M      | "Cutscene" toggle. Disables user input; AI generates 3 sequential beats.                  |
| **Chapter Summarizer**  | [Feature] | M      | M      | Worker runs every 50 turns to compress `<PAST>` log into narrative chapter summaries.     |
| **EPUB Export**         | [Feature] | M      | M      | Export the full story (text + images) into a book-readable format.                        |

## 🎨 Concept 4: Visual Immersion

_Enhancing the multi-modal experience._

| Item                    | Category  | Impact | Effort | Notes                                                                                 |
| :---------------------- | :-------- | :----- | :----- | :------------------------------------------------------------------------------------ |
| **Material Textures**   | [Visuals] | L      | S      | Update `VisualManager` to prompt for _textures_ (subsurface scattering, rust, weave). |
| **Reactive Triptychs**  | [Visuals] | XL     | XL     | Dynamic 3-panel spreads (Setting / Character A / Character B).                        |
| **Dynamic Expressions** | [Visuals] | M      | M      | Parse `<emotion>` tags to trigger CSS animations (shake, red tint) on portraits.      |
| **Lens Selector**       | [UI]      | M      | M      | UI dropdown for selecting camera/lighting tags (CCTV, 35mm, Drone).                   |

## 🧠 Concept 5: Living Characters

_Features that give the AI autonomy and presence._

| Item                    | Category | Impact | Effort | Notes                                                                           |
| :---------------------- | :------- | :----- | :----- | :------------------------------------------------------------------------------ |
| **Comfort Mechanism**   | [Logic]  | M      | S      | Heuristic detection of user distress; overrides Director to prioritize empathy. |
| **Dream Mode**          | [UX]     | S      | S      | Screensaver; crossfade generated images of AI "thoughts" when idle > 5m.        |
| **Neural Voice (TTS)**  | [Audio]  | L      | M      | Generate spoken audio for dialogue via AI/Browser Speech API.                   |
| **Ambient Soundscapes** | [Audio]  | M      | M      | Generate background audio loops (rain, city) based on current scene context.    |
| **Character Growth**    | [Sim]    | M      | M      | Hidden tracker for "Narrative Acts" (Recognition → Struggle → Growth).          |
| **Glitch Protocol**     | [Fun]    | S      | S      | 1% chance for AI to break character and address the Author directly.            |

---

## 🔧 Studio Maintenance & Polish

| Item                     | Category  | Impact | Effort | Notes                                                                 |
| :----------------------- | :-------- | :----- | :----- | :-------------------------------------------------------------------- |
| **Tag Management UI**    | [UI]      | M      | S      | Restore `tags` editing in the new Profile Modal.                      |
| **Theme Adaptation**     | [UI]      | S      | M      | Use `light-dark()` to support "Cyberpunk" vs "Fantasy" presets.       |
| **Custom Code Wiring**   | [Feature] | M      | M      | Connect `#custom-js` in Settings to `ContextBuilder`.                 |
| **Prompt Snapshots**     | [Testing] | S      | M      | Assert generated system prompts match a "Golden Master".              |
| **Fractal Convergence**  | [Feature] | S      | XL     | Allow entity migration/interaction between different Story instances. |
| **Code Hygiene Audit**   | [Maint]   | S      | M      | Strict `===` checks and `innerHTML` sanitization verification.        |
| **POV Style Injector**   | [Feature] | M      | S      | Define narrative voice explicitly (e.g., "Noir Detective").           |
| **Negative Constraints** | [UI]      | S      | S      | UI indicator showing _active_ negative constraints.                   |
