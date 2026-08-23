# Suggestion: Attachment Style Archetypes & Relational Trajectories

> **Status:** Backlog Proposal  
> **Domain:** Entity Schemas, Relational Epistemology & Interpersonal Dynamics  
> **Scope:** 4 Attachment Schemas (`secure`, `anxious`, `dismissive`, `fearful_avoidant`), Threat Reactions, Defense Mechanisms, Recovery Curves  

---

## 1. Core Thesis

While RPGlitch evaluates momentary physical tells via `evaluate_automatic_somatics`, entities lack an explicit model for processing interpersonal threat and emotional recovery over multi-turn scenes. 

Adding an explicit `attachment_style` to character entities establishes predictable emotional gravity, authentic friction, and calibrated relationship trajectories.

---

## 2. Entity Schema Extension

```javascript
/**
 * @typedef {"secure" | "anxious" | "dismissive" | "fearful_avoidant"} AttachmentStyle
 */
```

### Schema Integration Points
- **`src/data/definitions/fragments.js`**: Add `attachment_style` to `ENTITY_FRAGMENTS.ETERNAL.NON_PHYSICAL` metadata schema.
- **`src/data/normalizer.js`**: Default fallback (`"secure"` for baseline, or `undefined` for unassigned).

---

## 3. Archetype Behavioral Matrix & Threat Responses

| Attachment Style | Relational Threat Reaction | Defense Mechanism | Recovery Curve |
| :--- | :--- | :--- | :--- |
| **`secure`** | Direct boundary assertion; proportional friction without panic. | Seeks collaborative clarification and objective truth. | **Fast Equilibrium**: Restores baseline stability within 1 turn. |
| **`anxious`** | Hyper-vigilance, reassurance-seeking, verbal over-explaining. | Clings or raises emotional stakes to force engagement. | **Affirmation-Dependent**: Requires positive validation to lower `chaos`/`intensity`. |
| **`dismissive`** | Cold emotional detachment, intellectualization, silence. | Physical/spatial withdrawal; drops `openness` toward 0. | **Slow Latency**: Recovers baseline only when left unpressured. |
| **`fearful_avoidant`** | Volatile oscillation between desperate proximity and hostility. | Severe somatic friction (tremors, abrupt flight, lash-outs). | **Volatile Relapse**: Prone to re-triggering under perceived rejection. |

---

## 4. Prompt Synthesis & Dynamics Integration

1. **Director Evaluation (`prompts.js`)**:
   - In `render_director`, provide character attachment styles to steer relational delta suggestions.
2. **Character Expression (`render_character`)**:
   - When an entity's `attachment_style` is defined, inject its behavioral defense rule into `<TASK>` as an implicit behavioral anchor.
3. **Dynamics Settlement (`dynamics.js`)**:
   - Use recovery curve weights during `settle_physics` to govern how quickly `intensity` and `chaos` return toward resting baseline.
