import { describe, expect, it } from "vitest";
import { BLOCK_LEVEL_TAGS, decode_html_entities, html_to_plain_text, NOISE_SELECTORS, sanitize, sanitize_to_fragment } from "./html.js";

describe("sanitize & sanitize_to_fragment", () => {
  it("strips dangerous script tags and event handlers while keeping safe markup", () => {
    const clean = sanitize(`<p onclick="alert(1)">Hello <b>World</b></p><script>evil()</script>`);
    expect(clean).toContain("<p>Hello <b>World</b></p>");
    expect(clean).not.toContain("script");
    expect(clean).not.toContain("onclick");

    const fragment = sanitize_to_fragment(`<span>Safe</span><img src=x onerror=alert(1)>`);
    expect(fragment).toBeInstanceOf(DocumentFragment);
    expect(fragment.textContent).toBe("Safe");
    expect(fragment.querySelector("img")?.getAttribute("onerror")).toBeNull();
  });
});

describe("decode_html_entities", () => {
  it("decodes common named, numeric, and typographic entities", () => {
    expect(decode_html_entities("Tom &amp; Jerry &lt;3 &gt; &quot;hi&quot; &apos;bye&apos;")).toBe("Tom & Jerry <3 > \"hi\" 'bye'");
    expect(decode_html_entities("&#65;&#x42;&#39;")).toBe("AB'");
    expect(decode_html_entities("a&nbsp;b &mdash; c &hellip; d &ndash; e")).toBe("a b - c … d – e");
    expect(decode_html_entities("plain text")).toBe("plain text");
    expect(decode_html_entities("")).toBe("");
    expect(decode_html_entities(null)).toBe("");
  });
});

describe("html_to_plain_text", () => {
  it("returns empty string for empty input", () => {
    expect(html_to_plain_text("")).toBe("");
    expect(html_to_plain_text("  ")).toBe("");
    expect(html_to_plain_text(null)).toBe("");
  });

  it("extracts paragraph and list text while stripping noise tags", () => {
    const html =
      "<nav>Menu items</nav><script>alert('xss')</script><style>.x{}</style>" +
      "<p>First paragraph.</p><ul><li>Alpha</li><li>Beta</li></ul><form><button>Submit</button></form><aside>Sidebar</aside>";
    const out = html_to_plain_text(html);
    expect(out).toContain("First paragraph.");
    expect(out).toContain("Alpha");
    expect(out).toContain("Beta");
    expect(out).not.toContain("Menu items");
    expect(out).not.toContain("alert");
    expect(out).not.toContain("Submit");
    expect(out).not.toContain("Sidebar");
  });

  it("clips to max_chars and falls back cleanly without DOMParser", () => {
    const long = "<p>" + "word ".repeat(200) + "</p>";
    const clipped = html_to_plain_text(long, { max_chars: 100 });
    expect(clipped.length).toBeLessThanOrEqual(110);
    expect(clipped.endsWith("…")).toBe(true);

    const original_dom_parser = globalThis.DOMParser;
    try {
      // @ts-ignore
      delete globalThis.DOMParser;
      const out = html_to_plain_text("<div><h2>Title</h2><p>Paragraph &amp; details.<script>noise()</script></p></div>");
      expect(out).toContain("Title");
      expect(out).toContain("Paragraph & details.");
      expect(out).not.toContain("noise");
    } finally {
      globalThis.DOMParser = original_dom_parser;
    }
  });
});

describe("html_to_plain_text truncation & constants", () => {
  it("clips at word boundary and trims trailing punctuation", () => {
    expect(html_to_plain_text("<p>short</p>", { max_chars: 50 })).toBe("short");
    const out = html_to_plain_text("<p>one, two, three, four, five, six, seven, eight, nine, ten.</p>", { max_chars: 30 });
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/[,.\s]…$/);
  });

  it("exposes BLOCK_LEVEL_TAGS and NOISE_SELECTORS", () => {
    expect(BLOCK_LEVEL_TAGS.has("p")).toBe(true);
    expect(NOISE_SELECTORS).toContain("script");
  });
});
