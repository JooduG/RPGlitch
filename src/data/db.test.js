import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
describe("Database db.js", () => {
  let dbInstance;
  let consoleErrorSpy;
  let consoleWarnSpy;
  beforeEach(async () => {
    vi.resetModules();
    const Dexie = (await import("dexie")).default;
    await Dexie.delete("rpglitch");
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: vi.fn() },
    });
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
  });
  it("should populate default settings on initialization", async () => {
    const { db, init } = await import("./db.js");
    dbInstance = db;
    await init();
    const settings = await db.settings.get("app-settings");
    expect(settings).toBeDefined();
    expect(settings.id).toBe("app-settings");
    expect(settings.temperature).toBe(0.7);
    expect(settings.top_p).toBe(1.0);
    expect(settings.max_tokens).toBe(512);
    expect(settings.stop).toEqual([]);
    expect(settings.model).toBe("default");
    expect(settings.debug_mode).toBe(false);
    expect(settings.developer_mode).toBe(false);
    expect(settings.story_prologue_instructions).toBe("");
    expect(settings.storyboard_selection).toEqual({
      fractal: null,
      user: null,
    });
  });
  it("should log error during populate failure and not throw unhandled rejection directly from init", async () => {
    const { db, init } = await import("./db.js");
    dbInstance = db;
    db.on("populate", async function mockPopulate(trans) {
      const settings = trans.table("settings");
      settings.put = vi.fn().mockRejectedValue(new Error("Test error"));
    });
    let rejectionError;
    const handler = (err) => {
      rejectionError = err;
    };
    process.on("unhandledRejection", handler);
    // Suppress unhandled rejection crashing vitest directly
    try {
      await init();
    } catch (_e) {
      /* intentional: testing error suppression */
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(rejectionError).toBeUndefined();
    process.off("unhandledRejection", handler);
    const hasPopulateError = consoleErrorSpy.mock.calls.some(
      (call) => call[0] === "[Data] Failed to populate default settings:",
    );
    expect(hasPopulateError).toBe(true);
  });
  it("should log a warning when database is blocked", async () => {
    const { db, init } = await import("./db.js");
    dbInstance = db;
    await init();
    db.on("blocked").fire({ oldVersion: 10, newVersion: 11 });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[Data] Database is blocked by another tab/version. Please close other instances.",
    );
  });
  it("should handle versionchange event and close DB/reload window", async () => {
    const { db, init } = await import("./db.js");
    dbInstance = db;
    await init();
    const closeSpy = vi.spyOn(db, "close");
    db.on("versionchange").fire({ oldVersion: 10, newVersion: 11 });
    expect(closeSpy).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });
});
