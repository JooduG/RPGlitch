import { Security } from "@platform";
import { describe, expect, test, vi } from "vitest";
const sanitizeHtml = Security.sanitize;
const sanitizeToFragment = Security.sanitizeToFragment;
// Mock DOMPurify for sanitizeHtml tests
vi.mock("dompurify", () => ({
  default: {
    sanitize: vi.fn((input, options) => {
      let str = typeof input !== "string" ? String(input || "") : input;
      // Simple mock logic for stripping script tags and onerror in unit tests
      str = str
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/onerror\s*=\s*["']?([^"']+)["']?/gim, "");
      if (options && options.RETURN_DOM_FRAGMENT) {
        // Mock a document fragment with some simple properties for tests
        return {
          nodeType: 11, // DocumentFragment
          textContent: str,
          __isMockFragment: true,
        };
      }
      return str;
    }),
  },
}));
describe("validation.js", () => {
  describe("sanitizeHtml()", () => {
    test("removes script tags", () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("<script>");
      expect(output).toContain("<p>Hello</p>");
    });
    test("removes inline event handlers", () => {
      const input = '<img src="x" onerror="alert(1)">';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("onerror");
    });
    test("preserves safe HTML", () => {
      const input = "<p>Hello <strong>World</strong></p>";
      const output = sanitizeHtml(input);
      expect(output).toBe(input);
    });
    test("handles non-string input gracefully", () => {
      expect(sanitizeHtml(123)).toBe("123");
      expect(sanitizeHtml(null)).toBe("");
      expect(sanitizeHtml(undefined)).toBe("");
    });
    test("handles empty string", () => {
      expect(sanitizeHtml("")).toBe("");
    });
  });

  describe("escape()", () => {
    test("escapes HTML special characters including quotes", () => {
      const input = "<b>Hello</b> \"World\" & 'Peace'";
      const output = Security.escape(input);
      expect(output).toBe("&lt;b&gt;Hello&lt;/b&gt; &quot;World&quot; &amp; &#39;Peace&#39;");
    });

    test("handles non-string inputs", () => {
      expect(Security.escape(123)).toBe("123");
      expect(Security.escape(0)).toBe("0");
      expect(Security.escape(true)).toBe("true");
      expect(Security.escape(null)).toBe("");
      expect(Security.escape(undefined)).toBe("");
    });
  });

  describe("sanitizeToFragment()", () => {
    test("returns a DocumentFragment-like object", () => {
      const input = "<p>Hello</p>";
      const output = sanitizeToFragment(input);
      expect(output.nodeType).toBe(11); // DocumentFragment nodeType
      expect(output.__isMockFragment).toBe(true);
    });
    test("removes script tags in fragment text content", () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const output = sanitizeToFragment(input);
      expect(output.textContent).not.toContain("<script>");
      expect(output.textContent).toContain("<p>Hello</p>");
    });
  });
  describe("validateImage()", () => {
    const JPEG_HEADER = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const PNG_HEADER = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const GIF_HEADER = new Uint8Array([0x47, 0x49, 0x46, 0x38]);
    const WEBP_HEADER = new Uint8Array([
      0x52,
      0x49,
      0x46,
      0x46, // RIFF
      0x00,
      0x00,
      0x00,
      0x00,
      0x57,
      0x45,
      0x42,
      0x50, // WEBP
    ]);

    // Mock File for Vitest
    /**
     *
     */
    class MockFile {
      /**
       * @param {any[]} parts
       * @param {string} filename
       * @param {{ type: any; size?: any; lastModified?: any; webkitRelativePath?: any; }} properties
       */
      constructor(parts, filename, properties) {
        this.parts = parts;
        this.name = filename;
        this.type = properties.type;
        this.size = properties.size || parts.reduce((acc, p) => acc + p.byteLength, 0);
        this.lastModified = properties.lastModified || Date.now();
        this.webkitRelativePath = properties.webkitRelativePath || "";
      }
      /**
       *
       */
      async bytes() {
        return new Uint8Array(await this.arrayBuffer());
      }
      /**
       *
       */
      stream() {
        return new ReadableStream({
          start: async (controller) => {
            controller.enqueue(await this.bytes());
            controller.close();
          },
        });
      }
      /**
       *
       */
      async text() {
        return new TextDecoder().decode(await this.arrayBuffer());
      }
      /**
       *
       */
      async arrayBuffer() {
        const combined = new Uint8Array(this.parts.reduce((acc, p) => acc + p.byteLength, 0));
        let offset = 0;
        for (const part of this.parts) {
          combined.set(new Uint8Array(part), offset);
          offset += part.byteLength;
        }
        return combined.buffer;
      }
      /**
       * @param {number} start
       * @param {number} end
       */
      slice(start, end) {
        const slicedParts = [];
        let currentPos = 0;
        for (const part of this.parts) {
          const partEnd = currentPos + part.byteLength;
          if (partEnd > start && currentPos < end) {
            const relativeStart = Math.max(0, start - currentPos);
            const relativeEnd = Math.min(part.byteLength, end - currentPos);
            slicedParts.push(part.slice(relativeStart, relativeEnd));
          }
          currentPos = partEnd;
          if (currentPos >= end) break;
        }
        return new MockFile(slicedParts, this.name, { type: this.type });
      }
    }

    test("should validate a correct JPEG file", async () => {
      const file = new MockFile([JPEG_HEADER], "test.jpg", { type: "image/jpeg" });
      await expect(Security.validateImage(file)).resolves.toBe(true);
    });

    test("should validate a correct PNG file", async () => {
      const file = new MockFile([PNG_HEADER], "test.png", { type: "image/png" });
      await expect(Security.validateImage(file)).resolves.toBe(true);
    });

    test("should validate a correct GIF file", async () => {
      const file = new MockFile([GIF_HEADER], "test.gif", { type: "image/gif" });
      await expect(Security.validateImage(file)).resolves.toBe(true);
    });

    test("should validate a correct WebP file", async () => {
      const file = new MockFile([WEBP_HEADER], "test.webp", { type: "image/webp" });
      await expect(Security.validateImage(file)).resolves.toBe(true);
    });

    test("should throw error if file is too large", async () => {
      const file = new MockFile([JPEG_HEADER], "large.jpg", {
        type: "image/jpeg",
        size: 10 * 1024 * 1024,
      });
      await expect(Security.validateImage(file)).rejects.toThrow(/File too large/);
    });

    test("should throw error for invalid MIME type", async () => {
      const file = new MockFile([new Uint8Array([0, 0, 0, 0])], "test.exe", {
        type: "application/x-msdownload",
      });
      await expect(Security.validateImage(file)).rejects.toThrow(/Invalid file type/);
    });

    test("should throw error if magic numbers don't match", async () => {
      const file = new MockFile([JPEG_HEADER], "fake.png", { type: "image/png" });
      await expect(Security.validateImage(file)).rejects.toThrow(/Security verification failed/);
    });
  });
});
