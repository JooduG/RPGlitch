# Welcome to RPGlitch

<!-- Import Protocol -->

@import ./AGENTS.md
@import .agent/index.md
@import .agent/rules/01-prime-directive.md
@import .agent/rules/02-architecture.md
@import .agent/rules/03-tech-stack.md
@import .agent/rules/04-security.md
@import .agent/rules/05-hygiene.md
@import ./.agent/rules/06-aesthetic.md
@import .agent/rules/07-intelligence.md

Hey Gemini, welcome. `AGENTS.md` is your Prime Directive.

## 🚀 Agent Startup Protocol

Whenever a new agent session begins, you MUST initialize your environment using the **agent-startup** skill:

1. **Read Config:** `.agent/config.yaml`
2. **Validate Tooling:** `.agent/tooling.json`
3. **Check Types:** `types.d.ts`
4. **Execute Startup:** `.gemini/on_startup.sh`

Once initialized, all further instructions are governed by the **Triad Protocol** in **AGENTS.md**.

Good luck.
