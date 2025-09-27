# **📁 Folder: /memory-bank**

## **🎯 Purpose**

This directory is the project's **AI Brain & Logbook**. It serves as the agent's persistent memory, providing the stateful, chronological context that informs all its decisions and actions. This is where the AI keeps its receipts, plans its next move, and archives its life story.

While [/docs](../docs/README.md) is the human's library and [/rules](../rules/README.md) is the AI's instruction manual, this folder is the AI's *experience*.

## **🗺️ The Temporal Lobes (Structure)**

The AI's consciousness is organized chronologically to manage its operational state:

* [**/forever**](./forever/README.md)**:** The **Core Identity**. Contains the foundational principles, ethical directives, and critical SOPs that are immutable and must never be forgotten. This is the AI's soul.  
* [**/future**](./future/README.md)**:** The **Prefrontal Cortex**. This is the planning and strategy hub, holding the roadmap for upcoming tasks and long-term goals.  
* [**/present**](./present/README.md)**:** The **Working Memory**. This is the AI's active workbench for the *current* task. It's a temporary space for plans, notes, and intermediate files.  
* [**/past**](./past/README.md)**:** The **Long-Term Memory**. A read-only, timestamped archive of every completed task. This is the project's historical logbook.  
* [**/archive**](./archive/)**:** The **Deep Archive**. The attic where old, deprecated files are stored for historical record, but are not part of the active memory.

## **💡 Core Workflow: The Flow of Consciousness**

The agent's operational loop is deeply tied to this structure. A task begins its life in /future, is moved to /present when it becomes active, and upon completion, its records are permanently archived to /past. This ensures a clean, stateful, and auditable workflow.

## **🔗 Governing Protocols**

The agent's interaction with the Memory Bank is strictly governed by its master protocol.

* **Master Protocol:** [../AGENTS.md](../AGENTS.md)  
* **Rule Loading Logic:** [../rules/README.md](../rules/README.md)
