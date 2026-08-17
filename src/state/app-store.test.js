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
