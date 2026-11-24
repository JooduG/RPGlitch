import { afterEach, describe, expect, it } from "vitest";
import { TIMING_MS } from "@config";
import { install_freeze_watchdog, uninstall_freeze_watchdog } from "./watchdog.js";

describe("freeze watchdog", () => {
  afterEach(() => {
    uninstall_freeze_watchdog();
  });

  it("exports calibrated timing constants and installs/uninstalls cleanly", () => {
    expect(TIMING_MS.HEARTBEAT).toBe(15000);
    expect(TIMING_MS.CEILING).toBe(120000);
    expect(TIMING_MS.LIFETIME).toBe(240000);
    expect(() => install_freeze_watchdog()).not.toThrow();
    expect(() => uninstall_freeze_watchdog()).not.toThrow();
  });
});
