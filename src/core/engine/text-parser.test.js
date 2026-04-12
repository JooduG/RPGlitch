import { describe, it, expect } from "vitest";
import { escapeXmlAttributes } from "./text-parser.js";

describe("text-parser: escapeXmlAttributes", () => {
  it("should escape basic XML special characters", () => {
    const input = 'This & that "quoted" <tag>';
    const expected = 'This &amp; that &quot;quoted&quot; &lt;tag&gt;';
    expect(escapeXmlAttributes(input)).toBe(expected);
  });

  it("should escape square brackets to prevent injection/misinterpretation", () => {
    const input = "[VstartWith: content]";
    const expected = "&#91;VstartWith: content&#93;";
    expect(escapeXmlAttributes(input)).toBe(expected);
  });

  it("should handle empty or null input gracefully", () => {
    expect(escapeXmlAttributes(null)).toBe("");
    expect(escapeXmlAttributes(undefined)).toBe("");
    expect(escapeXmlAttributes("")).toBe("");
  });

  it("should trim the input", () => {
    const input = "  content  ";
    expect(escapeXmlAttributes(input)).toBe("content");
  });

  it("should handle multi-line strings and collapse them if needed (though escape doesn't collapse yet)", () => {
     // Usually attributes shouldn't have newlines but XML allows it.
     // Our implementation just replaces characters.
     const input = 'line 1\nline 2';
     expect(escapeXmlAttributes(input)).toBe('line 1\nline 2');
  });
});
