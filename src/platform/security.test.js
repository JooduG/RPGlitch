import { security } from "@platform";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
const sanitize_html = security.sanitize;
const sanitize_to_fragment = security.sanitize_to_fragment;
// Mock DOMPurify for sanitize_html tests
vi.mock("dompurify", () => ({
  default: {
    sanitize: vi.fn((input, options) => {
      let str = typeof input !== "string" ? String(input || "") : input;
      // Simple mock logic for stripping script tags and onerror in unit tests
      str = str.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "").replace(/onerror\s*=\s*["']?([^"']+)["']?/gim, "");
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
  describe("sanitize_html()", () => {
    test("removes script tags", () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const output = sanitize_html(input);
      expect(output).not.toContain("<script>");
      expect(output).toContain("<p>Hello</p>");
    });
    test("removes inline event handlers", () => {
      const input = '<img src="x" onerror="alert(1)">';
      const output = sanitize_html(input);
      expect(output).not.toContain("onerror");
    });
    test("preserves safe HTML", () => {
      const input = "<p>Hello <strong>World</strong></p>";
      const output = sanitize_html(input);
      expect(output).toBe(input);
    });
    test("handles non-string input gracefully", () => {
      expect(sanitize_html(123)).toBe("123");
      expect(sanitize_html(null)).toBe("");
      expect(sanitize_html(undefined)).toBe("");
    });
    test("handles empty string", () => {
      expect(sanitize_html("")).toBe("");
    });
  });

  describe("escape_html()", () => {
    test("escapes HTML special characters including quotes", () => {
      const input = "<b>Hello</b> \"World\" & 'Peace'";
      const output = security.escape_html(input);
      expect(output).toBe("&lt;b&gt;Hello&lt;/b&gt; &quot;World&quot; &amp; &#39;Peace&#39;");
    });

    test("handles non-string inputs", () => {
      expect(security.escape_html(123)).toBe("123");
      expect(security.escape_html(0)).toBe("0");
      expect(security.escape_html(true)).toBe("true");
      expect(security.escape_html(null)).toBe("");
      expect(security.escape_html(undefined)).toBe("");
    });
  });

  describe("sanitize_to_fragment()", () => {
    test("returns a DocumentFragment-like object", () => {
      const input = "<p>Hello</p>";
      const output = sanitize_to_fragment(input);
      expect(output.nodeType).toBe(11); // DocumentFragment nodeType
      expect(output.__isMockFragment).toBe(true);
    });
    test("removes script tags in fragment text content", () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const output = sanitize_to_fragment(input);
      expect(output.textContent).not.toContain("<script>");
      expect(output.textContent).toContain("<p>Hello</p>");
    });
  });
  describe("validate_image()", () => {
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
        const sliced_parts = [];
        let current_pos = 0;
        for (const part of this.parts) {
          const part_end = current_pos + part.byteLength;
          if (part_end > start && current_pos < end) {
            const relative_start = Math.max(0, start - current_pos);
            const relative_end = Math.min(part.byteLength, end - current_pos);
            sliced_parts.push(part.slice(relative_start, relative_end));
          }
          current_pos = part_end;
          if (current_pos >= end) break;
        }
        return new MockFile(sliced_parts, this.name, { type: this.type });
      }
    }

    test("should validate a correct JPEG file", async () => {
      const file = new MockFile([JPEG_HEADER], "test.jpg", { type: "image/jpeg" });
      await expect(security.validate_image(file)).resolves.toBe(true);
    });

    test("should validate a correct PNG file", async () => {
      const file = new MockFile([PNG_HEADER], "test.png", { type: "image/png" });
      await expect(security.validate_image(file)).resolves.toBe(true);
    });

    test("should validate a correct GIF file", async () => {
      const file = new MockFile([GIF_HEADER], "test.gif", { type: "image/gif" });
      await expect(security.validate_image(file)).resolves.toBe(true);
    });

    test("should validate a correct WebP file", async () => {
      const file = new MockFile([WEBP_HEADER], "test.webp", { type: "image/webp" });
      await expect(security.validate_image(file)).resolves.toBe(true);
    });

    test("should throw error if file is too large", async () => {
      const file = new MockFile([JPEG_HEADER], "large.jpg", {
        type: "image/jpeg",
        size: 30 * 1024 * 1024,
      });
      await expect(security.validate_image(file)).rejects.toThrow(/File too large/);
    });

    test("should throw error for invalid MIME type", async () => {
      const file = new MockFile([new Uint8Array([0, 0, 0, 0])], "test.exe", {
        type: "application/x-msdownload",
      });
      await expect(security.validate_image(file)).rejects.toThrow(/Invalid file type/);
    });

    test("should throw error if magic numbers don't match", async () => {
      const file = new MockFile([JPEG_HEADER], "fake.png", { type: "image/png" });
      await expect(security.validate_image(file)).rejects.toThrow(/Security verification failed/);
    });
  });

  describe("environment hardening", () => {
    let original_onerror;
    let original_resize_observer;
    let original_add_event_listener;

    beforeEach(() => {
      original_onerror = window.onerror;
      original_resize_observer = window.ResizeObserver;
      original_add_event_listener = window.addEventListener;
    });

    afterEach(() => {
      window.onerror = original_onerror;
      window.ResizeObserver = original_resize_observer;
      window.addEventListener = original_add_event_listener;
      vi.restoreAllMocks();
    });

    test("does not monkey-patch global ResizeObserver or window.addEventListener", () => {
      security.install_environment_hardening();
      expect(window.ResizeObserver).toBe(original_resize_observer);
      expect(window.addEventListener).toBe(original_add_event_listener);
    });

    test("suppresses ResizeObserver loop messages via window.onerror", () => {
      security.install_environment_hardening();
      const result = window.onerror?.("ResizeObserver loop completed with undelivered notifications.", "test.js", 1, 1, new Error("loop"));
      expect(result).toBe(true);
    });

    test("passes non-ResizeObserver errors to original window.onerror", () => {
      const custom_onerror = vi.fn().mockReturnValue(false);
      window.onerror = custom_onerror;

      security.install_environment_hardening();

      const err = new Error("General Runtime Error");
      const result = window.onerror?.("General Runtime Error", "test.js", 1, 1, err);

      expect(custom_onerror).toHaveBeenCalledWith("General Runtime Error", "test.js", 1, 1, err);
      expect(result).toBe(false);
    });

    test("filters ResizeObserver loop errors in window error event listeners", () => {
      security.install_environment_hardening();

      const listener = vi.fn();
      window.addEventListener("error", listener);

      const ro_event = new Event("error");
      Object.defineProperty(ro_event, "message", { value: "ResizeObserver loop limit exceeded" });
      window.dispatchEvent(ro_event);

      expect(listener).not.toHaveBeenCalled();

      const normal_event = new Event("error");
      Object.defineProperty(normal_event, "message", { value: "Uncaught ReferenceError: foo is not defined" });
      window.dispatchEvent(normal_event);

      expect(listener).toHaveBeenCalledWith(normal_event);
    });

    test("silences Perchance sandbox Symbol and numActualScriptLines error events", () => {
      security.install_environment_hardening();

      const symbol_event = new Event("error", { cancelable: true });
      Object.defineProperty(symbol_event, "message", { value: "Cannot convert a Symbol value to a string" });
      const prevent_spy = vi.spyOn(symbol_event, "preventDefault");
      const stop_spy = vi.spyOn(symbol_event, "stopPropagation");

      window.dispatchEvent(symbol_event);

      expect(prevent_spy).toHaveBeenCalled();
      expect(stop_spy).toHaveBeenCalled();
    });

    test("silences Perchance sandbox unhandledrejection events", () => {
      security.install_environment_hardening();

      const reason = new Error("numActualScriptLines is not defined");
      const rejection_event = new CustomEvent("unhandledrejection", {
        cancelable: true,
        detail: { reason },
      });
      Object.defineProperty(rejection_event, "reason", { value: reason });
      const prevent_spy = vi.spyOn(rejection_event, "preventDefault");
      const stop_spy = vi.spyOn(rejection_event, "stopPropagation");

      window.dispatchEvent(rejection_event);

      expect(prevent_spy).toHaveBeenCalled();
      expect(stop_spy).toHaveBeenCalled();
    });
  });

  describe("session checkpointing", () => {
    beforeEach(() => {
      window.name = "";
      window.sessionStorage.clear();
      security.clear_session_checkpoint();
    });

    test("round-trips a checkpoint through sessionStorage", () => {
      security.save_session_checkpoint({ story_id: "story-42", round: 7, phase: "generating" });
      expect(security.load_session_checkpoint()).toEqual({ story_id: "story-42", round: 7, phase: "generating" });
    });

    test("coerces missing story id and round to safe defaults", () => {
      security.save_session_checkpoint({ story_id: null, round: undefined, phase: undefined });
      expect(security.load_session_checkpoint()).toEqual({ story_id: null, round: 0, phase: "idle" });
    });

    test("clears the checkpoint", () => {
      security.save_session_checkpoint({ story_id: "story-1", round: 0, phase: "idle" });
      security.clear_session_checkpoint();
      expect(security.load_session_checkpoint()).toBeNull();
    });

    test("returns null when nothing is stored", () => {
      expect(security.load_session_checkpoint()).toBeNull();
    });

    test("writes to window.name when sessionStorage is blocked", () => {
      const ss_get = vi.spyOn(window.sessionStorage.__proto__, "getItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      const ss_set = vi.spyOn(window.sessionStorage.__proto__, "setItem").mockImplementation(() => {
        throw new Error("blocked");
      });

      security.clear_session_checkpoint();
      security.save_session_checkpoint({ story_id: "story-9", round: 3, phase: "idle" });
      expect(window.name).toBe(`__RPGLITCH_CHECKPOINT__:${JSON.stringify({ story_id: "story-9", round: 3, phase: "idle" })}`);

      ss_get.mockRestore();
      ss_set.mockRestore();
    });

    test("restores from window.name when sessionStorage is blocked on a cold load", () => {
      security.clear_session_checkpoint();
      const ss_get = vi.spyOn(window.sessionStorage.__proto__, "getItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      window.name = `__RPGLITCH_CHECKPOINT__:${JSON.stringify({ story_id: "story-9", round: 3, phase: "idle" })}`;

      expect(security.load_session_checkpoint()).toEqual({ story_id: "story-9", round: 3, phase: "idle" });
      ss_get.mockRestore();
    });
  });
});
