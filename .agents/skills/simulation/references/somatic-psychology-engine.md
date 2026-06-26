# RPGlitch Somatic Psychology & Trauma Engine (SPTE)

---

## 1. Executive Summary

This reference document outlines the technical specification for RPGlitch’s **Somatic Psychology & Trauma Engine (SPTE)**. It defines how internal variables (dynamic emotional states, trauma cascades, resource constraints, and active goals) are dynamically translated into observable, physical actions and dialogue patterns.

The outputs of this engine are designed to be processed by the **2-Shot Architecture** (detailed in `inner-voice-research.md`), acting as the bridge between internal state calculations and final prose generation.

---

## 2. Empathy Reading & Cognitive Styles

The engine tracks user input pacing to dynamically calibrate the character's internal processing style and resource decay.

### 2.1 Pacing Adaptation
* **Short/Sharp Sentences** in user input signal high stress or rapid action.
  * *System Action*: Lock focus, decay `regulation` resource, trigger shorter prose sentences in Shot 2.
* **Long/Wandering Sentences** in user input signal comfort or reflection.
  * *System Action*: Accelerate `will` recovery, trigger complex, descriptive sentence structures in Shot 2.
* **Silence/Delay** signals disengagement or emotional overwhelm.
  * *System Action*: Nudge the Director's priority toward information-seeking goals (`G_Test_Trustworthiness`).

### 2.2 Cognitive Styles
Linguistic styling is modulated dynamically based on resource and belief thresholds:

| Trigger State | Active Cognitive Style | Prose Modifiers |
| :--- | :--- | :--- |
| `regulation` < 3 | **Dysregulated / Frantic** | Fragmented, looping internal voice, high repetition |
| `anxiety` > 0.7 | **Catastrophizing** | Run-on thoughts, hyper-detailed environment scanning |
| `trust` > 0.8 | **Grounded / Sensory** | Present-focused, rich tactile descriptions, relaxed pacing |

### 2.3 The Naivety Prior & Trust Calibration
To model believable social interactions, the engine supports a **Naivety Index**. This calibrates how easily an NPC accepts incoming social evidence:
* **The Naivety Prior (`openness` axis)**: Defines baseline credulity. High openness (naive) maps to a high prior for user honesty; low openness (cold skeptic) sets a high prior for deception.
* **Evidence Triggers**: Persuasive or manipulative user inputs (e.g., "I swear," "trust me") act as social evidence. Skeptical NPCs require stronger, accumulative evidence (`consistency` over time) to shift their trust posteriors, while naive NPCs update their beliefs rapidly on a single assertion.

### 2.4 Stress Accumulation & Cognitive Load
As stress (`anxiety` or trauma triggers) accumulates, the character's cognitive load increases, causing predictable processing collapses:
* **Tunnel Vision**: The narrative focus narrows strictly to immediate physical threats or dominant sensory stimuli. Abstract thoughts and complex planning are ignored.
* **Regulation Failure**: Resources decay rapidly. Emotional volatility spikes (e.g., anger, fear), leading to erratic goal prioritization.
* **Memory Fragmentation**: High-arousal states disrupt access to semantic memory. The character suffers from spotty recall or intrusive, raw sensory memories.

---

## 3. The Trauma Cascade System

Trauma reactions are modeled as sudden, non-linear overrides of the character's normal goal hierarchy, triggered by specific environmental inputs or linguistic cues.

```
[Trigger Word Detected] ──> [Trauma Cascade Evaluated] ──> [Somatic & Goal Override]
```

### 3.1 Trauma Catalog & Core Triggers

#### Betrayal (Severity: 0.8)
* **Triggers**: `deception`, `broken promise`, `inconsistency`, `change of mind`.
* **Cognitive Shift**: Elevate `P_Hidden_Agenda` belief by +0.15 instantly.
* **Somatic Manifestation**: *throat constricted, hands cold*.
* **Goal Hijack**: Force `G_Maintain_Safety` to primary priority.

#### Abandonment (Severity: 0.9)
* **Triggers**: `leave`, `withdraw`, `ignore`, `distance`.
* **Cognitive Shift**: Elevate `P_Will_Abandon` belief to maximum.
* **Somatic Manifestation**: *stomach hollow, chest tight*.
* **Goal Hijack**: Force `G_Avoid_Vulnerability` to primary priority.

#### Emotional Neglect (Severity: 0.6)
* **Triggers**: `dismiss`, `minimize`, `overreacting`, `not a big deal`.
* **Cognitive Shift**: Lower `P_Genuine_Care` belief by -0.2.
* **Somatic Manifestation**: *numbness, flat voice, eye avoidance*.

#### Shame-Based Abuse (Severity: 0.9)
* **Triggers**: `judgment`, `criticize`, `weird`, `pathetic`, `wrong`.
* **Cognitive Shift**: Half the `P_Deserving_Love` belief.
* **Somatic Manifestation**: *shoulders hunched, head down, protective self-touching*.

