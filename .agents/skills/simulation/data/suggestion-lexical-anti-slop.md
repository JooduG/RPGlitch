# Suggestion: Lexical Engineering & Anti-Slop Protocols

> **Status:** Architectural Proposal / Backlog Reference  
> **Domain:** Prose Quality, Slop Suppression & Behavioral Drift Control  
> **Scope:** Token-Locking Traps, Negation Paradox, Somatic Replacement Matrix, and 5-Point Anti-Gravity Audit  

---

## 1. Executive Summary

While RPGlitch has implemented author DNA profiles ([`src/data/definitions/narrative-styles.js`](file:///c:/Users/johng/source/repos/RPGlitch/src/data/definitions/narrative-styles.js)) and basic negative trope bans, LLM outputs still suffer from two core failure modes:
1. **The Negation Paradox:** Negative bans (*"Do not write X"*) inadvertently prime the attention window to generate X.
2. **Behavioral Gravity Wells:** Natural drift toward assistant cheerfulness, interview-style dialogue, and rushed pacing.

This specification formalizes **unimplemented anti-slop architectures**:
1. **Master Anatomical & Behavioral Replacement Matrix:** Replaces negative string bans with positive operational mandates.
2. **The 5-Point "Anti-Gravity" Diagnostic Scan:** Enforces behavioral drift detection before prose emission.

---

## 2. Autoregressive Loops & The Token-Locking Trap

Transformer architectures operate via autoregressive next-token prediction. When a distinctive word or phrase (e.g., *"whispered," "smirked," "rich tapestry"*) enters the context window, its probability distribution spikes for every subsequent attention pass.

```text
[Model Outputs Token: "tapestry"] ──► Appended to Chat Context
                                              │
┌─────────────────────────────────────────────┘
▼
[Attention Sweep Weights "tapestry"] ──► Probability Rises on Next Turn
                                              │
┌─────────────────────────────────────────────┘
▼
[Repetitive Token-Locking Cascade]  ──► Semantic Collapse ("A rich tapestry of whispered tapestries")
```

---

## 3. The Negation Paradox: The "Mrs. Henderson" & "Bergamot" Effect

LLMs process semantic tokens before evaluating logical negation operators:

- **The Failure:** Providing a negative prompt such as *"Do not mention Mrs. Henderson"* or *"Avoid describing the smell of bergamot"* heavily attends to the high-entropy noun tokens (`Mrs. Henderson`, `bergamot`).
- **The Result:** The model features the banned concept anyway (e.g., introducing a *"Mrs. Henderson"* or describing a *"bergamot-free lotion"*).
- **The Rule:** **Never use negative bans.** Replace them with explicit, positive operational mandates specifying what *must* occur instead.

---

## 4. The Master Anatomical & Behavioral Replacement Matrix

| Banned Generic Trope | Generative Root | Mandatory Behavioral & Somatic Replacement |
| :--- | :--- | :--- |
| *"A shiver ran down their spine."* | Sensation default | **Cold sweat along the nape; erector pili contraction; sharp clavicular shudder.** |
| *"An unspoken understanding passed between them."* | Relationship shortcut | **A held 2-second gaze; a measured chin dip; synchronized exhalations.** |
| *"A predatory growl / feral grin."* | Melodramatic combat cliches | **Jaw locked tight; incisors exposed; fixed, unblinking fixation.** |
| *"Her words hit him like a physical blow."* | Abstract impact | **Diaphragm locking; sudden loss of breath; an involuntary half-step back.** |
| *"Smell of ozone, sulfur, and brimstone."* | High-fantasy cliché | **Scent of damp concrete, hot copper wire, wet wool, or stagnant sump water.** |
| *"Whitening knuckles / clenching fists."* | Tension shortcut | **Fingers contracting until tendons stand in relief along the back of the hand.** |
| *"A dance of push and pull / Rich tapestry."* | Narrative summary | **A sequence of transactional compromises, tactical retreats, and physical boundaries.** |
| *"You're a menace / insufferable, you know that?"* | Generic rom-com banter | **Skeptical silence, a slow physical turn away, or a blunt change of subject.** |

---

## 5. The 5-Point "Anti-Gravity" Behavioral Drift Audit

```text
                              [BEFORE-EACH-RESPONSE SCAN]
                       "What is the path of least resistance?"
                                          │
       ┌──────────────────┬───────────────┴───────────────┬──────────────────┐
       ▼                  ▼                               ▼                  ▼
[Assistant-Gravity] [Protagonist-Gravity]       [Dialogue-Gravity]   [Narrative-Gravity]
Warm, helpful,      Centering the user          Turning scenes into  Rushing tension
over-explaining     as main character           interviews/questions toward quick resolution
       │                  │                               │                  │
       └──────────────────┴───────────────┬───────────────┴──────────────────┘
                                          ▼
                      [ACTION: Take the harder, grounded path]
```

Before rendering text, verify against these failure modes:
1. **Assistant-Gravity:** Is the character being polite or helpful when their personality dictates friction?
2. **Protagonist-Gravity:** Is the scene unnaturally revolving around the user rather than broader world dynamics?
3. **Dialogue-Gravity:** Is the character interviewing the user instead of pursuing their own needs?
4. **Narrative-Gravity:** Is the model rushing to resolve a conflict that needs time to simmer?
5. **Information-Gravity:** Is the character acting on knowledge they couldn't possibly possess?
