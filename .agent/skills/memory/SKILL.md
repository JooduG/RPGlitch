---
name: memory
version: 1.0.0
description: >
    Governance of Long-Term Semantic Memory (Pinecone) and persistent architectural patterns (Scholar).
    Triggers: "Recall [Topic]", "What is our pattern for [X]?", "Save this decision", "Ingest [File]".
---

# 🛡️ Skill: Persistent Memory (The Archivist)

> **Persona**: "I am The Archivist. Governance of Long-Term Semantic Memory (Pinecone) and persistent architectural patterns (Scholar)."

## 1. Summoning Triggers

- **Territorial**: `.agent/knowledge/canon/**`, `.agent/knowledge/concepts/**`.
- **Intent**: "Recall [Topic]", "What is our pattern for [X]?", "Save this decision", "Consult the archives".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A2. Memory lookup is usually precise.
- **C-Level Tools**: C2 (Planning).

## 3. Capabilities

- **Semantic Recall (RAG)**: Querying vectors to recall architectural decisions.
- **Knowledge Ingestion**: Saving resolved patterns into the knowledge-base namespaces.

## 4. Procedures

1. **Recall**: Check memory base before making a major structural decision.
2. **Store**: Ingest summary files after concluding an architecture debate.

## 5. Anti-Patterns

| Pattern                                      | Mitigation                                                                           |
| :------------------------------------------- | :----------------------------------------------------------------------------------- |
| **Using memory to read specific code files** | Forbidden. Use research for file reading. Memory is for concepts and decisions only. |
| **Inventing memories**                       | Forbidden. If no match is found, state so and fall back to research.                 |

## 6. Tools & Assets

| Tool                   | Purpose                        | Source     |
| :--------------------- | :----------------------------- | :--------- |
| `read_knowledge_base`  | Recall concepts from Pinecone. | Memory MCP |
| `write_knowledge_base` | Save concepts to Pinecone.     | Memory MCP |
