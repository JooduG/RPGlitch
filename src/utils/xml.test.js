import { describe, expect, it } from "vitest";
import { clean_xml, CLOTHING_KEYS, escape_xml, physical_to_xml, prompt_escape, strip_leading_key_echo } from "./xml.js";

describe("escape_xml", () => {
  it("escapes special characters including quotes and brackets", () => {
    const input = `<tag attr="value" prop='single'>& [bracket]</tag>`;
    const expected = `&lt;tag attr=&quot;value&quot; prop=&apos;single&apos;&gt;&amp; &#91;bracket&#93;&lt;/tag&gt;`;
    expect(escape_xml(input)).toBe(expected);
  });

  it("handles null and non-string inputs gracefully", () => {
    expect(escape_xml(null)).toBe("");
    expect(escape_xml(undefined)).toBe("");
    expect(escape_xml(123)).toBe("");
  });
});

describe("prompt_escape", () => {
  it("escapes only XML-significant tags, preserving brackets, ampersands, and quotes", () => {
    const input = `<dialogue>He said "Hello" & [Action: wave]</dialogue>`;
    const expected = `&lt;dialogue&gt;He said "Hello" & [Action: wave]&lt;/dialogue&gt;`;
    expect(prompt_escape(input)).toBe(expected);
  });

  it("handles null and non-string inputs gracefully", () => {
    expect(prompt_escape(null)).toBe("");
    expect(prompt_escape(undefined)).toBe("");
  });
});

describe("physical_to_xml", () => {
  it("converts raw prose into a single XML text node", () => {
    const prose = "Tall, athletic build with silver hair.";
    const xml = physical_to_xml(prose, "PHYSICAL");
    expect(xml).toBe("  <PHYSICAL>Tall, athletic build with silver hair.</PHYSICAL>");
  });

  it("converts structured pseudo-JSON into child tags", () => {
    const pseudo = "[SHIRT: white tunic] [PANTS: black trousers] [INVENTORY: dagger, map]";
    const xml = physical_to_xml(pseudo, "PRESENT");
    expect(xml).toContain("  <PRESENT>");
    expect(xml).toContain("    <SHIRT>white tunic</SHIRT>");
    expect(xml).toContain("    <PANTS>black trousers</PANTS>");
    expect(xml).toContain("    <INVENTORY>dagger, map</INVENTORY>");
    expect(xml).toContain("  </PRESENT>");
  });

  it("returns empty string on empty inputs", () => {
    expect(physical_to_xml(null, "PHYSICAL")).toBe("");
    expect(physical_to_xml("", "PHYSICAL")).toBe("");
    expect(physical_to_xml({}, "PHYSICAL")).toBe("");
  });
});

describe("CLOTHING_KEYS", () => {
  it("contains canonical clothing keys in a frozen array", () => {
    expect(CLOTHING_KEYS).toContain("SHIRT");
    expect(CLOTHING_KEYS).toContain("PANTS");
    expect(CLOTHING_KEYS).toContain("ARMOR");
    expect(CLOTHING_KEYS).toContain("CLOTHING");
    expect(Object.isFrozen(CLOTHING_KEYS)).toBe(true);
  });
});

describe("physical state key canonicalization", () => {
  it("remaps non-canonical aliases to canonical keys", () => {
    const xml = physical_to_xml("[SOMA: coiled tension] [SHORTS: silk shorts] [POSE: leaning]", "PRESENT");
    expect(xml).toContain("<SOMATIC>coiled tension</SOMATIC>");
    expect(xml).toContain("<APPAREL>silk shorts</APPAREL>");
    expect(xml).toContain("<POSTURE>leaning</POSTURE>");
    expect(xml).not.toContain("<SOMA>");
    expect(xml).not.toContain("<SHORTS>");
    expect(xml).not.toContain("<POSE>");
  });

  it("lets a canonically-named key win over an aliased duplicate", () => {
    const xml = physical_to_xml("[SHORTS: denim shorts] [APPAREL: tailored suit]", "PRESENT");
    expect(xml).toContain("<APPAREL>tailored suit</APPAREL>");
    expect((xml.match(/<APPAREL>/g) || []).length).toBe(1);
    expect(xml).not.toContain("denim shorts");
  });

  it("strips an echoed KEY: prefix from its own value", () => {
    const xml = physical_to_xml("[STATE: protective, possessive]", "PRESENT");
    expect(xml).toContain("<STATE>protective, possessive</STATE>");
  });

  it("regression: does not leak a following key into the previous value", () => {
    const raw = "HAIR: dark with silver streaks at the temples DENTAL FEATURES: perfectly white sharp fangs";
    const xml = physical_to_xml(raw, "PRESENT");
    expect(xml).toContain("<HAIR>dark with silver streaks at the temples</HAIR>");
    expect(xml).toContain("<DENTAL_FEATURES>perfectly white sharp fangs</DENTAL_FEATURES>");
    expect(xml).not.toContain("temples DENTAL");
  });

  it("regression: splits a following key swallowed inside a single bracket", () => {
    const raw = "[HAIR: dark with silver streaks at the temples DENTAL FEATURES: perfectly white sharp fangs]";
    const xml = physical_to_xml(raw, "PHYSICAL");
    expect(xml).toContain("<HAIR>dark with silver streaks at the temples</HAIR>");
    expect(xml).toContain("<DENTAL_FEATURES>perfectly white sharp fangs</DENTAL_FEATURES>");
    expect(xml).not.toContain("temples DENTAL");
  });
});

describe("strip_leading_key_echo", () => {
  it("strips matching underscore or spaced key echoes", () => {
    expect(strip_leading_key_echo("STATE: protective", ["STATE"])).toBe("protective");
    expect(strip_leading_key_echo("DENTAL FEATURES: sharp fangs", ["DENTAL_FEATURES"])).toBe("sharp fangs");
    expect(strip_leading_key_echo("plain value", ["STATE"])).toBe("plain value");
  });
});

describe("clean_xml", () => {
  it("trims trailing whitespace and strips blank boundary lines", () => {
    const input = "\n  <PROMPT>   \n    <BODY>text</BODY>  \n  </PROMPT>   \n";
    const cleaned = clean_xml(input);
    expect(cleaned).toBe("  <PROMPT>\n    <BODY>text</BODY>\n  </PROMPT>");
  });

  it("handles null or empty inputs", () => {
    expect(clean_xml(null)).toBe("");
    expect(clean_xml("")).toBe("");
  });
});
