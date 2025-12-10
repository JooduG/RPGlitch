import { events, EVENTS } from "./core-events.js";

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
        if (!window.RPGLITCH_WORKER_SOURCE) {
            console.warn("[WorkerBridge] No worker source found. Background updates disabled.");
            return;
        }

        try {
            const blob = new Blob([window.RPGLITCH_WORKER_SOURCE], { type: "application/javascript" });
            const url = URL.createObjectURL(blob);
            this.worker = new Worker(url);

            this.worker.onmessage = (e) => this.handleMessage(e);
            this.worker.onerror = (e) => {
                console.error("[WorkerBridge] Worker Error:", e);
                this.resolveActive(false);
            };

            console.log("[WorkerBridge] Worker spawned successfully.");
            this.isReady = true;

        } catch (e) {
            console.error("[WorkerBridge] Failed to spawn worker:", e);
            this.isReady = false;
        }
    }

    handleMessage(e) {
        const { type, payload, meta } = e.data;

        if (type === 'CMD_LLM_REQUEST') {
            this.handleLlmProxy(payload, meta);
        } else if (type === 'CMD_UPDATE_COMPLETE') {
            const success = payload?.success;
            if (payload?.error) console.error("[WorkerBridge] Worker Reported Error:", payload.error);
            this.resolveActive(success);

            if (success) {
                events.dispatchEvent(new CustomEvent(EVENTS.DB_UPDATED, { detail: { type: 'background-update' } }));
            }
        }
    }

    async handleLlmProxy(payload, meta) {
        if (!window.ai) {
            console.error("[WorkerBridge] window.ai unavailable for proxy request.");
            this.worker.postMessage({
                type: 'CMD_LLM_RESPONSE',
                payload: { text: "", error: "No AI Plugin" },
                meta
            });
            return;
        }

        try {
            // Reconstruct the instruction from the payload (copied logic from llm-adapter)
            // Note: worker sent us the 'payload' object from ContextBuilder

            const chatHistory = (payload.messages || [])
                .map(m => {
                    const label = m.role === "user" ? "User" : m.characterName || "Character";
                    return `${label}: ${m.text}`;
                })
                .join("\n\n");

            const instruction = [
                payload.system,
                chatHistory ? `\n[CONVERSATION HISTORY]\n${chatHistory}` : "",
                payload.startWith ? `\n${payload.startWith}` : ""
            ].filter(Boolean).join("\n");

            // Execute on Main Thread
            const result = await window.ai(instruction, {
                temperature: payload.params?.temperature,
                top_p: payload.params?.top_p,
                max_tokens: payload.params?.maxTokens,
                model: payload.params?.model,
                stop_sequences: payload.stopSequences || [],
            });

            // Send back to Worker
            this.worker.postMessage({
                type: 'CMD_LLM_RESPONSE',
                payload: { text: result },
                meta
            });

        } catch (err) {
            console.error("[WorkerBridge] Proxy Optimization Error:", err);
            this.worker.postMessage({
                type: 'CMD_LLM_RESPONSE',
                payload: { text: "", error: err.message },
                meta
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
                type: 'CMD_START_UPDATE',
                payload: { storyId, targetType, linkedMessageId }
            });
        });
    }
}

// Singleton Instance
export const bridge = new WorkerBridge();
