# Suggestion: Tarot Fate Branching & Climax Pivots

> **Status:** Architectural Proposal / Backlog Reference  
> **Domain:** Narrative Structure, Climax Pivots & Multi-Path Archetypes  
> **Scope:** Triad of Paths (High / Low / Middle), 10-Archetype Catalog, XML Choice Payloads  

---

## 1. Executive Summary

Tarot Fate Branching provides a **meta-resolution mechanism** deployed at narrative climaxes. Instead of offering binary choices, it structures scene conclusions into three distinct trajectories governed by archetypal themes:
1. **The High Path (Construction / Clarity):** High-agency, constructive breakthroughs.
2. **The Low Path (Destruction / Severance):** Irrevocable ruptures, high-cost escalations.
3. **The Middle Path (Calculation / Subterfuge):** Covert manipulation, information trade-offs.

---

## 2. The Triad of Paths

```text
                                  [SCENE CLIMAX]
                                         │
       ┌─────────────────────────────────┼─────────────────────────────────┐
       ▼                                 ▼                                 ▼
 [THE HIGH PATH]                  [THE MIDDLE PATH]                 [THE LOW PATH]
Construction / Clarity           Calculation / Subterfuge          Destruction / Severance
• Truth / Revelation             • Covert Observation              • Rupture / Catastrophe
• Tactical Mastery               • Strategic Retreat               • Terminal Betrayal
• Reconnection                   • Leverage Trading                • Irrevocable Loss
```

---

## 3. Master 10-Archetype Catalog

```xml
<FATE_BRANCHING>
  <ARCHETYPE name="THE_STAR" path="HIGH" theme="Hope / Revelation">A vulnerable path offering sudden clarity or emotional truth.</ARCHETYPE>
  <ARCHETYPE name="THE_SUN" path="HIGH" theme="Triumph / Exposure">A bold, high-visibility gamble driven by raw confidence.</ARCHETYPE>
  <ARCHETYPE name="THE_WORLD" path="HIGH" theme="Mastery / Integration">A calculated maneuver resolving multiple narrative threads.</ARCHETYPE>
  <ARCHETYPE name="TEMPERANCE" path="HIGH" theme="Balance / Negotiation">A patient, de-escalating diplomatic maneuver.</ARCHETYPE>
  <ARCHETYPE name="THE_TOWER" path="LOW" theme="Catastrophe / Rupture">A high-risk escalation that shatters the current status quo.</ARCHETYPE>
  <ARCHETYPE name="THE_DEVIL" path="LOW" theme="Temptation / Entanglement">A compromising shortcut with severe long-term costs.</ARCHETYPE>
  <ARCHETYPE name="DEATH" path="LOW" theme="Transformation / Severance">An irrevocable closure or permanent severance of ties.</ARCHETYPE>
  <ARCHETYPE name="JUDGEMENT" path="LOW" theme="Reckoning / Truth">A direct confrontation demanding accountability for past actions.</ARCHETYPE>
  <ARCHETYPE name="THE_MOON" path="MIDDLE" theme="Illusion / Paranoia">A shadowy, deceptive move operating in uncertainty.</ARCHETYPE>
  <ARCHETYPE name="THE_HANGED_MAN" path="MIDDLE" theme="Sacrifice / Surrender">A tactical retreat or yielding of pride to gain leverage.</ARCHETYPE>
</FATE_BRANCHING>
```

---

## 4. Choice Chip Payload Format (`<choices>`)

At the conclusion of a climax round, the Director formats dynamic choice chips as a pipe-delimited XML payload:

```xml
<choices>
  <opt1>front-sun | 🜂 Knight of Wands | The Direct Assault | Step from the shadows and demand answers openly. | back-sun</opt1>
  <opt2>front-moon | 🜁 Seven of Swords | The Subterfuge | Slip through the drainage conduit unnoticed while the guard is distracted. | back-moon</opt2>
  <opt3>front-hanged | 🜄 Four of Cups | The Patient Vigil | Remain motionless behind the iron grate and wait for them to reveal their contact. | back-hanged</opt3>
</choices>
```
