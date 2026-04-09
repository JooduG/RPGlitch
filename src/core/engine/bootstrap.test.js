import { describe, test, expect, vi, beforeEach } from "vitest";
import { AppBootstrap, reset_bootstrap_guard } from "./bootstrap.js";
import * as repository from "@data/repository.js";
import { app } from "@state/app.svelte.js";

vi.mock("@state/app.svelte.js", () => ({
  app: {
    log: vi.fn(),
    init: vi.fn(),
    settings: { dev_mode: false },
  },
}));

vi.mock("@media/audio.js", () => ({
  Audio: {
    init: vi.fn(),
    _initPromise: null,
  },
}));

vi.mock("@data/repository.js", () => ({
  seed_premades: vi.fn(),
}));
vi.mock("@state/runtime.svelte.js", () => ({
  runtime: {
    sync: vi.fn(),
    is_ready: false,
  },
}));
vi.mock("svelte", () => ({
  mount: vi.fn(),
}));
vi.mock("../../App.svelte", () => ({
  default: {},
}));
describe("AppBootstrap", () => {
  beforeEach(async () => {
    const { Audio } = await import("@media/audio.js");
    document.body.innerHTML = "";
    vi.resetAllMocks();
    reset_bootstrap_guard();
    // Reset singleton states for test isolation
    Audio._initPromise = null;
    app.settings.dev_mode = false;
  });
  test("escapes error stack using textContent when initialization fails", async () => {
    const maliciousPayload = "<img src=x onerror=alert(1)>";
    const error = new Error("Critical Failure");
    error.stack = maliciousPayload;
    // Mocking seed_premades to throw
    vi.mocked(repository.seed_premades).mockRejectedValue(error);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await AppBootstrap.init();
    expect(document.body.innerHTML).toContain("SYSTEM HALTED");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Engine] ❌ Critical Failure:"),
      error,
    );
    expect(app.log).toHaveBeenCalledWith(
      expect.stringContaining("[Engine] ❌ Critical Failure: Critical Failure"),
      "error",
    );
    consoleSpy.mockRestore();
    const errorStackElement = document.getElementById("error-stack");
    expect(errorStackElement).not.toBeNull();
    // When using textContent, the literal string should be present in the text,
    // but it won't be interpreted as HTML.
    // In JSDOM, textContent will be the raw string, and innerHTML of that element
    // will have the entities.
    expect(errorStackElement.textContent).toBe(maliciousPayload);
    expect(errorStackElement.innerHTML).toContain("&lt;img");
    expect(document.body.innerHTML).not.toContain(maliciousPayload);
  });

  test("successfully initializes all services in the correct order and mounts the app", async () => {
    const { Audio } = await import("@media/audio.js");
    const { runtime } = await import("@state/runtime.svelte.js");
    const { mount } = await import("svelte");

    vi.mocked(runtime).is_ready = true;

    await AppBootstrap.init();

    // Verify all functions were called
    expect(repository.seed_premades).toHaveBeenCalled();
    expect(vi.mocked(runtime.sync)).toHaveBeenCalled();
    expect(app.init).toHaveBeenCalled();
    expect(Audio.init).toHaveBeenCalled();
    expect(vi.mocked(mount)).toHaveBeenCalled();

    // Verify the critical execution order
    const seedPremadesOrder = vi.mocked(repository.seed_premades).mock.invocationCallOrder[0];
    const runtimeSyncOrder = vi.mocked(runtime.sync).mock.invocationCallOrder[0];
    const appInitOrder = app.init.mock.invocationCallOrder[0];
    const audioInitOrder = Audio.init.mock.invocationCallOrder[0];
    const mountOrder = vi.mocked(mount).mock.invocationCallOrder[0];

    // Verify seed_premades runs before parallel tasks
    expect(seedPremadesOrder).toBeLessThan(runtimeSyncOrder);
    expect(seedPremadesOrder).toBeLessThan(appInitOrder);
    expect(seedPremadesOrder).toBeLessThan(audioInitOrder);

    // Verify mount runs after all parallel tasks are initiated
    const parallelInitMaxOrder = Math.max(runtimeSyncOrder, appInitOrder, audioInitOrder);
    expect(mountOrder).toBeGreaterThan(parallelInitMaxOrder);

    expect(document.getElementById("svelte-root")).toBeNull();
    expect(app.log).toHaveBeenCalledWith(expect.stringContaining("System Online"), "system");
  });

  test("does not use direct innerHTML assignment for the entire error template", async () => {
    const error = new Error("INTENTIONAL_REACTION");
    vi.mocked(repository.seed_premades).mockRejectedValue(error);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const innerHTMLSpy = vi.spyOn(document.body, "innerHTML", "set");

    await AppBootstrap.init();

    // We want this to be false, indicating we used a safer method like replaceChildren or append with a fragment
    expect(innerHTMLSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
    innerHTMLSpy.mockRestore();
  });
});
