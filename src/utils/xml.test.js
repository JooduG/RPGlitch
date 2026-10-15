import { describe, expect, it } from "vitest";
import {
  clean_xml,
  CLOTHING_KEYS,
  dedent_all,
  escape_xml,
  prompt_escape,
  render_atom_xml,
  render_profile_field_block,
  render_xml_tag,
  strip_leading_key_echo,
} from "./xml.js";

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

describe("render_atom_xml", () => {
  it("renders a direct atom with default tag envelope", () => {
    const atom = { tag: "DIRECTIVE", body: "Advance the scene independently." };
    const xml = render_atom_xml(atom);
    expect(xml).toBe("<DIRECTIVE>\nAdvance the scene independently.\n</DIRECTIVE>");
  });

  it("renders direct atom with inline: true", () => {
    const atom = { tag: "LAW", body: "Causality first.", attrs: { id: "L1" }, inline: true };
    const xml = render_atom_xml(atom);
    expect(xml).toBe('<LAW id="L1">Causality first.</LAW>');
  });

  it("interpolates tokens in atom body", () => {
    const atom = { tag: "ROLE", body: "You are {name} within {setting}." };
    const xml = render_atom_xml(atom, { values: { name: "Silvers", setting: "Tartarus" } });
    expect(xml).toContain("You are Silvers within Tartarus.");
  });

  it("supports body_only: true to return raw prompt text", () => {
    const atom = { tag: "DIRECTIVE", body: "Raw instruction without tag." };
    const text = render_atom_xml(atom, { body_only: true });
    expect(text).toBe("Raw instruction without tag.");
    expect(text).not.toContain("<DIRECTIVE>");
  });

  it("supports catalog lookup with dotted key", () => {
    const catalog = {
      MOMENTUM: {
        CRITICAL: { tag: "MOMENTUM", body: "Force dynamic change now.", attrs: { tier: "critical" } },
      },
    };
    const xml = render_atom_xml(catalog, "MOMENTUM.CRITICAL");
    expect(xml).toContain('<MOMENTUM tier="critical">');
    expect(xml).toContain("Force dynamic change now.");
  });

  it("allows tag override and attribute merging", () => {
    const atom = { tag: "BASE_TAG", body: "Directive body", attrs: { original: "true" } };
    const xml = render_atom_xml(atom, { tag: "CUSTOM_TAG", attrs: { added: "yes" } });
    expect(xml).toContain('<CUSTOM_TAG original="true" added="yes">');
    expect(xml).toContain("</CUSTOM_TAG>");
  });

  it("returns empty string on missing atom or invalid key", () => {
    expect(render_atom_xml(null)).toBe("");
    expect(render_atom_xml({}, "INVALID.KEY")).toBe("");
  });
});

