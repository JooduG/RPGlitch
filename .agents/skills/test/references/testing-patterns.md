# Testing Patterns Reference: The Witness Guide

Quick reference for sovereign testing patterns across the RPGlitch stack. Use alongside the `test-driven-development` skill.

## 🔬 Table of Contents

- [Test Structure (Arrange-Act-Assert)](#test-structure-arrange-act-assert)
- [Test Naming Conventions](#test-naming-conventions)
- [Common Vitest Assertions](#common-vitest-assertions)
- [Mocking Patterns (Dexie & Boundaries)](#mocking-patterns-dexie--boundaries)
- [Svelte 5 Component Testing](#svelte-5-component-testing)
- [Simulation Engine Logic Testing](#simulation-engine-logic-testing)
- [E2E Testing (Playwright)](#e2e-testing-playwright)
- [Test Anti-Patterns](#test-anti-patterns)

---

## Test Structure (Arrange-Act-Assert)

Every test in the 'Proving Grounds' MUST follow the Triple-A pattern for clarity and deterministic outcomes.

```typescript
import { it, expect, describe, vi } from "vitest";

it("properly mutates character entropy during intense rounds", () => {
  // 🟢 Arrange: Set up character state and engine environment
  const character = $state(createEntity({ name: "Kael", stress: 10 }));
  const engine = new DynamicsEngine();

  // 🟡 Act: Perform the action being tested
  engine.processTick(character, { intensity: "high" });

  // 🔴 Assert: Verify the outcome (State Over Interaction)
  expect(character.stress).toBeGreaterThan(10);
  expect(character.entropy).toBe(1);
});
```

## Test Naming Conventions

Names must describe **BEHAVIOR**, not implementation.

- **Pattern**: `[unit] [expected behavior] [under condition]`

```typescript
describe("DynamicsEngine", () => {
  it("increments round counter after user submission", () => {});
  it("refuses turn transition if engine state is locked", () => {});
  it("emits sensory bridge even when narrative output is empty", () => {});
});
```

---

## Common Vitest Assertions

We utilize **Vitest** for its blazing speed and Svelte 5 compatibility.

### Equality & Truthiness

```typescript
expect(result).toBe(expected); // Strict equality (===)
expect(result).toEqual(expected); // Deep equality (objects/arrays)
expect(result).toBeTruthy();
expect(result).toBeDefined();
```

### Simulation Specifics

```typescript
expect(entity.stress).toBeCloseTo(0.85, 2); // Floating point runes
expect(narrative).toMatch(/Kael.*sword/i); // Narrative grounding check
expect(history).toContainEqual(expectedTurn);
```

### Async & Errors

```typescript
await expect(kernel.generate()).resolves.toBeDefined();
expect(() => engine.lock()).toThrow("Engine already locked");
```

---

## Mocking Patterns (Dexie & Boundaries)

Mocking should only happen at physical boundaries (I/O). **Do not mock internal business logic.**

### Mock Functions

```typescript
const onTurnEnd = vi.fn();
onTurnEnd.mockReturnValue({ proceed: true });

expect(onTurnEnd).toHaveBeenCalledTimes(1);
expect(onTurnEnd).toHaveBeenCalledWith(expect.objectContaining({ round: 1 }));
```

### The Dexie 'Witness' Mock

When testing the data layer, use an in-memory instance of the database rather than mocking the methods.

```typescript
import Dexie from "dexie";
import "dexie-export-import";

// Creates a fresh, isolated in-memory DB for every test
async function setupTestDB() {
  const db = new Dexie("TestDB", { indexedDB: require("fake-indexeddb") });
  db.version(1).stores({ entities: "id, name, type" });
  return db;
}
```

---

## Svelte 5 Component Testing

Testing components in the Nordic Regime focuses on **Runes** and **User Visibility**.

### Testing Runes in `.svelte.test.js`

```typescript
import { flushSync } from "svelte";

it("reacts to external state changes via runes", () => {
  let count = $state(0);
  const component = mount(Counter, { target: document.body, props: { count } });

  count = 5; // Mutative update
  flushSync(); // Force Svelte to update the DOM

  expect(document.body.innerHTML).toContain("5");
});
```

### Behavioral Probing (Narrative TDD)

Verify that UI components properly signal diegetic states (e.g., stress indicators reaching max).

```javascript
it('renders the "Glitch" overlay when entropy exceeds 0.9', () => {
  const char = $state({ entropy: 0.95 });
  render(StatusPanel, { props: { char } });

  expect(screen.getByTestId("glitch-vfx")).toBeInTheDocument();
  expect(screen.queryByText("Normal")).not.toBeInTheDocument();
});
```

---

## Simulation Engine Logic Testing

Engine tests must verify the recursive intelligence kernel and turn-cycle integrity.

### Turn Cycle Isolation

```typescript
it("locks UI during System Simulation Turn", async () => {
  const state = new AppState();
  expect(state.ui_locked).toBe(false);

  state.submitAction("open door");
  expect(state.ui_locked).toBe(true); // Immediate lock

  await state.turnComplete;
  expect(state.ui_locked).toBe(false); // Released
});
```

---

## E2E Testing (Playwright)

Use Playwright for high-fidelity sensory verification.

```typescript
import { test, expect } from "@playwright/test";

test("user can cycle characters during a simulation round", async ({ page }) => {
  await page.goto("/");

  // Select slot
  await page.click('[data-slot="1"]');
  await expect(page.locator(".active-profile")).toContainText("Kael");

  // Swap via profile modal
  await page.click(".profile-avatar");
  await page.click("text=Swap Character");
  await page.click("text=Elara");

  await expect(page.locator(".active-profile")).toContainText("Elara");
});
```

---

## Test Anti-Patterns

| Anti-Pattern                       | Problem                            | Better Approach                                   |
| :--------------------------------- | :--------------------------------- | :------------------------------------------------ |
| **Testing implementation details** | Breaks on refactor                 | Test inputs/outputs of the engine                 |
| **Silent Failures**                | Swallowed errors in async effects  | Always `await` or use `unhandledrejection` guards |
| **Global State Pollution**         | Tests leak into each other         | Reset Dexie and Runes in `beforeEach`             |
| **Arbitrary Timeouts**             | Flaky tests on slower environments | Use `waitFor` or `vi.advanceTimersByTime`         |
| **Narration Logic in Unit Tests**  | Narrative is non-deterministic     | Test the _kernel state_, not the exact prose      |

## ✅ Done Criteria (The Proving Grounds)

- [ ] Every new logic mutation has a corresponding `.test.js`.
- [ ] 100% pass rate in local Vitest runner.
- [ ] Zero usage of legacy `jest` or `react-testing-library` patterns.
- [ ] Narrative grounding verified via Behavioral Probes.
