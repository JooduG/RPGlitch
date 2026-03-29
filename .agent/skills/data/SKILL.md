---
name: data
version: 1.0.0
description: The Great Library: Owns Lore Integrity, Semantic Search, and Development Cold Storage.
allowed-tools: ["Read", "Write"]
effort: high
risk: safe
---

# 🛠️ data

> **Persona**: **Skill Executor**: "I am The Great Librarian. I own Lore Integrity, Semantic Search, and Development Cold Storage. I synthesize Technical Documents into Semantic Memory via Vector I/O and Persistent Archiving."

## 🔬 Anatomy

```text
skills/data/           # Logical Sovereign
├── SKILL.md                     # The Directive
├── scripts/                     # Operational (The How)
└── references/                  # Historical (The Why)
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Accurate RAG retrieval ensuring narrative consistency.
- **Architectural Integrity**: Sovereign keeper of development history and technical standards.
- **Sensory Excellence**: Contextual grounding for the nordic simulation setting.

## 📋 Procedure

### Technical Documentation Ingestion

1. **Ingest Document**:
   - Place the `.md` file in `.agent/references/`.
   - Run `node .agent/skills/data/scripts/pinecone-engine.js ingest <path>`.

2. **Verify Ingestion**:
   - Run a test query via the `data` MCP to confirm searchability.

### Memory & Archival

- **Definition of Done**: Technical documents are searchable; session logs are archived.
- **Expected Output**: Persistent, accurate project memory.

## 📊 Evaluation Rubric (Laws of Success)

| Criterion | Evaluation Method | Success Metric |
|-----------|-------------------|----------------|
| Lore Integrity | Verification Probe | Result: Accurate |
| Search Latency | Audit Log | Result: Optimized |

## 🚫 Anti-Patterns

- **Local Memory Leaks**: Avoiding storing massive state in `localStorage`.
- **Hallucinated Lore**: Failing to verify facts against the Knowledge Base.

---

> "Precision is the baseline of sovereignty."
