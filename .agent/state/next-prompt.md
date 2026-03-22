# 🦇 Next Agent Directive

**Context:** The intelligence core is now fully standardised and 100% camelCase compliant. `PromptBuilder` has been updated to the Markdown `[TAG]` format.

- **Intelligence Core Standardised**: `DynamicsEngine`, `PromptBuilder`, `ContextBroker`, and `IntelligenceKernel` are verified (56/56 tests passing).
- **Physical/Visual Inclusion**: `ContextBroker` correctly hydrates physical fields for simulation turns.
- **UI & Motion**: `kineticScroll` and `tilt` physics are active and stable.

**Immediate Goal:** Proceed to **narrative-bridge** implementation.

1. Connect the `DynamicsEngine` output to the `SessionDriver` to ensure signals are stored in history.
2. Trigger automatic scene complications (random events/interruptions) based on fractal state shifts.
3. Ensure the narrative feed handles these "Dynamic Interruptions" with the proper kinetic transitions.

**Constraints:** Maintain the Chalk Regime aesthetic. Use existing `app.log` for system-level narrative signals. No Bayesian legacy—use the new `DynamicsEngine` logic.

_Payload processed. Standard established._
