import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";

describe("Database db.js", () => {
  /** @type {import('dexie').Dexie | null} */
  let dbInstance;
  /** @type {import('vitest').MockInstance} */
  let consoleWarnSpy;

  beforeEach(async () => {
    vi.resetModules();
    const Dexie = (await import("dexie")).default;
    await Dexie.delete("rpglitch");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: vi.fn() },
    });

    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
  });

  it("should initialize database connection", async () => {
    const { db, init } = await import("@data/db.js");
    dbInstance = db;
    await init();
    expect(db.isOpen()).toBe(true);
  });

  it("should log a warning when database is blocked", async () => {
    const { db, init } = await import("@data/db.js");
    dbInstance = db;
    await init();
    db.on("blocked").fire({ oldVersion: 10, newVersion: 11 });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[Data] Database is blocked by another tab/version. Please close other instances.",
    );
  });

  it("should handle versionchange event and close DB/reload window", async () => {
    const { db, init } = await import("@data/db.js");
    dbInstance = db;
    await init();
    const closeSpy = vi.spyOn(db, "close");
    db.on("versionchange").fire({ oldVersion: 10, newVersion: 11 });
    expect(closeSpy).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });
});