### 3.2 Bayesian Attachment Priors & Belief States
Characters do not hold static trust scores. Their expectations are governed by a Bayesian belief system seeded by their **Attachment Style**:
* **Secure Attachment**: Sets balanced priors that favor safety and trust ($P(H_{Trustworthy}) \approx 0.60$, $P(H_{Untrustworthy}) \approx 0.10$).
* **Anxious Attachment**: Sets high priors for abandonment and rejection ($P(P\_Will\_Abandon) \approx 0.85$, $P(P\_Genuine\_Care) \approx 0.25$).
* **Avoidant Attachment**: Sets low priors for vulnerability and high priors for hidden agendas ($P(P\_Safe\_Vulnerable) \approx 0.15$, $P(P\_Hidden\_Agenda) \approx 0.70$).
* **Disorganized Attachment**: Characterized by high entropy (uncertainty) and conflicting priors across all domains.

#### Goal Arbitration Formula
Goal priority is dynamically recalculated using the current posterior probabilities of core beliefs:
$$\text{Goal Priority}(G) = \text{Base Weight}(G) \times \sum (P(H_i) \times w_i)$$
*Example:* 
$$\text{Priority}(G\_Avoid\_Vulnerability) = 8 \times P(P\_Will\_Abandon) \times P(P\_Hidden\_Agenda)$$
A sharp rise in abandonment probability instantly shifts the entire goal hierarchy, forcing avoidant behaviors to override connection drives.

---

## 4. The Somatic Engine (Show, Don't Tell)

To respect the **AI Character Protocol** (*"Internal mechanics MUST stay invisible to the narrative output"*), characters must never declare their variables explicitly. Instead, the Director selects physical tells based on state thresholds:

```xml
<SOMATIC_MAPPING>
  <map state="emotions.fear > 0.6" tell="cold sweat, shallow breathing, jaw tensing"/>
  <map state="emotions.joy > 0.5" tell="relaxed shoulders, open posture, warm gaze"/>
  <map state="goals.active == 'G_Seek_Connection'" tell="leaning subtly forward, hands unclenching"/>
  <map state="emotions.shame > 0.5" tell="avoiding eye contact, fingers fidgeting with fabric"/>
  <map state="regulation < 3" tell="restless pacing, voice dropping to flat pitch"/>
</SOMATIC_MAPPING>
```

### 4.1 Masking vs. Somatic Leakage
When goals conflict (e.g., a character wants to connect but fears vulnerability), they employ cognitive defense mechanisms:
* **The Social Mask**: The character consciously attempts to project stability or cooperation (e.g., forced smiles, polite dialogue).
* **Somatic Leakage**: The body betrays the mask. Underneath the polite words, the underlying tension leaks through involuntary physical tells (e.g., voice cracking, micro-stutters, hand trembles, erector pili contraction, or pupils dilating).

---

## 5. Perception Physics & Boundary Rules

To enforce narrative realism and prevent "AI slop," the engine operates under strict physical and informational boundaries:

### 5.1 Horizon Convergence & Null Data
* **No Mind-Reading**: The narrative scope is strictly constrained to the character's immediate sensory field. The user's unvoiced thoughts, plans, or hidden actions are treated as **Null Data** (unavailable for processing).
* **Material Observation**: The character perceives others exclusively as collections of physical signals (tone of voice, micro-expressions, posture, silence duration). These signals are then processed through the character's internal cognitive biases (e.g., paranoia or insecurity).

### 5.2 Epistemic Physics
* **Information Vectors**: Knowledge is treated as a physical object. It must travel via a specific vector (sight, sound, written letter, or direct gossip) to reach an NPC. If no vector has carried the data to the NPC, the information does not exist for them.

---

## 6. Kinetic Handoff & Dominant Hooks

Prose pacing must encourage active player agency and maintain unresolved dramatic tension.

### 6.1 Critical Handoff (Risk Action Ceding)
When the user initiates a high-stakes action (e.g., an attack, a confrontation, or a seduction attempt), the engine must:
1. Describe the **initiation** and **sensory build-up** from the character's perspective.
2. Stop immediately before the outcome is decided.
3. **Cede** the resolution of the action back to the user, allowing them to dictate the consequences.

### 6.2 Dominant Hooks
Every turn must end with an active hook that forces the scene forward. Avoid passive wait-states. Instead, assert one of the following:
* **[Statement]**: Declare a decisive, challenging decision.
* **[Action]**: Execute a physical movement that shifts the environment.
* **[Hover]**: Freeze the description at the moment of highest sensory tension (e.g., a hand hovering over a blade).
* **[Silence]**: Deliberately stop speaking, forcing the user to fill the awkward void.
