import { describe, expect, it, vi } from "vitest";
import { format_conversation_history, llm_service, looks_truncated, raw_stop_reason, raw_to_text, sanitize_llm } from "./transport.js";

vi.mock("@utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    escape_xml: vi.fn((s) => s),
    stream_bridge: {
      start: vi.fn(),
      update: vi.fn(),
      end: vi.fn(),
      is_active: vi.fn().mockReturnValue(false),
    },
    collapse_history: vi.fn((messages) => messages.map((m) => ({ ...m, content: m.content || m.text || "" }))),
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

describe("looks_truncated", () => {
  it("returns false for non-string or empty inputs", () => {
    expect(looks_truncated("")).toBe(false);
    expect(looks_truncated("   ")).toBe(false);
    expect(looks_truncated(null)).toBe(false);
  });

  it("identifies properly punctuated sentences as complete", () => {
    expect(looks_truncated("The corridor was silent.")).toBe(false);
    expect(looks_truncated("Is someone there?")).toBe(false);
    expect(looks_truncated("Watch out!")).toBe(false);
    expect(looks_truncated("She hesitated…")).toBe(false);
  });

  it("identifies quotes closing after terminal punctuation as complete", () => {
    expect(looks_truncated('"Step inside."')).toBe(false);
    expect(looks_truncated('"Who goes there?"')).toBe(false);
  });

  it("flags cut-off sentences ending without punctuation", () => {
    expect(looks_truncated("The door slowly opened to reveal a")).toBe(true);
    expect(looks_truncated('"He stopped abruptly')).toBe(true);
  });

  it("flags think-only responses as truncated", () => {
    expect(looks_truncated("<think>Analyzing variables.</think>")).toBe(true);
    expect(looks_truncated("<think>No prose generated</think>   ")).toBe(true);
  });
});

describe("raw_to_text and raw_stop_reason", () => {
  it("unwraps string primitives and String objects with generatedText or text", () => {
    expect(raw_to_text("hello")).toBe("hello");
    expect(raw_to_text({ text: "  greeting  " })).toBe("greeting");
    expect(raw_to_text({ generatedText: "output" })).toBe("output");
    expect(raw_to_text(null)).toBe("");
  });

  it("extracts stopReason from plugin String object", () => {
    const fake_string_obj = new String("cut text");
    // @ts-ignore
    fake_string_obj.stopReason = "length";

    expect(raw_stop_reason(fake_string_obj)).toBe("length");
    expect(raw_stop_reason("normal primitive")).toBe("");
    expect(raw_stop_reason(null)).toBe("");
  });
});

describe("format_conversation_history", () => {
  it("formats messages into XML tags with origin and turn", () => {
    const messages = [
      { role: "USER_PERSONA", content: "Hello" },
      { role: "AI_CHARACTER", character_name: "Iris", content: "Greetings." },
    ];
    const formatted = format_conversation_history(messages);
    expect(formatted).toContain('<ENTRY origin="User" round="1">Hello</ENTRY>');
    expect(formatted).toContain('<ENTRY origin="Character" round="2">Greetings.</ENTRY>');
  });

  it("prefers the entity id origin when present", () => {
    const messages = [{ role: "AI_CHARACTER", character_name: "Iris", origin: "iris", content: "Greetings." }];
    const formatted = format_conversation_history(messages);
    expect(formatted).toContain('<ENTRY origin="iris" round="1">Greetings.</ENTRY>');
  });

  it("returns empty string when no messages are provided", () => {
    expect(format_conversation_history([])).toBe("");
  });
});

describe("llm_service instruction envelope", () => {
  it("nests conversation history and the task inside <SYSTEM>, closing after the task", async () => {
    let captured = "";
    globalThis.window = globalThis;
    // @ts-ignore
    window.generate_text = async (opts) => {
      captured = typeof opts.instruction === "function" ? opts.instruction() : opts.instruction;
      return "ok";
    };
    try {
      await llm_service.generate(
        {
          system: '<SYSTEM round="5" mode="narrator">',
          messages: [{ role: "USER_PERSONA", origin: "SILVERS", content: "I wait." }],
          task: "<TASK></TASK>",
          system_close: "</SYSTEM>",
        },
        { silent: true, raw: true },
      );
    } finally {
      // @ts-ignore
      delete window.generate_text;
    }
    const history = captured.indexOf("<CONVERSATION_HISTORY>");
    const history_close = captured.indexOf("</CONVERSATION_HISTORY>");
    const task = captured.indexOf("<TASK>");
    const system_close = captured.indexOf("</SYSTEM>");
    expect(history).toBeGreaterThan(-1);
    expect(task).toBeGreaterThan(history_close);
    expect(system_close).toBeGreaterThan(task);
  });
});

describe("llm_service mock and enhance", () => {
  it("enhances payload by delegating to generate and sanitizing", async () => {
    const spy = vi.spyOn(llm_service, "generate").mockResolvedValue("Sure: The sun rose.");
    const result = await llm_service.enhance({ system: "test" });
    expect(result).toBe("The sun rose.");
    spy.mockRestore();
  });
});
