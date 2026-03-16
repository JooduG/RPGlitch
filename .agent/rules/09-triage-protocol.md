# í³‹ Rule: Issue Triage Protocol (v4.0)

## 1. Labeling Principles
- **Precision over Coverage**: Better to apply no label than an incorrect one.
- **Semantic Mapping**: 
    - `kind/bug`: Contradicts docs or expected behavior.
    - `kind/enhancement`: New functionality or improvement.
    - `priority/p1`: Security, Data Loss, Crash, or Outage.
- **Signal-to-Noise**: Aim for 1-3 labels.

## 2. Output Specification (Scheduled/Bulk)
When running in scheduled/bulk mode, you MUST produce a single, minified JSON array written to the environment.
- **Keys**: `issue_number` (int), `labels_to_set` (string[]), `explanation` (string).
- **Explanation Requirement**: Cite specific keywords from the title or body.
- **Constraint**: No conversational filler. Only the JSON array.
