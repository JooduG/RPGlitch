# Spec: Emotional Half-Life Protocol

## Vision Alignment

- **Recursive Intelligence**: Replacing rigid memory decay with semantic persistence ensures the AI's understanding naturally surfaces historically resonant themes (trauma, betrayal) without manual intervention, aligning perfectly with the Red Thread.

## Feature Overview

Implement a weighted memory system (W=1 to 10) to replace the strict 3-turn beat-map memory decay. High-weight (highly emotional/consequential) turns dynamically migrate to synthetic "Past" or "Present" entity context rather than vanishing, directly enforcing the MNOTION framework weights.

## Acceptance Criteria

- [ ] MNOTION-aligned semantic mapping (W=1..10) exists, using static regex/keyword heuristics (Zero LLM overhead).
- [ ] Turn payloads are automatically annotated with their emotional weights.
- [ ] `intelligence_broker.js` selectively elevates W>=8 turns out of standard history and injects them into entity fragments.
- [ ] Performance limits (bucket caps) prevent context token bloat over lengthy sessions.
