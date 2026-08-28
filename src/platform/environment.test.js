import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { install_environment_hardening } from "./environment.js";

describe("environment hardening", () => {
  let original_onerror;
  let original_resize_observer;
  let original_add_event_listener;

  beforeEach(() => {
    original_onerror = window.onerror;
    original_resize_observer = window.ResizeObserver;
    original_add_event_listener = window.addEventListener;
  });

  afterEach(() => {
    window.onerror = original_onerror;
    window.ResizeObserver = original_resize_observer;
    window.addEventListener = original_add_event_listener;
    vi.restoreAllMocks();
  });

  it("patches ResizeObserver to wrap callbacks in requestAnimationFrame", () => {
    const callback_mock = vi.fn();
    const raf_spy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 1;
    });

    install_environment_hardening();

    const observer = new window.ResizeObserver(callback_mock);
    expect(observer).toBeDefined();

    expect(window.ResizeObserver).not.toBe(original_resize_observer);
    expect(raf_spy).not.toHaveBeenCalled(); // RAF only triggers when callback is invoked

    raf_spy.mockRestore();
  });

  it("suppresses ResizeObserver loop messages via window.onerror", () => {
    install_environment_hardening();

    const result = window.onerror?.("ResizeObserver loop completed with undelivered notifications.", "test.js", 1, 1, new Error("loop"));
    expect(result).toBe(true); // Suppressed
  });

  it("passes non-ResizeObserver errors to original window.onerror", () => {
    const custom_onerror = vi.fn().mockReturnValue(false);
    window.onerror = custom_onerror;

    install_environment_hardening();

    const err = new Error("General Runtime Error");
    const result = window.onerror?.("General Runtime Error", "test.js", 1, 1, err);

    expect(custom_onerror).toHaveBeenCalledWith("General Runtime Error", "test.js", 1, 1, err);
    expect(result).toBe(false);
  });

  it("filters ResizeObserver loop errors in window error event listeners", () => {
    install_environment_hardening();

    const listener = vi.fn();
    window.addEventListener("error", listener);

    // Dispatch a ResizeObserver loop error event
    const ro_event = new Event("error");
    Object.defineProperty(ro_event, "message", { value: "ResizeObserver loop limit exceeded" });
    window.dispatchEvent(ro_event);

    expect(listener).not.toHaveBeenCalled();

    // Dispatch a regular error event
    const normal_event = new Event("error");
    Object.defineProperty(normal_event, "message", { value: "Uncaught ReferenceError: foo is not defined" });
    window.dispatchEvent(normal_event);

    expect(listener).toHaveBeenCalledWith(normal_event);
  });

  it("silences Perchance sandbox Symbol and numActualScriptLines error events", () => {
    install_environment_hardening();

    const symbol_event = new Event("error", { cancelable: true });
    Object.defineProperty(symbol_event, "message", { value: "Cannot convert a Symbol value to a string" });
    const prevent_spy = vi.spyOn(symbol_event, "preventDefault");
    const stop_spy = vi.spyOn(symbol_event, "stopPropagation");

    window.dispatchEvent(symbol_event);

    expect(prevent_spy).toHaveBeenCalled();
    expect(stop_spy).toHaveBeenCalled();
  });

  it("silences Perchance sandbox unhandledrejection events", () => {
    install_environment_hardening();

    const reason = new Error("numActualScriptLines is not defined");
    const rejection_event = new CustomEvent("unhandledrejection", {
      cancelable: true,
      detail: { reason },
    });
    Object.defineProperty(rejection_event, "reason", { value: reason });
    const prevent_spy = vi.spyOn(rejection_event, "preventDefault");
    const stop_spy = vi.spyOn(rejection_event, "stopPropagation");

    window.dispatchEvent(rejection_event);

    expect(prevent_spy).toHaveBeenCalled();
    expect(stop_spy).toHaveBeenCalled();
  });
});
