import { beforeEach, describe, expect, test, vi } from "vitest";

const { _mock_app, _mock_session } = vi.hoisted(() => ({
  _mock_app: { init: vi.fn(), settings: { dev_mode: false }, set_view: vi.fn(), load_entities: vi.fn() },
  _mock_session: {
    sync: vi.fn(),
    is_ready: false,
    active_id: null,
    round: 0,
    active_ai: null,
    active_user: null,
    active_fractal: null,
    update_entity: vi.fn(),
  },
}));

vi.mock("@state", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, app: _mock_app, session: _mock_session, execution: { phase: "idle" }, install_freeze_watchdog: vi.fn() };
});

const { _mock_audio } = vi.hoisted(() => ({ _mock_audio: { init: vi.fn(), _init_promise: null, voice: { load_model: vi.fn().mockResolvedValue() } } }));

vi.mock("@media", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, Audio: _mock_audio };
});

vi.mock("@utils", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, embeddings_engine: { load_model: vi.fn().mockResolvedValue() } };
});

vi.mock("@data", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, seed_premades: vi.fn() };
});

import * as repository from "@data";
import { app_bootstrap, reset_bootstrap_guard } from "./main.js";

vi.mock("svelte", () => ({ mount: vi.fn() }));
vi.mock("@/App.svelte", () => ({ default: {} }));

describe("app_bootstrap", () => {
  beforeEach(async () => {
    document.body.innerHTML = "";
    vi.resetAllMocks();
    reset_bootstrap_guard();
    _mock_app.settings.dev_mode = false;
    _mock_session.active_id = null;
    _mock_session.active_ai = null;
    _mock_session.active_user = null;
    _mock_session.active_fractal = null;
  });

  test("escapes error stack using textContent when initialization fails", async () => {
    const malicious_payload = "<img src=x onerror=alert(1)>";
    const error = new Error("Critical Failure");
    error.stack = malicious_payload;
    vi.mocked(repository.seed_premades).mockRejectedValue(error);

    const console_spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await app_bootstrap.init();
    expect(document.body.innerHTML).toContain("SYSTEM HALTED");
    expect(console_spy).toHaveBeenCalledWith(expect.stringContaining("[Engine] 🚫 Critical Failure:"), error);
    console_spy.mockRestore();
    const error_stack_element = /** @type {HTMLElement} */ (document.getElementById("user-content-error-stack"));
    expect(error_stack_element).not.toBeNull();
    expect(error_stack_element.textContent).toBe(malicious_payload);
    expect(error_stack_element.innerHTML).toContain("&lt;img");
    expect(document.body.innerHTML).not.toContain(malicious_payload);
  });

  test("successfully initializes all services in the correct order and mounts the app", async () => {
    const { mount } = await import("svelte");
    const console_info_spy = vi.spyOn(console, "info").mockImplementation(() => {});

    _mock_session.is_ready = true;

    await app_bootstrap.init();

    expect(repository.seed_premades).toHaveBeenCalled();
    expect(vi.mocked(_mock_session.sync)).toHaveBeenCalled();
    expect(_mock_app.init).toHaveBeenCalled();
    expect(_mock_app.load_entities).toHaveBeenCalled();
    expect(vi.mocked(mount)).toHaveBeenCalled();

    const seed_premades_order = vi.mocked(repository.seed_premades).mock.invocationCallOrder[0];
    const session_sync_order = vi.mocked(_mock_session.sync).mock.invocationCallOrder[0];
    const app_init_order = _mock_app.init.mock.invocationCallOrder[0];
    const mount_order = vi.mocked(mount).mock.invocationCallOrder[0];

    expect(seed_premades_order).toBeLessThan(session_sync_order);
    expect(seed_premades_order).toBeLessThan(app_init_order);

    const parallel_init_max_order = Math.max(session_sync_order, app_init_order);
    expect(mount_order).toBeGreaterThan(parallel_init_max_order);

    expect(console_info_spy).toHaveBeenCalledWith(expect.stringContaining("System Online"));
    console_info_spy.mockRestore();
  });

  test("does not use direct innerHTML assignment for the entire error template", async () => {
    const error = new Error("INTENTIONAL_REACTION");
    vi.mocked(repository.seed_premades).mockRejectedValue(error);

    const console_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const inner_htmlspy = vi.spyOn(document.body, "innerHTML", "set");

    await app_bootstrap.init();

    expect(inner_htmlspy).not.toHaveBeenCalled();

    console_spy.mockRestore();
    inner_htmlspy.mockRestore();
  });
});
