import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";

describe("Database db.js", () => {
  /** @type {import('dexie').Dexie | null} */
  let db_instance;
  /** @type {import('vitest').MockInstance} */
  let console_warn_spy;

  beforeEach(async () => {
    vi.resetModules();
    const Dexie = (await import("dexie")).default;
    await Dexie.delete("rpglitch");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: vi.fn() },
    });

    console_warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (db_instance) {
      db_instance.close();
      db_instance = null;
    }
  });

  it("should initialize database connection", async () => {
    const { db, init } = await import("@data/db.js");
    db_instance = db;
    await init();
    expect(db.isOpen()).toBe(true);
  });

  it("should log a warning when database is blocked", async () => {
    const { db, init } = await import("@data/db.js");
    db_instance = db;
    await init();
    db.on("blocked").fire({ oldVersion: 10, newVersion: 11 });
    expect(console_warn_spy).toHaveBeenCalledWith("[Data] Database is blocked by another tab/version. Please close other instances.");
  });

  it("should handle versionchange event and close DB/reload window", async () => {
    const { db, init } = await import("@data/db.js");
    db_instance = db;
    await init();
    const close_spy = vi.spyOn(db, "close");
    db.on("versionchange").fire({ oldVersion: 10, newVersion: 11 });
    expect(close_spy).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });

  it("should invoke the registered quiesce hook before versionchange reload", async () => {
    const { db, init, set_versionchange_quiesce } = await import("@data/db.js");
    db_instance = db;
    await init();
    const quiesce = vi.fn();
    set_versionchange_quiesce(quiesce);
    const close_spy = vi.spyOn(db, "close");
    db.on("versionchange").fire({ oldVersion: 10, newVersion: 11 });
    expect(quiesce).toHaveBeenCalledTimes(1);
    expect(close_spy).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it("should guard against duplicate versionchange reloads", async () => {
    const { db, init, set_versionchange_quiesce } = await import("@data/db.js");
    db_instance = db;
    await init();
    const quiesce = vi.fn();
    set_versionchange_quiesce(quiesce);
    db.on("versionchange").fire({ oldVersion: 10, newVersion: 11 });
    db.on("versionchange").fire({ oldVersion: 10, newVersion: 11 });
    expect(quiesce).toHaveBeenCalledTimes(1);
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});
