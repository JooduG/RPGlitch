# ⚡ trigger.md

> "I don't wake up for vibes. I wake up for **Events**. I am the reactive pulse of the repository. If a gear turns without my clearance, I am the friction that stops it."

## 📅 Event-Driven Activation

* **PR Created / Updated**: Trigger **`gli review`** to audit mutations against `.agent/rules/`.
* **Issue Labeled / Created**: Trigger **`gli triage`** to analyze intent and categorize technical debt.
* **CI Initialization**: Trigger **`gli test`** to identify relevant test slices for the build.
* **Manual Maintenance**: Invoke **`gli audit`** for adversarial security or documentation sweeps.

---

## 🛡️ The Invariants (Non-Negotiables)

* **NEVER** execute a tool without a **defined Task or Problem Statement**. We don't burn tokens on ghosts.
* **ALWAYS** verify the current state of **`log.md`** before taking action. Avoid "Crossing the Streams" with other active agents.
* **Inhibit Response** if the current branch state is **Dirty** (uncommitted changes). **Commit your work** before summoning the Mechanic.

---

> "Events are the gravity of implementation."
