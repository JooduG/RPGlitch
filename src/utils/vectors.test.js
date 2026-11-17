import { describe, expect, it } from "vitest";
import { cosine_similarity, deserialize_embedding, dequantize_vector_q8, quantize_vector_q8, serialize_embedding } from "./vectors.js";

describe("vectors (L2 cosine + Q8 codec)", () => {
  describe("cosine_similarity", () => {
    it("computes exact similarity for normalized unit vectors", () => {
      const a = [1, 0, 0];
      const b = [1, 0, 0];
      expect(cosine_similarity(a, b)).toBe(1);

      const orthogonal = [0, 1, 0];
      expect(cosine_similarity(a, orthogonal)).toBe(0);

      const opposite = [-1, 0, 0];
      expect(cosine_similarity(a, opposite)).toBe(-1);
    });

    it("normalizes unnormalized vectors (L2-safe)", () => {
      expect(cosine_similarity([3, 4], [3, 4])).toBeCloseTo(1, 10);
      expect(cosine_similarity([2, 0], [0, 5])).toBeCloseTo(0, 10);
      expect(cosine_similarity([1, 1], [2, 2])).toBeCloseTo(1, 10);
      expect(cosine_similarity([1, 2], [2, 1])).toBeCloseTo(0.8, 10);
    });

    it("handles Float32Array inputs", () => {
      const a = new Float32Array([0.6, 0.8]);
      const b = new Float32Array([0.6, 0.8]);
      expect(cosine_similarity(a, b)).toBeCloseTo(1, 4);
    });

    it("returns 0 on null, undefined, empty, or mismatched vectors", () => {
      expect(cosine_similarity(null, [1, 2])).toBe(0);
      expect(cosine_similarity([1, 2], null)).toBe(0);
      expect(cosine_similarity([], [])).toBe(0);
      expect(cosine_similarity([1, 2], [1, 2, 3])).toBe(0);
    });
  });

  describe("serialize_embedding", () => {
    it("reinterprets non-Float32Array views by byte length", () => {
      const f32 = new Float32Array([0.5, -0.25]);
      const bytes = new Uint8Array(f32.buffer, f32.byteOffset, f32.byteLength);
      expect(serialize_embedding(bytes)).toEqual([0.5, -0.25]);
    });

    it("handles zero-length views as null", () => {
      expect(serialize_embedding(new Uint8Array(0))).toBeNull();
      expect(serialize_embedding(null)).toBeNull();
    });
  });

  describe("codec guards + round-trip", () => {
    it("rejects wrong-dimension and non-finite payloads", () => {
      expect(deserialize_embedding(new Float32Array(383))).toBeNull();
      expect(deserialize_embedding(new Array(384).fill(0).map((v, i) => (i === 7 ? NaN : v)))).toBeNull();
      expect(deserialize_embedding(null)).toBeNull();
    });

    it("round-trips quantize/dequantize within tolerance", () => {
      const vec = new Float32Array(384).map((_, i) => (i % 2 === 0 ? 0.5 : -0.5));
      const quantized = quantize_vector_q8(vec);
      const restored = dequantize_vector_q8(quantized, 384);
      expect(restored.length).toBe(384);
      expect(Math.abs(restored[0] - 0.5)).toBeLessThan(0.01);
      expect(Math.abs(restored[1] - -0.5)).toBeLessThan(0.01);
    });
  });
});
