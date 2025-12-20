import { events, EVENTS } from "../../core/events.js";
import { LlmService } from "../../services/llm-service.js";

/**
 * WorkerBridge
 * Effectively a "Driver" for the Background Worker.
 * Handles the Main Thread side of the proxy:
 * 1. Spawning the Worker from the injected Blob.
 * 2. Sending commands to the Worker.
 * 3. Listening for LLM requests from the Worker and fulfilling them via window.ai.
 */

export class WorkerBridge {
  constructor() {
    this.worker = null;
    this.activePromise = null;
    this.isReady = false;
    this.init();
  }

  init() {
    this._setupWorkerListener = () => {
      this.worker.onmessage = (e) => this.handleMessage(e);
      this.worker.onerror = (e) => {
        console.error("[WorkerBridge] Worker Error:", e);
        this.resolveActive(false);
      };
      this.isReady = true;
    };

    // PROD: Use Injected Blob (Single File)
    if (window.RPGLITCH_WORKER_SOURCE) {
      try {
        const blob = new Blob([window.RPGLITCH_WORKER_SOURCE], {
          type: "application/javascript",
        });
        const url = URL.createObjectURL(blob);
        this.worker = new Worker(url);
        this._setupWorkerListener();
        console.log("[WorkerBridge] Worker spawned (Embedded Mode).");
      } catch (e) {
        console.error("[WorkerBridge] Failed to spawn embedded worker:", e);
      }
      return;
    }

    // DEV: Use File Path (Module Mode)
    // We assume if source is missing, we are in a dev environment serving individual files.
    try {
      this.worker = new Worker("js/engine/physics/worker.js", {
        type: "module",
      });
      this._setupWorkerListener();
      console.log("[WorkerBridge] Worker spawned (Dev/Module Mode).");
    } catch (e) {
      console.warn(
        "[WorkerBridge] No worker source found and Dev fallback failed. Background updates disabled.",
        e,
      );
    }
  }

  handleMessage(e) {
    const { type, payload, meta } = e.data;

    if (type === "CMD_LLM_REQUEST") {
      this.handleLlmProxy(payload, meta);
    } else if (type === "CMD_UPDATE_COMPLETE") {
      const success = payload?.success;
      if (payload?.error)
        console.error("[WorkerBridge] Worker Reported Error:", payload.error);
      this.resolveActive(success);

      if (success) {
        events.dispatchEvent(
          new CustomEvent(EVENTS.DB_UPDATED, {
            detail: { type: "background-update" },
          }),
        );
      }
    }
  }

  async handleLlmProxy(payload, meta) {
    try {
      // Use LlmService for consistent generation logic
      const result = await LlmService.generate(payload, {
        silent: true, // Suppress alerts for background tasks
      });

      this.worker.postMessage({
        type: "CMD_LLM_RESPONSE",
        payload: { text: result },
        meta,
      });
    } catch (err) {
      console.warn("[WorkerBridge] Proxy Optimization Error (Silent):", err);
      // We do NOT alert() here because this is a background worker task.
      // Just report back to the worker that it failed.
      this.worker.postMessage({
        type: "CMD_LLM_RESPONSE",
        payload: { text: "", error: err.message },
        meta,
      });
    }
  }

  resolveActive(success) {
    if (this.activePromise) {
      this.activePromise.resolve(success);
      this.activePromise = null;
    }
  }

  // --- API ---

  async runBackgroundUpdate(storyId, targetType, linkedMessageId) {
    if (!this.isReady) {
      console.warn("[WorkerBridge] Worker not ready. Skipping update.");
      return false;
    }

    if (this.activePromise) {
      console.warn("[WorkerBridge] Update already in progress. Debouncing.");
      return false;
    }

    return new Promise((resolve) => {
      this.activePromise = { resolve };
      this.worker.postMessage({
        type: "CMD_START_UPDATE",
        payload: { storyId, targetType, linkedMessageId },
      });
    });
  }
}

// Singleton Instance
export const bridge = new WorkerBridge();
