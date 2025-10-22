# **🗺️ Project Roadmap & Master Backlog**

**Purpose:** This is the project's strategic command center. It serves as a parking lot for ideas, a backlog for committed work, and a launchpad for moonshots. When an item is approved for active development, it moves to /memory-bank/present/ with a delivery target.

## **How we use this file**

* **Status values**: idea (default), researching, spiking, approved (ready for /present).  
* **Impact/Effort** are rough gut-checks (S/M/L) to aid prioritization.  
* **Signals to commit** list concrete evidence we’ll watch for before promoting an idea.

## **Idea Backlog (System Health, Features, & Tooling)**

| Idea | Rationale | Impact | Effort | Dependencies | Status | Signals to Commit |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **\--- Architecture & Rules \---** |  |  |  |  |  |  |
| Review & Refine All Rule Files | Ensure clarity, completeness, and unambiguous AI interpretation to reduce errors. | M | M | N/A | idea | Frequent AI errors related to rule misinterpretation; onboarding friction for new rules. |
| Develop New Rule Protocols | Address emerging operational needs or complex scenarios as the project grows. | M | M | Existing rule framework | idea | A new, complex task arises that isn't covered by current protocols. |
| Update System Architecture Docs | Keep diagrams and descriptions in sync with the current state of the project. | S | S | N/A | idea | A significant architectural change is implemented. |
| **\--- Documentation \---** |  |  |  |  |  |  |
| Full Documentation Audit | Ensure all docs in /docs and READMEs are clear, accurate, and consistent. | M | M | Finalized folder structure | idea | Onboarding a new developer reveals significant gaps or outdated information. |
| Internal Link Validation | Ensure all cross-references in the documentation are correct after the major refactor. | S | S | N/A | idea | Users report broken links; automated link checker is implemented. |
| Document /build/config Files | Explain the purpose and key settings of each configuration file. | S | M | N/A | idea | Developers frequently ask what a specific config setting does. |
| **\--- Applications \---** |  |  |  |  |  |  |
| Enhance RPGlitch Storyboard | Add new features to improve the core user experience of the flagship app. | M | L | Stable storyboard UI | idea | User feedback specifically requests new storyboard capabilities. |
| Improve RPGlitch Profile Mgmt | Streamline the user flow for creating and editing character profiles. | M | M | Dexie.js schema | idea | Analytics show high drop-off rates or time spent on the profile creation screen. |
| Custom ImageGlitch Styling | Move beyond Pico.css to give the app a more unique, branded aesthetic. | S | M | N/A | idea | The app gains enough traction to warrant a unique visual identity. |
| Add ImageGlitch Unit Tests | Ensure the core image glitching logic is robust and prevent regressions. | M | M | Core logic finalized | idea | A bug is introduced into the image generation logic that tests would have caught. |
| **\--- Build & Tooling \---** |  |  |  |  |  |  |
| Refactor Build Scripts | Improve modularity, reusability, and maintainability of the build system. | M | L | N/A | idea | Build times become a significant bottleneck in the development workflow. |
| Add Error Handling to Scripts | Make the build process more reliable and easier to debug when it fails. | M | M | All build scripts | idea | A single build failure takes more than 15 minutes to diagnose. |
| **\--- Memory Bank \---** |  |  |  |  |  |  |
| Automate Task Archiving | Automatically move logs from /present to /past to enforce clean state. | S | M | AGENTS.md SOPs | idea | Manual archiving process is forgotten for two or more consecutive tasks. |
| Standardize /future Templates | Create clear and consistent templates for planning documents. | S | S | N/A | idea | The backlog becomes difficult to parse due to inconsistent formatting. |
| **\--- Testing \---** |  |  |  |  |  |  |
| Increase Test Coverage | Reach a target threshold for all apps and shared code to improve stability. | L | L | All source code | idea | A critical regression is deployed to production that would have been caught by tests. |
| Standardize Testing Frameworks | Ensure consistency across the project for easier maintenance. | M | L | N/A | idea | Two or more fundamentally different testing patterns are used for similar features. |
| Expand MCP Test Coverage | Ensure all MCP tool interactions are comprehensively validated. | M | M | mcp-guide.md | idea | An untested MCP integration fails silently. |

## **Moonshots (Speculative)**

* **Agentic Scene Director**: AI model proposes the next storyboard beat, drafts prompts, and assembles assets for RPGlitch.  
* **Co-op Sessions**: Two users role-play in a shared RPGlitch session with synchronized state and per-user UI.  
* **Heuristics-Augmented Decider**: A lightweight rules layer that nudges AI sampling parameters based on scene type.

## **Maybe/Later (Cool, but not urgent)**

* Advanced in-app theming editor (export/import CSS tokens).  
* In-app interactive tutorial mode for new users.  
* "Screenshot-to-Persona" feature (parse a character card from an image using OCR \+ heuristics).

## **Assumptions & Risks**

* Token costs for new AI features (summarization, TTS) will remain within an acceptable budget.  
* Browser APIs (ASR/TTS) are sufficiently reliable across modern browsers.  
* The Perchance single-file constraint remains the primary deployment target.

## **Not Doing (For Now)**

* Server-side persistence beyond the current Dexie.js implementation.  
* Large-scale UI redesigns not tied to specific new functionality.

## **Intake Template (Copy for new ideas)**

\#\#\# \<Idea Title\>  
\*\*Rationale:\*\* \<why\>  
\*\*Impact:\*\* S/M/L  
\*\*Effort:\*\* S/M/L  
\*\*Dependencies:\*\* \<systems/features\>  
\*\*Status:\*\* idea  
\*\*Signals to commit:\*\* \<what evidence unlocks promotion\>  
