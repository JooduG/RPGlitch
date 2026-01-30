# 🎯 Antigravity Skill Trigger Matrix (V5)

This document maps all registered Pillar Skills and their unified activation signals. Use this to determine which context to load for a given user request.

## 🏛️ The 7 Pillars

| Skill             | Summoning Triggers (Territory & Intent)                                                                | Assigned Tools (Core Kit)                                |
| :---------------- | :----------------------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| **🕹️ Gamemaster** | `src/gamemaster/**`, `tools/ops/**`, `package.json`, `vite.config.js`, "Task Management", "App State". | `waldzell-clear-thought`, `github`.                      |
| **🧠 Cortex**     | `src/cortex/**`, `.agent/tasks/**`, "Complex Planning", "Metacognition", "Logic Logic Check".          | `mcp-sequentialthinking-tools`, `context7`.              |
| **⚒️ Smith**      | `.agent/skills/smith/**`, `mcp.master.json`, `AGENTS.md`, "Skill Refinement", "Prompt Engineering".    | `stitch` (Proxy), `Python` (Validator).                  |
| **🛠️ Artificer**  | `src/artificer/**`, `src/components/**`, `**/*.svelte`, "UI Development", "Scaffolding".               | `stitch` (Generation), `svelte` (Playground).            |
| **🎭 Mesmer**     | `src/mesmer/**`, `**/*.{scss,css}`, "Theme", "Visuals", "Animation", "Vibe".                           | `pencil`, `pollinations`, `stitch` (References).         |
| **📚 Scholar**    | `src/scholar/**`, `.agent/knowledge/**`, "Data Persistence", "Reference Query", "Lore".                | `firecrawl`, `supabase`, `pinecone`, `context7` (Query). |
| **🛡️ Warden**     | `src/warden/**`, `tools/tests/**`, `.gitignore`, `ignores.master.json`, "Security", "Hygiene", "QA".   | `playwright`, `chrome-devtools`, `svelte` (Autofixer).   |

## 📐 Interaction Logic

1. **Summoning (Territorial)**: If a file path matches a persona's glob, that persona is automatically "Summoned" as the domain expert.
2. **Triggering (Intent)**: If a user request matches a persona's intent keywords, that persona is "Triggered" to provide strategic oversight.
3. **Synthesis**: For complex tasks, multiple personas coordinate via the **Gamemaster** (Operations) and **Cortex** (Strategy).

---

_Triggers are functionally identical. All activation signals bubble up to the main skill frontmatter._
