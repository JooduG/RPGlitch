import { describe, expect, it, beforeEach } from "vitest";
import {
  DEVELOPER_TELEMETRY_STORAGE_KEY,
  DeveloperLogStore,
  developer_log,
  generate_uuid,
  MAX_DEVELOPER_LOG_ENTRIES,
} from "./developer-log.svelte.js";

describe("DeveloperLogStore", () => {
  beforeEach(() => {
    developer_log.clear();
  });

  it("exports a singleton developer_log instance and storage key constant", () => {
    expect(developer_log).toBeInstanceOf(DeveloperLogStore);
    expect(DEVELOPER_TELEMETRY_STORAGE_KEY).toBe("dev_telemetry");
  });

  it("can instantiate isolated DeveloperLogStore instances", () => {
    const custom_store = new DeveloperLogStore();
    expect(custom_store.entries).toEqual([]);
    custom_store.log("Custom message");
    expect(custom_store.entries.length).toBe(1);
  });

  it("generates a valid UUID string", () => {
    const uuid = generate_uuid();
    expect(typeof uuid).toBe("string");
    expect(uuid.length).toBeGreaterThan(0);
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("adds log entries with timestamp and id", () => {
    const entry = developer_log.log("Test diagnostic message", "system");
    expect(entry.id).toBeDefined();
    expect(entry.message).toBe("Test diagnostic message");
    expect(entry.type).toBe("system");
    expect(typeof entry.timestamp).toBe("number");
    expect(developer_log.entries.length).toBe(1);
    expect(developer_log.entries[0]).toEqual(entry);
  });

  it("caps log entries at MAX_DEVELOPER_LOG_ENTRIES", () => {
    for (let i = 0; i < MAX_DEVELOPER_LOG_ENTRIES + 10; i++) {
      developer_log.log(`Log message #${i}`);
    }
    expect(developer_log.entries.length).toBe(MAX_DEVELOPER_LOG_ENTRIES);
    expect(developer_log.entries[developer_log.entries.length - 1].message).toBe(`Log message #${MAX_DEVELOPER_LOG_ENTRIES + 9}`);
  });

  it("restores entries via hydrate safely", async () => {
    const result = await developer_log.hydrate();
    expect(Array.isArray(result)).toBe(true);
  });

  it("clears entries via clear()", () => {
    developer_log.log("Temp message");
    expect(developer_log.entries.length).toBe(1);

    developer_log.clear();
    expect(developer_log.entries.length).toBe(0);
  });
});
