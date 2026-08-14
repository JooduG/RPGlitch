import { afterEach, describe, expect, it, vi } from "vitest";
import { fetch_web_content, sanitize_llm } from "./transport.js";

vi.mock("@utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    escape_xml: vi.fn((s) => s),
    stream_bridge: { start: vi.fn(), update: vi.fn(), end: vi.fn() },
    collapse_history: vi.fn(),
  };
});

describe("sanitize_llm", () => {
  it("returns an empty string for empty input", () => {
    expect(sanitize_llm("")).toBe("");
    expect(sanitize_llm(null)).toBe("");
    expect(sanitize_llm(undefined)).toBe("");
  });

  it("preserves a closing double quote from dialogue at message end", () => {
    const input = 'She smiled and turned away. "We\'ll see."';
    expect(sanitize_llm(input)).toBe(input);
  });

  it("preserves a closing single quote from dialogue at message end", () => {
    const input = "He dropped his voice. 'Doubt it, love.'";
    expect(sanitize_llm(input)).toBe(input);
  });

  it("preserves a closing quote even when the line is a bare trailing dialogue beat", () => {
    const input = 'The door creaked open. "...so you came after all."';
    expect(sanitize_llm(input)).toBe(input);
  });

  it("preserves paired outer quotes (whole-message dialogue)", () => {
    const input = '"Even now, I remember the exact color of your coat."';
    expect(sanitize_llm(input)).toBe(input);
  });

  it("strips an unmatched leading quote artifact", () => {
    expect(sanitize_llm('"Here is your response: the sky is blue')).toBe("Here is your response: the sky is blue");
    expect(sanitize_llm("'A stray opening quote artifact")).toBe("A stray opening quote artifact");
  });

  it("does not corrupt a lone quote character", () => {
    expect(sanitize_llm('"')).toBe('"');
    expect(sanitize_llm("'")).toBe("'");
  });

  it("still strips conversational filler prefixes", () => {
    expect(sanitize_llm("Sure, here is your answer: The vault is sealed.")).toBe("The vault is sealed.");
    expect(sanitize_llm("Certainly: Step inside.")).toBe("Step inside.");
  });

  it("still strips code fences", () => {
    const input = "```js\nconst x = 1;\n```";
    expect(sanitize_llm(input)).toBe("const x = 1;");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitize_llm("   hello world   ")).toBe("hello world");
  });
});

describe("fetch_web_content", () => {
  const HTML = `<html><body><nav>Menu</nav><script>alert(1)</script><p>Vael was born on the salt coast.</p><p>She never trusted the harbor master.</p></body></html>`;

  function stub_super_fetch(impl) {
    Object.defineProperty(window, "superFetch", { value: impl, configurable: true, writable: true });
    return impl;
  }

  afterEach(() => {
    delete window.superFetch;
    delete window.pluginSuperFetch;
  });

  it("fetches HTML via superFetch and returns clean plain text", async () => {
    stub_super_fetch(vi.fn(async () => ({ ok: true, status: 200, text: async () => HTML })));
    const { url, text } = await fetch_web_content("https://example.com/wiki/Vael");
    expect(url).toBe("https://example.com/wiki/Vael");
    expect(text).toContain("Vael was born on the salt coast.");
    expect(text).toContain("She never trusted the harbor master.");
    expect(text).not.toContain("Menu");
    expect(text).not.toContain("alert");
  });

  it("clips to the character ingestion budget by default", async () => {
    const long_html = `<body><p>${"word ".repeat(4000)}</p></body>`;
    stub_super_fetch(vi.fn(async () => ({ ok: true, status: 200, text: async () => long_html })));
    const { text } = await fetch_web_content("https://example.com/long");
    expect(text.length).toBeLessThanOrEqual(8020);
    expect(text.endsWith("…")).toBe(true);
  });

  it("uses the larger world budget for fractal imports", async () => {
    const long_html = `<body><p>${"word ".repeat(4500)}</p></body>`;
    stub_super_fetch(vi.fn(async () => ({ ok: true, status: 200, text: async () => long_html })));
    const { text } = await fetch_web_content("https://example.com/lore", { type: "fractal" });
    expect(text.length).toBeGreaterThan(8000);
  });

  it("rejects non-https URLs before any network call", async () => {
    const spy = stub_super_fetch(vi.fn());
    await expect(fetch_web_content("http://insecure.example.com")).rejects.toThrow(/Blocked URL scheme "http:"/);
    expect(spy).not.toHaveBeenCalled();
  });

  it("surfaces HTTP error statuses", async () => {
    stub_super_fetch(vi.fn(async () => ({ ok: false, status: 404, text: async () => "missing" })));
    await expect(fetch_web_content("https://example.com/nope")).rejects.toThrow(/HTTP 404/);
  });

  it("throws a clear error when the page has no readable text", async () => {
    stub_super_fetch(
      vi.fn(async () => ({ ok: true, status: 200, text: async () => "<html><body><script>x()</script><nav>menu</nav></body></html>" })),
    );
    await expect(fetch_web_content("https://example.com/blank")).rejects.toThrow(/No readable text/);
  });

  it("throws when superFetch is unavailable outside local dev", async () => {
    await expect(fetch_web_content("https://example.com/x")).rejects.toThrow(/superFetch plugin unavailable/);
  });
});
