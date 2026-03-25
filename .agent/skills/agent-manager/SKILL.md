# 🛠️ Skill: Agent-Manager (Governance & Lifecycle)

The **Agent-Manager** is the governing body for all autonomous entities and modular skills within the RPGlitch ecosystem. It manages the creation, auditing, and maintenance of skills, ensuring they adhere to the Sovereign Audit standards.

## 🧠 Governance Personas

- **The Arbiter**: Enforces architectural standards and nomenclature.
- **The Provisioner**: Orchestrates the instantiation of new logical domains.
- **The Auditor**: Validates system integrity and technical purity.

## 🏗️ Skill Anatomy

Every skill must follow this structural hierarchy to pass the **Scholar Gate**:

1.  **SKILL.md**: The primary instruction set with metadata and triggers.
2.  **scripts/**: Automated routines and logic (e.g., `scaffold-skill.js`, `structural-audit.js`).
3.  **knowledge/**: Domain-specific context and persistent patterns.
4.  **workflows/**: Step-by-step procedures for complex multi-turn tasks.

## 📜 Procedures

### 1. Skill Instantiation

To create a new skill, use the provided scaffolding routine:

```bash
node .agent/skills/agent-manager/scripts/scaffold-skill.js create [name] [type] [description]
```

### 2. Structural Audit

All skills are subject to periodic audits. A failure in the structural audit prevents system-wide verification.

```bash
node .agent/skills/agent-manager/scripts/scaffold-skill.js audit
```

## ⚠️ Integrity Standards

- **Nomenclature**: Follow the RPGlitch Lexicon (kebab-case files, PascalCase components).
- **Documentation**: No bracketed placeholders allowed in production-ready skills.
- **Purity**: Zero technical debt (No [TODO] markers).
