import { describe, test, expect, vi, beforeEach } from "vitest";
import { AppBootstrap } from "./bootstrap.js";
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
});
