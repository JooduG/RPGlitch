import { afterEach, describe, expect, it, vi } from "vitest";
import { fetch_web, validate_image, validate_url } from "./ingestion.js";

describe("validate_url", () => {
  it("accepts https URLs and rejects invalid or unsafe schemes", () => {
    expect(validate_url("https://example.com/wiki")).toBe("https://example.com/wiki");
    expect(() => validate_url("")).toThrow("A URL is required.");
    expect(() => validate_url("javascript:alert(1)")).toThrow('Blocked URL scheme "javascript:"');
    expect(() => validate_url("http://example.com")).toThrow('Blocked URL scheme "http:"');
    expect(validate_url("http://example.com", { allow_http: true })).toBe("http://example.com/");
  });

  it("enforces optional allowed_hosts suffix matching", () => {
    expect(validate_url("https://sub.example.com/a", { allowed_hosts: ["example.com"] })).toBe("https://sub.example.com/a");
    expect(() => validate_url("https://evil.com/a", { allowed_hosts: ["example.com"] })).toThrow("not on the allowed list");
  });
});

describe("validate_image", () => {
  it("accepts valid PNG headers and rejects mismatched magic bytes or oversized files", async () => {
    const png_bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const valid_file = new File([png_bytes], "avatar.png", { type: "image/png" });
    await expect(validate_image(valid_file)).resolves.toBe(true);

    const fake_file = new File([new Uint8Array([0x00, 0x01, 0x02, 0x03])], "fake.png", { type: "image/png" });
    await expect(validate_image(fake_file)).rejects.toThrow("does not match its declared type");

    await expect(validate_image(valid_file, { max_size: 4 })).rejects.toThrow("File too large");
  });
});

describe("fetch_web", () => {
  afterEach(() => {
    delete window.fetch_web;
  });

  it("fetches and extracts plain text through window.fetch_web", async () => {
    window.fetch_web = vi.fn().mockResolvedValue({ status: 200, text: async () => "<article><p>Lore paragraph.</p><script>bad()</script></article>" });

    const result = await fetch_web("https://example.com/lore");
    expect(result).toEqual({ url: "https://example.com/lore", text: "Lore paragraph." });
  });

  it("rejects non-2xx responses from super-fetch", async () => {
    window.fetch_web = vi.fn().mockResolvedValue({ status: 404, text: async () => "Not Found" });
    await expect(fetch_web("https://example.com/missing")).rejects.toThrow("HTTP 404");
  });
});
