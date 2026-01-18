# 🛸 Knowledge Base: The Antigravity Stack (Gemini-Native)

> **Context:** This document outlines the high-level operational strategy for the Antigravity agentic ecosystem, distinguishing it from generic AI-assisted coding.

## 1. The Agent Manager Paradigm

Antigravity is not a "Code Completer"; it is an **Agent Manager**.

- **Workflow Orchestration:** complex tasks are broken into hierarchical task lists (Artifacts) and executed through specialized modes (PLANNING, EXECUTION, VERIFICATION).
- **Context Management:** utilizes native Context Caching and RAG (via Knowledge Base) to maintain a deep understanding of the monolithic codebase.
- **Artifact-First Governance:** all high-stakes changes require an `implementation_plan.md` and a `walkthrough.md` for human verification.

## 2. Model Layers

The stack integrates multiple model tiers to balance intelligence and economics:

- **Tier 1 (Cortex):** Gemini 3.0 Pro / Claude 3.5 Sonnet. Used for Planning Mode, complex refactors, and logic puzzles.
- **Tier 2 (Reflex):** Gemini 2.x Flash. Used for "Fast Mode" tasks like CSS tweaks, documentation sync, and unit test generation.

## 3. Security Architecture (Prompt Injection Defense)

To prevent data exfiltration and prompt injection in a multi-agent environment:

- **File Deny List:** (Refer to `security.md`). Strict block on SSH keys, `.env`, and secret credentials.
- **Network Allow List:** Restricted to verified domains (`github.com`, `perchance.org`).
- **Zer-Trust Sanitization:** All AI-injected content passes through `DOMPurify`.

## 4. Future Outlook: The Autonomous Architect

The ultimate goal is to transition the developer from "Typing Code" to "Orchestrating Outcomes." The stack is designed for a future where agents handle the entire dev-loop (Plan -> Build -> Test -> Deploy) autonomously, with the human providing high-level architectural intent.
