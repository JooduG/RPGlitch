import { describe, test, expect, vi, beforeEach } from "vitest";
import { AppBootstrap, reset_bootstrap_guard } from "./bootstrap.js";
import * as repository from "@data/repository.js";
vi.mock("@data/repository.js", () => ({
  seed_premades: vi.fn(),
}));
vi.mock("@state/runtime.svelte.js", () => ({
  runtime: {
    sync: vi.fn(),
  },
}));
vi.mock("svelte", () => ({
  mount: vi.fn(),
}));
vi.mock("../../App.svelte", () => ({
  default: {},
}));
describe("AppBootstrap", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
    reset_bootstrap_guard();
  });
  test("escapes error stack using textContent when initialization fails", async () => {
    const maliciousPayload = "<img src=x onerror=alert(1)>";
    const error = new Error("Critical Failure");
    error.stack = maliciousPayload;
    // Mocking seed_premades to throw
    vi.mocked(repository.seed_premades).mockRejectedValue(error);
    // Silencing the expected error log for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await AppBootstrap.init();
    expect(document.body.innerHTML).toContain("SYSTEM HALTED");
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

  test("does not use direct innerHTML assignment for the entire error template", async () => {
    const error = new Error("INTENTIONAL_REACTION");
    vi.mocked(repository.seed_premades).mockRejectedValue(error);

    const innerHTMLSpy = vi.spyOn(document.body, "innerHTML", "set");

    await AppBootstrap.init();

    // We want this to be false, indicating we used a safer method like replaceChildren or append with a fragment
    // Note: If we use sanitizeToFragment, we might still be using innerHTML internally in DOMPurify or when appending,
    // but the goal is to avoid direct document.body.innerHTML = "..." with untrusted or even static-but-large strings.
    // Actually, if we use document.body.replaceChildren(fragment), innerHTML setter on body won't be called.
    expect(innerHTMLSpy).not.toHaveBeenCalled();
    innerHTMLSpy.mockRestore();
  });
});
