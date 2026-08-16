import { describe, expect, it } from "vitest";
import { decode_html_entities, html_to_plain_text, INGESTION_CHAR_LIMIT, INGESTION_LORE_LIMIT, truncate_readable } from "./html.js";

describe("decode_html_entities", () => {
  it("decodes common named entities", () => {
    expect(decode_html_entities("Tom &amp; Jerry &lt;3 &gt; &quot;hi&quot; &apos;bye&apos;")).toBe("Tom & Jerry <3 > \"hi\" 'bye'");
  });

  it("decodes numeric decimal and hex references", () => {
    expect(decode_html_entities("&#65;&#x42;&#39;")).toBe("AB'");
  });

  it("decodes typographic entities", () => {
    expect(decode_html_entities("a&nbsp;b &mdash; c &hellip; d")).toBe("a b — c … d");
  });

  it("leaves plain text untouched", () => {
    expect(decode_html_entities("plain text")).toBe("plain text");
  });
});

describe("html_to_plain_text", () => {
  it("returns empty string for empty input", () => {
    expect(html_to_plain_text("")).toBe("");
    expect(html_to_plain_text("  ")).toBe("");
    expect(html_to_plain_text(null)).toBe("");
  });

  it("extracts paragraph text", () => {
    const html = "<html><body><p>First paragraph.</p><p>Second paragraph.</p></body></html>";
    const out = html_to_plain_text(html);
    expect(out).toContain("First paragraph.");
    expect(out).toContain("Second paragraph.");
    expect(out).toMatch(/\n/);
  });

  it("strips script, style, nav, and form content entirely", () => {
    const html =
      "<nav>Menu items</nav><script>alert('xss')</script><style>.x{}</style>" +
      "<p>Real content.</p><form><input><button>Submit</button></form><aside>Sidebar</aside>";
    const out = html_to_plain_text(html);
    expect(out).not.toContain("Menu items");
    expect(out).not.toContain("alert");
    expect(out).not.toContain(".x{}");
    expect(out).not.toContain("Submit");
    expect(out).not.toContain("Sidebar");
    expect(out).toContain("Real content.");
  });

  it("treats list items as separate lines", () => {
    const html = "<ul><li>Alpha</li><li>Beta</li></ul>";
    const out = html_to_plain_text(html);
    expect(out).toContain("Alpha");
    expect(out).toContain("Beta");
    expect(out).toMatch(/Alpha\s*\n/);
  });

  it("decodes entities inside extracted text", () => {
    const html = "<p>R&amp;D &amp; more</p>";
    expect(html_to_plain_text(html)).toContain("R&D & more");
  });

  it("clips to max_chars via truncate_readable", () => {
    const long = "<p>" + "word ".repeat(200) + "</p>";
    const out = html_to_plain_text(long, { max_chars: 100 });
    expect(out.length).toBeLessThanOrEqual(110);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("truncate_readable", () => {
  it("returns text unchanged when within budget", () => {
    expect(truncate_readable("short", 50)).toBe("short");
  });

  it("clips at a word boundary with an ellipsis", () => {
    const words = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"];
    const text = words.join(" ");
    const out = truncate_readable(text, 18);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThan(22);
    // The final word before the ellipsis must be an intact word from the source.
    const last_word = out.replace(/…$/, "").split(" ").pop();
    expect(words).toContain(last_word);
  });

  it("trims trailing punctuation before the ellipsis", () => {
    const text = "one, two, three, four, five, six, seven, eight, nine, ten.";
    const out = truncate_readable(text, 30);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/,…|\.…/);
    expect(out).not.toMatch(/\s…$/);
  });

  it("handles empty and non-string input", () => {
    expect(truncate_readable("")).toBe("");
    expect(truncate_readable(null)).toBe("");
    expect(truncate_readable(undefined)).toBe("");
  });
});

describe("ingestion budgets", () => {
  it("exposes the documented character and lore limits", () => {
    expect(INGESTION_CHAR_LIMIT).toBe(8000);
    expect(INGESTION_LORE_LIMIT).toBe(10000);
    expect(INGESTION_LORE_LIMIT).toBeGreaterThan(INGESTION_CHAR_LIMIT);
  });
});
