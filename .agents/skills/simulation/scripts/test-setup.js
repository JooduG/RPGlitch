/**
 * @file tests/setup.js
 * 🧪 TEST SETUP  —  Browser Environment Mocking
 *
 * This file configures the global test environment. It provides mocks for
 * browser-native APIs like `window.generate_text` that are present on Perchance but
 * missing in Node/JSDOM.
 */

import { vi } from "vitest";

// Ensure window.generate_text exists to prevent reference errors in purified simulation code.
// In development, we bridge it to our Node.js provider.
// Mock ResizeObserver for bits-ui primitives in JSDOM
import "fake-indexeddb/auto";

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof window !== "undefined") {
  // Mock AudioContext for Web Audio API in JSDOM
  if (!window.AudioContext && !window.webkitAudioContext) {
    const mock_audio_context = class AudioContext {
      constructor() {
        this.state = "running";
        this.destination = {};
      }
      createGain() {
        return {
          connect: vi.fn(),
          gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        };
      }
      createBufferSource() {
        return {
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          buffer: null,
          playbackRate: { value: 1 },
        };
      }
      decodeAudioData(_array_buffer, success_callback) {
        const mock_buffer = { duration: 1, length: 1000, sampleRate: 44100 };
        if (success_callback) success_callback(mock_buffer);
        return Promise.resolve(mock_buffer);
      }
      suspend() {
        this.state = "suspended";
        return Promise.resolve();
      }
      resume() {
        this.state = "running";
        return Promise.resolve();
      }
      close() {
        this.state = "closed";
        return Promise.resolve();
      }
    };
    window.AudioContext = mock_audio_context;
    window.webkitAudioContext = mock_audio_context;
  }

  // Mock matchMedia for Svelte 5 media query runes
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  // Mock Element.animate for Svelte transitions in JSDOM
  if (typeof Element !== "undefined" && !Element.prototype.animate) {
    Element.prototype.animate = vi.fn().mockReturnValue({
      finished: Promise.resolve(),
      cancel: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      reverse: vi.fn(),
      onfinish: null,
      oncancel: null,
    });
  }

  // Mock HTMLDialogElement for JSDOM
  if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = vi.fn(function () {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function () {
      this.open = false;
    });
  }

  // Mock window.location for JSDOM to prevent "navigation to another Document" error
  try {
    const original_location = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: {
        href: original_location?.href || "http://localhost:3000",
        origin: original_location?.origin || "http://localhost:3000",
        protocol: original_location?.protocol || "http:",
        host: original_location?.host || "localhost:3000",
        hostname: original_location?.hostname || "localhost",
        port: original_location?.port || "3000",
        pathname: original_location?.pathname || "/",
        search: original_location?.search || "",
        hash: original_location?.hash || "",
        reload: vi.fn(),
        assign: vi.fn(),
        replace: vi.fn(),
      },
    });
  } catch (_error) {
    // Ignore if already configured or unconfigurable
  }

  // Mock HTMLAnchorElement.prototype.click for JSDOM downloads to prevent "Not implemented: navigation to another Document"
  if (typeof HTMLAnchorElement !== "undefined") {
    HTMLAnchorElement.prototype.click = vi.fn(function () {
      this.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
  }

  window.generate_text = vi.fn(async (_instruction, _options = {}) => {
    // Note: This only runs during tests.
    return "[Simulated AI Response]";
  });
}

/**
 * [HELPER] Mock LLM Success
 * Use this in tests to override the provider and simulate a specific response.
 */
export const mock_llm_success = (text) => {
  if (window.generate_text) {
    vi.mocked(window.generate_text).mockResolvedValue(text);
  }
};

// --- CLEANUP & TEARDOWN --- //
import { afterAll } from "vitest";

afterAll(async () => {
  try {
    // Dynamically import to avoid breaking test environments that don't need it
    const { db } = await import("../../../../src/data/db.js");
    if (db && typeof db.close === "function") {
      db.close();
    }
  } catch {
    // Ignore if db.js is unresolvable or fails to load during teardown
  }
});
