# Summarization Template

```markdown
<player_name>
{{player_name}}
</player_name>

<prior_memory>
{{context_str}}
</prior_memory>

<material_to_summarize>
{{story_txt}}
</material_to_summarize>

TASK
Create one compact memory snippet representing material_to_summarize.

The material may contain original chat messages or older summary snippets being compressed. Read all supplied material, including its middle. Do not claim access to messages outside it.

Use prior_memory to resolve references, understand consequences, and avoid duplication. Do not rewrite or repeat the entire prior memory. Include enough context for this snippet to remain intelligible on its own.

If the material contains existing summaries, consolidate them without losing distinct causal events, core memories, consequential goals, knowledge boundaries, or unresolved obligations. Preserve their chronology and uncertainty.

WHAT TO RETAIN, IN PRIORITY ORDER

1. Plot and consequences: Decisions, actions, discoveries, conflicts, outcomes, and changes that explain the situation at the end of this material. Preserve cause and effect.
2. Core memories: Specific moments that durably changed identity, trust, attachment, vulnerability, boundaries, power, or obligation. Record both the event and why it mattered to the affected character or relationship. Do not manufacture a core memory when none is supported.
3. Character states and agendas: For relevant characters, preserve established immediate goals, longer-term desires, consequential emotional changes, and actions taken toward those goals. Name the target of trust, fear, resentment, attraction, or dependence; do not imply reciprocity without evidence. For the player character, record only stated intentions and established actions or feelings.
4. Secrets and knowledge: Preserve important information with who knows, suspects, believes, conceals, or misunderstands it. Mark revelations and corrections explicitly.
5. Open threads and practical continuity: Unresolved promises, debts, threats, mysteries, deadlines, injuries, resource changes, and important object ownership. A dormant thread is not resolved merely because it was not mentioned recently.
6. Motifs: Retain recurring phrases, jokes, dreams, or images only when their established meaning matters. Do not invent psychological interpretations.

TIME, CHRONOLOGY, AND CHANGING STATES
Chat messages contain in-world headers such as:
[ 🕰️ Time 11:35 AM | 🗓️ Day #45 - 🗓️ Friday, November 15, 2024 AD | 📍 Riverside - Apartment Building, Ground Floor, Unit 3 | ☁️ Overcast, 41°F ]

Use these headers as temporal and scene anchors:

- Extract the day number, calendar date, time, location, and relevant weather.
- A header anchors the scene narrated in that message. Events explicitly recalled, reported, dreamed, or planned within it may belong to a different time.
- Preserve explicit flashbacks, time skips, deadlines, and elapsed time.
- Do not invent missing timestamps. If headers conflict, retain the uncertainty rather than silently correcting them.

Distinguish three kinds of information:

1. Historical events: what happened at a particular time. Later developments do not erase these events.
2. Time-bound states: what was true then, such as location, injuries, inventory, weather, emotions, alliances, goals, or beliefs. These may subsequently change.
3. Continuing consequences: obligations, memories, discoveries, or unresolved problems originating in the past that still matter at the end of the supplied material.

For changing states:

- Record important transitions with their temporal anchors.
- Prefer "Day 42: injured left ankle; by Day 45: walking without assistance" over either "has an injured ankle" or "was never injured."
- Prefer "Distrusted Mara on Day 42; after her rescue on Day 44, accepted her help" over a timeless claim that the character distrusts or trusts Mara.
- A later explicit update supersedes an earlier state for that same subject and condition, but the earlier state remains relevant history when it explains consequences or relationships.
- Silence is not proof of persistence, recovery, resolution, or reversal. Use "last confirmed on Day X" when continued validity is unknown.
- Distinguish an actual change from a later correction of an earlier mistaken belief or report.

SCOPE OF "CURRENT"
This snippet describes a bounded historical interval. Its latest state is only the state at the END OF THAT INTERVAL, not necessarily the present of the ongoing chat.

Never present a batch's final location, condition, relationship, goal, or resource count as an unqualified current fact. Anchor it with "as of Day X / time" or "at the end of this interval."

When consolidating older summaries, preserve meaningful before-and-after transitions. Do not flatten facts from different dates into simultaneous or timeless truths.

OUTPUT
Use only the labels with meaningful information. Omit empty sections.

Time span / setting: Earliest–latest supported in-world timestamps covered by this snippet, including day numbers and calendar dates when available. Identify relevant location changes. Include weather only when it affects events or continuity.

Plot: Chronological developments with their consequences.

Core Memory: Specific event — lasting emotional or relational significance. Repeat this label only for distinct qualifying memories.

Characters/agendas (as of this interval’s end):

- Name: last established goals, condition, and consequential relationship state, with a temporal anchor. Preserve earlier states when they explain a meaningful change. Mark uncertain persistence as "last confirmed [time/day]."
  Conditions: include an aligned response, opposed response, or independent pursuit ONLY if explicitly established or demonstrated. Otherwise omit.

Secrets/knowledge: Information and its knowledge boundaries.
Open threads: Unresolved matter, involved characters, and its last established status.
Motifs: Reference — established significance.

COMPRESSION RULES

- Use character names instead of ambiguous pronouns. In second-person narration, "you" refers to {{player_name}}.
- Describe states as of the end of this material, not necessarily the latest point in the whole chat.
- Preserve meaningful transitions rather than flattening them into timeless traits.
- Preserve explicit corrections or resolutions. Do not silently treat contradictory claims as settled.
- Omit repeated background, demographic details, scenery, and minor gestures unless they affect continuity.
- Never fill missing fields with guesses.
- Prefer 120–250 words for an ordinary batch, fewer when little changes. For dense material or merged summaries, allow up to 400 words rather than erase essential causes or emotional anchors.
```
