import {
  isValidImageUrl,
  extractImageUrl,
  sanitizeHtml,
  getSignatureColor,
  getContrastColor,
} from "../../../../apps/rpglitch/js/core/utils.js";
import { PALETTE as SIGNATURE_COLORS } from "../../../../apps/rpglitch/js/core/constants.js";

// Mock DOMPurify for sanitizeHtml tests
global.DOMPurify = {
  sanitize: (input) => {
    if (typeof input !== "string") return String(input ?? "");
    let sanitized = input;
    // Remove script tags
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    );
    // Remove inline event handlers
    sanitized = sanitized.replace(/on\w+=\"[^\"]*\"/gi, "");
    sanitized = sanitized.replace(/on\w+=\'[^\']*\'/gi, "");
    sanitized = sanitized.replace(/on\w+=[^\s>]+/gi, "");
    return sanitized;
  },
};

describe("validation.js", () => {
  // ============================================================================
  // isValidImageUrl() Tests
  // ============================================================================
  describe("isValidImageUrl()", () => {
    describe("valid URLs", () => {
      test("accepts https URL with jpg extension", () => {
        expect(isValidImageUrl("https://example.com/image.jpg")).toBe(true);
      });

      test("accepts http URL with png extension", () => {
        expect(isValidImageUrl("http://example.com/image.png")).toBe(true);
      });

      test("accepts blob URL", () => {
        expect(isValidImageUrl("blob:http://localhost/abc-123")).toBe(true);
      });

      test("accepts data:image URL", () => {
        expect(isValidImageUrl("data:image/png;base64,iVBORw0KGgo=")).toBe(
          true,
        );
      });

      test("accepts URL with query parameters", () => {
        expect(
          isValidImageUrl("https://example.com/image.jpg?v=123&size=large"),
        ).toBe(true);
      });

      test("accepts all valid image extensions", () => {
        const validExts = [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "svg",
          "bmp",
          "tiff",
          "tif",
          "ico",
          "avif",
          "jfif",
        ];
        validExts.forEach((ext) => {
          expect(isValidImageUrl(`https://example.com/image.${ext}`)).toBe(
            true,
          );
        });
      });

      test("accepts uppercase extensions", () => {
        expect(isValidImageUrl("https://example.com/IMAGE.JPG")).toBe(true);
      });
    });

    describe("invalid URLs", () => {
      test("rejects non-string input", () => {
        expect(isValidImageUrl(123)).toBe(false);
        expect(isValidImageUrl(null)).toBe(false);
        expect(isValidImageUrl(undefined)).toBe(false);
        expect(isValidImageUrl({})).toBe(false);
      });

      test("rejects too short string", () => {
        expect(isValidImageUrl("abc")).toBe(false);
      });

      test("rejects ftp protocol", () => {
        expect(isValidImageUrl("ftp://example.com/image.jpg")).toBe(false);
      });

      test("rejects javascript protocol", () => {
        expect(isValidImageUrl("javascript:alert(1)")).toBe(false);
      });

      test("rejects data URL without image MIME type", () => {
        expect(isValidImageUrl("data:text/plain,hello")).toBe(false);
      });

      test("rejects URL without image extension", () => {
        expect(isValidImageUrl("https://example.com/document.pdf")).toBe(false);
      });

      test("rejects malformed URLs", () => {
        expect(isValidImageUrl("not-a-url")).toBe(false);
        expect(isValidImageUrl("///")).toBe(false);
      });
    });
  });

  // ============================================================================
  // extractImageUrl() Tests
  // ============================================================================
  describe("extractImageUrl()", () => {
    describe("active plugin formats", () => {
      test("extracts from text-to-image standard format { imageUrl }", () => {
        const result = { imageUrl: "https://example.com/image.jpg" };
        expect(extractImageUrl(result)).toBe("https://example.com/image.jpg");
      });

      test("extracts from text-to-image data URL format { dataUrl }", () => {
        const result = { dataUrl: "data:image/png;base64,abc123" };
        expect(extractImageUrl(result)).toBe("data:image/png;base64,abc123");
      });

      test("extracts from upload plugin format { url }", () => {
        const result = { url: "blob:http://localhost/abc-123" };
        expect(extractImageUrl(result)).toBe("blob:http://localhost/abc-123");
      });

      test("extracts from legacy direct string format", () => {
        const result = "https://example.com/image.jpg";
        expect(extractImageUrl(result)).toBe("https://example.com/image.jpg");
      });
    });

    describe("deprecated formats", () => {
      test("returns URL for old text-to-image { imageId, fileExtension }", () => {
        const result = { imageId: "12345", fileExtension: "jpeg" };
        expect(extractImageUrl(result)).toBe(
          "https://img.perchance.org/12345.jpeg",
        );
      });

      test("returns undefined for nested upload { file: { url } }", () => {
        const result = { file: { url: "https://example.com/image.jpg" } };
        expect(extractImageUrl(result)).toBeUndefined();
      });

      test('returns undefined for direct file { file: "..." }', () => {
        const result = { file: "https://example.com/image.jpg" };
        expect(extractImageUrl(result)).toBeUndefined();
      });

      test('returns undefined for unusual { name: "..." }', () => {
        const result = { name: "https://example.com/image.jpg" };
        expect(extractImageUrl(result)).toBeUndefined();
      });

      test('returns undefined for generic { value: "..." }', () => {
        const result = { value: "https://example.com/image.jpg" };
        expect(extractImageUrl(result)).toBeUndefined();
      });
    });

    describe("edge cases", () => {
      test("trims whitespace from extracted URLs", () => {
        const result = { imageUrl: "  https://example.com/image.jpg  " };
        expect(extractImageUrl(result)).toBe("https://example.com/image.jpg");
      });

      test("returns undefined for empty string after trim", () => {
        const result = { imageUrl: "   " };
        expect(extractImageUrl(result)).toBeUndefined();
      });

      test("returns undefined for null input", () => {
        expect(extractImageUrl(null)).toBeUndefined();
      });

      test("returns undefined for undefined input", () => {
        expect(extractImageUrl(undefined)).toBeUndefined();
      });

      test("returns undefined for empty object", () => {
        expect(extractImageUrl({})).toBeUndefined();
      });

      test("handles String objects correctly", () => {
        const result = { url: new String("https://example.com/image.jpg") };
        expect(extractImageUrl(result)).toBe("https://example.com/image.jpg");
      });
    });
  });

  // ============================================================================
  // sanitizeHtml() Tests
  // ============================================================================
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

  // ============================================================================
  // SIGNATURE_COLORS Tests
  // ============================================================================
  // ============================================================================
  // SIGNATURE_COLORS Tests
  // ============================================================================
  describe("SIGNATURE_COLORS", () => {
    test("exports correct V5 Vibrant Mix values", () => {
      // Warms
      expect(SIGNATURE_COLORS.red).toBe("#ef4444");
      expect(SIGNATURE_COLORS.orange).toBe("#f97316");
      expect(SIGNATURE_COLORS.amber).toBe("#f59e0b");
      expect(SIGNATURE_COLORS.yellow).toBe("#eab308");

      // Greens
      expect(SIGNATURE_COLORS.lime).toBe("#84cc16");
      expect(SIGNATURE_COLORS.emerald).toBe("#10b981");

      // Cools
      expect(SIGNATURE_COLORS.cyan).toBe("#06b6d4");
      expect(SIGNATURE_COLORS.sky).toBe("#0ea5e9");
      expect(SIGNATURE_COLORS.indigo).toBe("#6366f1");
      expect(SIGNATURE_COLORS.violet).toBe("#8b5cf6");
      expect(SIGNATURE_COLORS.purple).toBe("#a855f7");
      expect(SIGNATURE_COLORS.pink).toBe("#ec4899");

      // Defaults
      expect(SIGNATURE_COLORS.default).toBe("#a855f7"); // Synced to Purple 500
    });
  });

  // ============================================================================
  // getSignatureColor() Tests
  // ============================================================================
  describe("getSignatureColor()", () => {
    test("returns correct color for valid V5 keys", () => {
      expect(getSignatureColor("pink")).toBe("#ec4899");
      expect(getSignatureColor("emerald")).toBe("#10b981");
      expect(getSignatureColor("cyan")).toBe("#06b6d4");
      expect(getSignatureColor("orange")).toBe("#f97316");
      expect(getSignatureColor("purple")).toBe("#a855f7");
    });

    test("returns default color for invalid key", () => {
      expect(getSignatureColor("invalid")).toBe("#a855f7"); // Purple default
      expect(getSignatureColor("")).toBe("#a855f7");
    });

    test("returns default color for null/undefined", () => {
      expect(getSignatureColor(null)).toBe("#a855f7");
      expect(getSignatureColor(undefined)).toBe("#a855f7");
    });
  });

  // ============================================================================
  // getContrastColor() Tests
  // ============================================================================
  describe("getContrastColor()", () => {
    describe("6-digit hex format", () => {
      test("returns black for light colors", () => {
        expect(getContrastColor("#ffffff")).toBe("#000"); // white
      });

      test("returns white for dark colors", () => {
        expect(getContrastColor("#000000")).toBe("#fff"); // black
        expect(getContrastColor("#a21caf")).toBe("#fff"); // pink (darkened)
        expect(getContrastColor("#0e7490")).toBe("#fff"); // cyan (darkened)
      });
      // ... existing hex format tests ...
      test("handles colors with # prefix", () => {
        expect(getContrastColor("#ffffff")).toBe("#000");
      });

      test("handles colors without # prefix", () => {
        expect(getContrastColor("ffffff")).toBe("#000");
      });
    });

    describe("3-digit hex format", () => {
      test("expands 3-digit hex to 6-digit", () => {
        expect(getContrastColor("#fff")).toBe("#000"); // white
        expect(getContrastColor("#000")).toBe("#fff"); // black
      });

      test("handles 3-digit hex without # prefix", () => {
        expect(getContrastColor("fff")).toBe("#000");
        expect(getContrastColor("000")).toBe("#fff");
      });

      test("correctly calculates contrast for 3-digit colors", () => {
        expect(getContrastColor("#f00")).toBe("#fff"); // red (dark)
        expect(getContrastColor("#0f0")).toBe("#000"); // lime (light)
      });
    });

    describe("invalid input handling", () => {
      test("returns default #000 for non-string input", () => {
        expect(getContrastColor(123)).toBe("#000");
        expect(getContrastColor(null)).toBe("#000");
        expect(getContrastColor(undefined)).toBe("#000");
        expect(getContrastColor({})).toBe("#000");
      });

      test("returns default #000 for empty string", () => {
        expect(getContrastColor("")).toBe("#000");
      });

      test("returns default #000 for invalid hex length", () => {
        expect(getContrastColor("#ff")).toBe("#000"); // too short
        expect(getContrastColor("#fffffff")).toBe("#000"); // too long
        expect(getContrastColor("#fffff")).toBe("#000"); // 5 digits
      });

      test("returns default #000 for invalid hex characters", () => {
        expect(getContrastColor("#zzz")).toBe("#000");
        expect(getContrastColor("#12g45h")).toBe("#000");
      });
    });

    describe("edge cases", () => {
      test("handles mid-range luminance correctly", () => {
        // Color right at the threshold (luminance ~0.5)
        expect(getContrastColor("#808080")).toBe("#000"); // gray
      });

      test("handles signature colors contrast appropriately", () => {
        // V5 Vibrant Mix Strategy:
        // Dark colors -> White Text
        // Light colors -> Black Text (natural contrast)
        // *Note: Chat UI overrides this with Text Shadows to force White.*

        // Dark Group (Expect White)
        expect(getContrastColor(SIGNATURE_COLORS.red)).toBe("#fff");
        expect(getContrastColor(SIGNATURE_COLORS.violet)).toBe("#fff"); // Violet is White
        expect(getContrastColor(SIGNATURE_COLORS.indigo)).toBe("#fff");
        expect(getContrastColor(SIGNATURE_COLORS.zinc)).toBe("#fff");
        expect(getContrastColor(SIGNATURE_COLORS.sky)).toBe("#fff");

        // Light Group (Expect Black - High Vibrancy - YIQ >= 128)
        expect(getContrastColor(SIGNATURE_COLORS.yellow)).toBe("#000");
        expect(getContrastColor(SIGNATURE_COLORS.lime)).toBe("#000");
        expect(getContrastColor(SIGNATURE_COLORS.cyan)).toBe("#000"); // Cyan Black
        expect(getContrastColor(SIGNATURE_COLORS.purple)).toBe("#000"); // Purple Black (barely)
      });
    });
  });
});
