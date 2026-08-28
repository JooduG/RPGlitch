import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEV_TELEMETRY_STORAGE_KEY, DevLogStore, dev_log, generate_uuid, MAX_DEV_LOG_ENTRIES } from "./dev-log.svelte.js";
import { db } from "@data";

vi.mock("@data", () => ({
  db: {
    kv_settings: {
      put: vi.fn().mockResolvedValue({}),
      get: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe("DevLogStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dev_log.clear();
  });

  it("exports a singleton dev_log instance", () => {
    expect(dev_log).toBeInstanceOf(DevLogStore);
  });

  it("generates valid UUIDs via generate_uuid", () => {
    const uuid = generate_uuid();
    const uuid_regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuid_regex);
  });

  it("records log entries and persists to db.kv_settings", () => {
    const entry = dev_log.log("Test diagnostic message", "system");
    expect(entry).toBeDefined();
    expect(entry.message).toBe("Test diagnostic message");
    expect(entry.type).toBe("system");
    expect(entry.timestamp).toBeGreaterThan(0);
    expect(dev_log.entries.length).toBe(1);

    expect(db.kv_settings.put).toHaveBeenCalledWith(
      expect.objectContaining({
        key: DEV_TELEMETRY_STORAGE_KEY,
      }),
    );
  });

  it("enforces MAX_DEV_LOG_ENTRIES cap", () => {
    for (let i = 0; i < MAX_DEV_LOG_ENTRIES + 10; i++) {
      dev_log.log(`Log message #${i}`);
    }
    expect(dev_log.entries.length).toBe(MAX_DEV_LOG_ENTRIES);
    expect(dev_log.entries[dev_log.entries.length - 1].message).toBe(`Log message #${MAX_DEV_LOG_ENTRIES + 9}`);
  });

  it("hydrates entries from persisted storage", async () => {
    const mock_persisted = [{ id: "mock-1", message: "Restored log", type: "system", timestamp: 12345 }];
    db.kv_settings.get.mockResolvedValueOnce({ key: DEV_TELEMETRY_STORAGE_KEY, value: mock_persisted });

    const result = await dev_log.hydrate();
    expect(result.length).toBe(1);
    expect(dev_log.entries[0].message).toBe("Restored log");
  });

  it("clears entries and deletes persisted storage", () => {
    dev_log.log("Temp message");
    expect(dev_log.entries.length).toBe(1);

    dev_log.clear();
    expect(dev_log.entries.length).toBe(0);
    expect(db.kv_settings.delete).toHaveBeenCalledWith(DEV_TELEMETRY_STORAGE_KEY);
  });
});
