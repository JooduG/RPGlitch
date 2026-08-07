import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@state/app.svelte.js", () => ({
  app: {
    log: vi.fn(),
    init: vi.fn(),
    settings: { dev_mode: false },
  },
}));

vi.mock("@media/audio.svelte.js", () => ({
  Audio: {
    init: vi.fn(),
    _init_promise: null,
    voice: {
      loadModel: vi.fn().mockResolvedValue(),
    },
  },
}));

vi.mock("@intelligence", () => ({
  embeddings_engine: {
    load_model: vi.fn().mockResolvedValue(),
  },
}));

vi.mock("@data/repository.js", () => ({
  seed_premades: vi.fn(),
}));

// Mock the state bridge so boot.js can access app/runtime without importing @state
const _mock_app = {
  log: vi.fn(),
  init: vi.fn(),
  settings: { dev_mode: false },
};
const _mock_runtime = {
  sync: vi.fn(),
  is_ready: false,
};
vi.mock("@utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    state_bridge: {
      get app() {
        return _mock_app;
      },
      get runtime() {
        return _mock_runtime;
      },
    },
  };
});

import * as repository from "@data";
import { AppBootstrap, reset_bootstrap_guard } from "@engine/boot.js";
vi.mock("@state/runtime.svelte.js", () => ({
  runtime: _mock_runtime,
}));
vi.mock("svelte", () => ({
  mount: vi.fn(),
}));
vi.mock("../App.svelte", () => ({
  default: {},
}));
describe("AppBootstrap", () => {
  beforeEach(async () => {
    document.body.innerHTML = "";
    vi.resetAllMocks();
    reset_bootstrap_guard();
    _mock_app.settings.dev_mode = false;
  });
  test("escapes error stack using textContent when initialization fails", async () => {
    const malicious_payload = "<img src=x onerror=alert(1)>";
    const error = new Error("Critical Failure");
    error.stack = malicious_payload;
    // Mocking seed_premades to throw
    vi.mocked(repository.seed_premades).mockRejectedValue(error);

    const console_spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await AppBootstrap.init();
    expect(document.body.innerHTML).toContain("SYSTEM HALTED");
    expect(console_spy).toHaveBeenCalledWith(expect.stringContaining("[Engine] 🚫 Critical Failure:"), error);
    expect(_mock_app.log).toHaveBeenCalledWith(expect.stringContaining("[Engine] 🚫 Critical Failure: Critical Failure"), "error");
    console_spy.mockRestore();
    const error_stack_element = /** @type {HTMLElement} */ (document.getElementById("user-content-error-stack"));
    expect(error_stack_element).not.toBeNull();
    // When using textContent, the literal string should be present in the text,
    // but it won't be interpreted as HTML.
    // In JSDOM, textContent will be the raw string, and innerHTML of that element
    // will have the entities.
    expect(error_stack_element.textContent).toBe(malicious_payload);
    expect(error_stack_element.innerHTML).toContain("&lt;img");
    expect(document.body.innerHTML).not.toContain(malicious_payload);
  });

  test("successfully initializes all services in the correct order and mounts the app", async () => {
    const { Audio } = await import("@media/audio.svelte.js");
    const { mount } = await import("svelte");

    _mock_runtime.is_ready = true;

    await AppBootstrap.init();

    // Verify all functions were called
    expect(repository.seed_premades).toHaveBeenCalled();
    expect(vi.mocked(_mock_runtime.sync)).toHaveBeenCalled();
    expect(_mock_app.init).toHaveBeenCalled();
    expect(Audio.init).toHaveBeenCalled();
    expect(vi.mocked(mount)).toHaveBeenCalled();

    // Verify the critical execution order
    const seed_premades_order = vi.mocked(repository.seed_premades).mock.invocationCallOrder[0];
    const runtime_sync_order = vi.mocked(_mock_runtime.sync).mock.invocationCallOrder[0];
    const app_init_order = _mock_app.init.mock.invocationCallOrder[0];
    const audio_init_order = vi.mocked(Audio.init).mock.invocationCallOrder[0];
    const mount_order = vi.mocked(mount).mock.invocationCallOrder[0];

    // Verify seed_premades runs before parallel tasks
    expect(seed_premades_order).toBeLessThan(runtime_sync_order);
    expect(seed_premades_order).toBeLessThan(app_init_order);
    expect(seed_premades_order).toBeLessThan(audio_init_order);

    // Verify mount runs after all parallel tasks are initiated
    const parallel_init_max_order = Math.max(runtime_sync_order, app_init_order, audio_init_order);
    expect(mount_order).toBeGreaterThan(parallel_init_max_order);

    expect(document.getElementById("svelte-root")).toBeNull();
    expect(_mock_app.log).toHaveBeenCalledWith(expect.stringContaining("System Online"), "system");
  });

  test("does not use direct innerHTML assignment for the entire error template", async () => {
    const error = new Error("INTENTIONAL_REACTION");
    vi.mocked(repository.seed_premades).mockRejectedValue(error);

    const console_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const inner_htmlspy = vi.spyOn(document.body, "innerHTML", "set");

    await AppBootstrap.init();

    // We want this to be false, indicating we used a safer method like replaceChildren or append with a fragment
    expect(inner_htmlspy).not.toHaveBeenCalled();

    console_spy.mockRestore();
    inner_htmlspy.mockRestore();
  });
});
