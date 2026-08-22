import { app } from "./app-store.svelte.js";
import { dev_log } from "./dev-log.svelte.js";
import { beforeEach, describe, expect, it } from "vitest";
describe("AppStore Telemetry", () => {
  beforeEach(() => {
    // Clear logs before each test
    dev_log.clear();
  });
  it("generates a secure UUID for logs", () => {
    app.log("test security message", "system");
    const entry = app.logs[0];
    expect(entry).toBeDefined();
    expect(entry.message).toBe("test security message");
    // UUID format check (8-4-4-4-12 hex characters)
    const uuid_regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(entry.id).toMatch(uuid_regex);
  });
});

describe("AppStore Selection Cleaning", () => {
  it("cleans claimed entity selections when in storyboard view", () => {
    app.view = "storyboard";
    app.claimed_entity_ids.clear();
    app.claimed_entity_ids.add("ai-claimed");
    app.selected_ai = { id: "ai-claimed", name: "Glitch" };
    app.selected_user = { id: "user-free", name: "Orion" };

    app.clean_claimed_selections();

    expect(app.selected_ai).toBeNull();
    expect(app.selected_user).not.toBeNull();
    expect(app.selected_user?.name).toBe("Orion");
  });

  it("does not wipe selections when view is not storyboard unless forced", () => {
    app.view = "storymode";
    app.claimed_entity_ids.clear();
    app.claimed_entity_ids.add("ai-claimed");
    app.selected_ai = { id: "ai-claimed", name: "Glitch" };

    app.clean_claimed_selections();
    expect(app.selected_ai).not.toBeNull();

    app.clean_claimed_selections(true);
    expect(app.selected_ai).toBeNull();
  });
});