describe("render_profile_field_block", () => {
  it("renders self-closing tag when all rows are compacted attributes", () => {
    const rows = ['build="athletic"', 'hair="black"'];
    const xml = render_profile_field_block("APPEARANCE", rows);
    expect(xml).toBe('<APPEARANCE build="athletic" hair="black" />');
  });

  it("renders open and close tags when child elements exist", () => {
    const rows = ['jacket="worn leather"', "<SCARS>Deep scar on jaw</SCARS>"];
    const xml = render_profile_field_block("CURRENT_LOOK", rows);
    expect(xml).toContain('<CURRENT_LOOK jacket="worn leather">');
    expect(xml).toContain("  <SCARS>Deep scar on jaw</SCARS>");
    expect(xml).toContain("</CURRENT_LOOK>");
  });

  it("returns null on empty rows", () => {
    expect(render_profile_field_block("APPEARANCE", [])).toBeNull();
    expect(render_profile_field_block("APPEARANCE", null)).toBeNull();
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

describe("render_xml_tag", () => {
  it("renders an inline single-line body", () => {
    expect(render_xml_tag({ tag: "ROLE", attrs: { name: "Ada" }, children: ["hello"], inline: true })).toBe(`<ROLE name="Ada">hello</ROLE>`);
  });

  it("keeps a multi-line body as an indented block even when inline is set", () => {
    expect(render_xml_tag({ tag: "A", children: ["x\ny"], inline: true })).toBe("<A>\nx\ny\n</A>");
  });

  it("drops null and blank children and joins the rest with the separator", () => {
    expect(render_xml_tag({ tag: "A", children: ["", null, "b", "   ", "c"] })).toBe("<A>\nb\n\nc\n</A>");
  });

  it("escapes attribute values and drops blank/null attributes", () => {
    expect(render_xml_tag({ tag: "T", attrs: { a: `x"<&`, b: "", c: null }, children: ["b"] })).toBe(`<T a="x&quot;&lt;&amp;">\nb\n</T>`);
  });

  it("emits only the open tag for a blank open-only envelope", () => {
    expect(render_xml_tag({ tag: "SYS", children: [], closed: false })).toBe("<SYS>");
    expect(render_xml_tag({ tag: "SYS", children: ["   "], closed: false })).toBe("<SYS>");
  });

  it("shifts the whole block (open, body, close) by indent", () => {
    expect(render_xml_tag({ tag: "A", children: ["b"], indent: 2 })).toBe("  <A>\n  b\n  </A>");
  });

  it("indents the joined body relative to the open tag via child_indent", () => {
    const xml = render_xml_tag({ tag: "A", children: ["x", "y"], child_indent: 2 });
    expect(xml).toContain("<A>\n  x");
    expect(xml).toContain("  y\n</A>");
  });

  it("normalizes a pre-indented child block to a uniform depth", () => {
    const child = "  <ENTITIES>\n    <X>1</X>\n  </ENTITIES>";
    expect(render_xml_tag({ tag: "SYSTEM", children: [child], child_indent: 2 })).toBe(
      "<SYSTEM>\n  <ENTITIES>\n    <X>1</X>\n  </ENTITIES>\n</SYSTEM>",
    );
  });
});

describe("dedent_all", () => {
  it("removes the common leading indentation and boundary blank lines", () => {
    expect(dedent_all("\n    <A>\n      <B>x</B>\n    </A>\n")).toBe("<A>\n  <B>x</B>\n</A>");
  });

  it("preserves relative indentation inside the block", () => {
    expect(dedent_all("  a\n      b\n    c")).toBe("a\n    b\n  c");
  });

  it("returns an empty string for blank input", () => {
    expect(dedent_all("")).toBe("");
    expect(dedent_all("   \n  ")).toBe("");
    expect(dedent_all(null)).toBe("");
  });
});

describe("indentation parity", () => {
  it("keeps every open/close tag pair at the same indentation", () => {
    const child = render_xml_tag({
      tag: "CORE_PROTOCOLS",
      children: [render_xml_tag({ tag: "SIMULATION_FIDELITY", children: ["text"], child_indent: 2 })],
      indent: 2,
      child_indent: 2,
    });
    const xml = render_xml_tag({ tag: "SYSTEM", attrs: { role: "DIRECTOR" }, children: [child], child_indent: 2 });
    const open_indentation = new Map();
    const close_indentation = new Map();
    for (const line of xml.split("\n")) {
      const match = line.match(/^( *)(<\/?)([A-Z][A-Z0-9_]*)/);
      if (!match) continue;
      const [, spaces, bracket, tag_name] = match;
      const target = bracket === "</" ? close_indentation : open_indentation;
      target.set(tag_name, spaces.length);
    }
    open_indentation.forEach((indent, tag_name) => {
      expect(close_indentation.get(tag_name)).toBe(indent);
    });
    expect(open_indentation.get("SYSTEM")).toBe(0);
    expect(open_indentation.get("CORE_PROTOCOLS")).toBe(2);
    expect(open_indentation.get("SIMULATION_FIDELITY")).toBe(4);
  });
});
