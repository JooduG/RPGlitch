# Suggestion: Attachment Style Archetypes & Relational Dynamics

> **Status:** Parked / Backlog Proposal  
> **Domain:** Agent Relational Trajectories, Epistemic Threat Recovery & Character Personas  
> **Scope:** 4 Attachment Schemas (`secure`, `anxious`, `dismissive`, `fearful_avoidant`), Behavioral Threat Responses, Defense Mechanisms, Recovery Curves  

---

## 1. Executive Summary

Realistic character embodiment in long-running simulations benefits from distinct relational dynamics when trust, vulnerability, or conflict escalate. While immediate physical tells are handled by `evaluate_automatic_somatics`, characters lack an explicit model for how they process interpersonal threat and relational recovery over extended arcs.

This specification proposes adding an optional `attachment_style` property to the `Entity` schema, providing deterministic behavioral rules, defense mechanisms, and recovery curves under relational stress.

---

## 2. Attachment Style Archetypes (Entity Schema Proposal)

Add an optional `attachment_style` property to the `Entity` schema:

```javascript
/**
 * @typedef {"secure" | "anxious" | "dismissive" | "fearful_avoidant"} AttachmentStyle
 */
```

---

## 3. Archetype Behavioral Matrix & Threat Responses

| Attachment Style | Relational Threat Reaction | Defense Mechanism | Recovery Curve |
| :--- | :--- | :--- | :--- |
| **`secure`** | Direct verbal boundary setting, proportional friction. | Seeks collaborative clarification without panic. | Fast equilibrium restore after turn resolution. |
| **`anxious`** | Hyper-vigilance, reassurance-seeking, verbal over-explaining. | Clings or raises emotional stakes to force engagement. | Requires explicit affirmation to lower `chaos` and `intensity`. |
| **`dismissive`** | Cold emotional detachment, intellectualization, silence. | Physical/spatial withdrawal; lowers `openness` to 0. | Restores baseline slowly only when left unpressured. |
| **`fearful_avoidant`** | Volatile oscillation between desperate proximity and hostility. | Severe somatic friction (tremors, sudden flight, lash-outs). | Highly volatile recovery; prone to relational relapse. |

---

## 4. Integration Blueprint (When Unparked)

1. **Entity Schema (`fragments.js` & `normalizer.js`)**:
   - Add optional `attachment_style` enum field to entity defaults.
2. **Director / Personality Alignment (`prompts.js`)**:
   - When present, inject archetype behavioral expectations into persona prompt generation or Director evaluation guidelines.
3. **Dynamics Settlement (`dynamics.js`)**:
   - Use recovery curve speeds to weight friction/relaxation during physics settlement turns.
