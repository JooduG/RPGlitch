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

  init = () => {
    this._setupWorkerListener = () => {
      this.worker.onmessage = (e) => this.handleMessage(e);
      this.worker.onerror = (e) => {
        console.error("[WorkerBridge] Worker Error:", e);
        this.resolveActive(false);
        this.isReady = false;
      };
      this.isReady = true;
    };

    if (window.RPGLITCH_WORKER_SOURCE) {
      try {
        const blob = new Blob([window.RPGLITCH_WORKER_SOURCE], {
          type: "application/javascript",
        });
        const url = URL.createObjectURL(blob);
        this.worker = new Worker(url);
        this._setupWorkerListener();
      } catch (e) {
        console.error("[WorkerBridge] Failed to spawn embedded worker:", e);
      }
      return;
    }

    try {
      this.worker = new Worker("js/engine/physics/worker.js", {
        type: "module",
      });
      this._setupWorkerListener();
    } catch (e) {
      console.warn(
        "[WorkerBridge] No worker source found and Dev fallback failed.",
        e,
      );
    }
  };

  handleMessage = (e) => {
    const { type, payload, meta } = e.data;

    if (type === "CMD_LLM_REQUEST") {
      this.handleLlmProxy(payload, meta);
    } else if (type === "CMD_UPDATE_COMPLETE") {
      if (payload?.error)
        console.error("[WorkerBridge] Worker Reported Error:", payload.error);
      this.resolveActive(payload);

      if (payload?.success) {
        events.dispatchEvent(
          new CustomEvent(EVENTS.DB_UPDATED, {
            detail: { type: "background-update" },
          }),
        );
        if (payload.entity)
          events.dispatchEvent(
            new CustomEvent(EVENTS.ENTITY_UPDATED, { detail: payload.entity }),
          );
      }
    }
  };

  handleLlmProxy = async (payload, meta) => {
    try {
      const result = await LlmService.generate(payload, { silent: true });
      this.worker.postMessage({
        type: "CMD_LLM_RESPONSE",
        payload: { text: result },
        meta,
      });
    } catch (err) {
      console.warn("[WorkerBridge] Proxy Optimization Error (Silent):", err);
      this.worker.postMessage({
        type: "CMD_LLM_RESPONSE",
        payload: { text: "", error: err.message },
        meta,
      });
    }
  };

  resolveActive = (success) => {
    if (this.activePromise) {
      this.activePromise.resolve(success);
      this.activePromise = null;
    }
  };

  runBackgroundUpdate = async (storyId, targetType, linkedMessageId) => {
    if (!this.isReady || this.activePromise) return false;

    return new Promise((resolve) => {
      const safetyTimeout = setTimeout(() => {
        if (this.activePromise) {
          console.error("[WorkerBridge] Update timed out.");
          this.resolveActive(false);
        }
      }, 30000);

      this.activePromise = {
        resolve: (val) => {
          clearTimeout(safetyTimeout);
          resolve(val);
        },
      };

      try {
        this.worker.postMessage({
          type: "CMD_START_UPDATE",
          payload: { storyId, targetType, linkedMessageId },
        });
      } catch (err) {
        console.error("[WorkerBridge] PostMessage failed:", err);
        this.resolveActive(false);
      }
    });
  };
}

// Singleton Instance
export const bridge = new WorkerBridge();
