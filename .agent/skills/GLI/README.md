# 🛸 GLI: General Logistics Interface

This directory contains the **Sovereign GLI** (General Logistics Interface) stack for RPGlitch. It is the intelligence hub for repository maintenance, automated audits, and AI-led logistics.

## 🏗️ Architecture

The skill is organized into three primary layers: **Logic** (scripts), **Rules** (references), and **Identity** (brief).

### 1. **The CLI (`scripts/gli.js`)**
The **General Logistics Interface** (GLI) is the primary entry point for all maintenance tasks. 
- **Commands**:
    - `review`: Performs an AI-driven audit of pull requests.
    - `triage`: Analyzes new issues and categorizes them.
    - `test`: Executes "Smart Test Selection" based on git diffs.
    - `brief`: Displays the agent identity and mission status.

### 2. **The Rules (`references/rules/`)**
These files define the "physics" of how logistics actions are executed:
- **`trigger.md`**: Defines the events (e.g., PR opening, labeling) that should initiate an action.
- **`workflow.md`**: Outlines the sequence of operations for each command.
- **`writeback.md`**: Specifies the format and destination for automated feedback (e.g., GitHub comments).

### 3. **The Identity (`references/brief.md`)**
The **Agent Mission Statement**. This is the core persona definition that the AI agent uses to understand its boundaries and goals within the repository.

---

## 🛠️ Repository Logistics

These core scripts manage the foundational state and environment initialization.
- **`setup.sh`**: The **Jules VM Boot Sequence**. Primes the environment by linking dependencies, verifying Svelte 5 Runes, and validating the production build.

## 🤖 GitHub Integration

The CLI is bridged to GitHub Actions via the `.github/workflows/` directory:
- **`production-ci.yml`**: The **Standard CI Pipeline**. Performs linting, Svelte checks (`npm run check`), and unit tests before ensuring a stable production build.
- **`night-shift.yml`**: The **Janitorial & Memory Sync** (4:00 AM daily). Performs CSS audits, syncs the codebase to RAG memory, and cleans up `#TODO-AI` backlog tags.
- **`jules-security-scan.yml`**: The **Daily Security Audit** (6:00 AM daily). Uses Jules AI to enforce `06-compliance.md` and audit for Critical/High vulnerabilities.
- **`jules-bug-fixer.yml`**: The **Autonomous Bug Repair**. Triggered when an issue is labeled as `bug`. Invokes Jules AI to implement fixes via the `03-clean.md` workflow.
- **`fleet-dispatch.yml`**: The **Multi-Environment Orchestrator**. Manual workflow for dispatching updates across the "fleet" (Core vs UI).
- **`sovereign-ci.yml`**: Runs `gli test` on pushes/PRs.
- **`sovereign-review.yml`**: Triggers `gli review` on new PRs.
- **`sovereign-triage.yml`**: Automates issue triage using `gli triage`.

## 📜 Usage (Manual)

To manually run a logistics action from the repository root:

```bash
# Display the agent brief
node .agent/skills/GLI/scripts/gli.js brief --human
npm run GLI:human

# Trigger a manual PR review
node .agent/skills/GLI/scripts/gli.js review --agent
npm run GLI:agent
```

---

> [!TIP]
> This skill follows the **Sovereign Architecture**: it is local-first, privacy-respecting, and rule-deterministic.
