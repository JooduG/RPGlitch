import { describe, expect, it, beforeEach } from "vitest";
import { app } from "./interface.svelte.js";
import { developer_log } from "./developer-log.svelte.js";

describe("InterfaceStore (app)", () => {
  beforeEach(() => {
    developer_log.clear();
  });

  it("exports a singleton app instance with default states", () => {
    expect(app).toBeDefined();
    expect(app.view).toBe("storyboard");
    expect(app.settings.sound).toBe(true);
    expect(app.settings.stream_text).toBe(true);
  });

  it("toggles settings correctly", () => {
    const initial_sound = app.settings.sound;
    app.toggle_sound();
    expect(app.settings.sound).toBe(!initial_sound);

    // Reset back
    app.toggle_sound();
    expect(app.settings.sound).toBe(initial_sound);
  });

  it("logs messages into developer_log via app.log()", () => {
    app.log("Interface test log entry", "system");
    expect(developer_log.entries.length).toBe(1);
    expect(developer_log.entries[0].message).toBe("Interface test log entry");
    expect(app.logs.length).toBe(1);
  });
});
