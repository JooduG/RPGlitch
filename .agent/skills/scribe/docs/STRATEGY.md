# 🧠 Intelligence Strategy: Passive Context vs. Active Retrieval

> **The Red Thread:** Why passive context (README/AGENTS.md) often outperforms on-demand skill retrieval for horizontal knowledge.

## 1. The Decision-Point Problem

Evals show that in **56% of cases**, agents fail to invoke available skills even when relevant. This is a "Decision-Point" failure—the agent must realize it needs help before it can get it.

## 2. The Solution: Passive Context Indexes

Instead of relying solely on active retrieval, embed a **compressed docs index** directly in `AGENTS.md` (or equivalent persistent context).

### Advantages

- **Zero Decision-Point**: The information is already in the system prompt. No "should I look this up?" moment.
- **Consistent Availability**: Content is present for every turn, preventing "forgetfulness" in long conversations.
- **No Sequencing Risks**: Avoids the "explore first vs. read docs first" ordering fragility.

## 3. The Performance Gap

| Configuration          | Pass Rate | Key Finding                                                    |
| :--------------------- | :-------- | :------------------------------------------------------------- |
| **Baseline (No Docs)** | 53%       | Outdated training data leads to hallucinations.                |
| **Skill (Triggered)**  | 79%       | Brittle; sensitive to exact trigger wording.                   |
| **AGENTS.md Index**    | **100%**  | Perfect synergy between project exploration and doc retrieval. |

## 4. Implementation Formula

For frameworks or large libraries (e.g., Next.js 16, Svelte 5):

1. **Compress**: Minify the docs index down to < 10KB.
2. **Inject**: Place the index in `AGENTS.md`.
3. **Directive**: Instruct the agent: _"Prefer retrieval-led reasoning over pre-training-led reasoning."_
4. **Retrieve**: Let the agent use `cat` or `Read` to fetch full content from the local `.docs/` folder based on the index.

## 5. Conclusion

Skills are for **Actionable Verticals** (e.g., "Upgrade Project", "Generate Asset").
Passive Indexes are for **Horizontal Truth** (e.g., "How does this framework work?").
A premium agent uses both.
