import { ERROR_MESSAGES } from "../gamemaster/config.js";
import { log, error as utilsError } from "../gamemaster/utils.js";

/**
 * Service to abstract the Perchance AI plugin (`window.ai`).
 * Handles formatting, error management, and plugin communication.
 */
export const LlmService = {
  /**
   * Generates text using the AI plugin.
   * @param {Object} payload - The context payload { system, messages, params, stopSequences, startWith }.
   * @param {Object} options - Execution options { temperature, silent, signal, onToken }.
   * @returns {Promise<string>} The generated text.
   */
  generate: async (payload, options = {}) => {
    if (!window.ai) {
      const msg = "Perchance AI plugin not available.";
      if (!options.silent) {
        // We only alert if not silent, but we always throw so the caller can handle flow.
        utilsError(msg);
        import("../mesmer/ui/core/modal.js").then(({ showAlert }) => {
          showAlert("Engine Error", msg);
        });
      }
      throw new Error(msg);
    }

    // 1. Format History
    // Critical: Use m.characterName if available. Format: "Name: Message"
    const chatHistory = LlmService._formatHistory(payload.messages || []);

    // 2. Construct Final Instruction
    const instruction = [
      payload.system,
      chatHistory ? `\n[CONVERSATION HISTORY]\n${chatHistory}` : "",
      payload.startWith ? `\n${payload.startWith}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      // 3. Prepare Plugin Options
      const genOptions = {
        temperature: options.temperature ?? payload.params?.temperature,
        top_p: options.top_p ?? payload.params?.top_p,
        repetition_penalty:
          options.repetition_penalty ?? payload.params?.repetition_penalty,
        max_tokens: options.maxTokens ?? payload.params?.maxTokens,
        model: options.model ?? payload.params?.model,
        stop_sequences: payload.stopSequences || [],
        signal: options.signal,
        silent: options.silent,
      };

      // 4. Call Plugin
      const result = await window.ai(instruction, genOptions);

      // Simulate streaming callback if provided
      if (options.onToken && typeof options.onToken === "function") {
        options.onToken(result);
      }

      return result;
    } catch (err) {
      if (options.silent) {
        log("[LlmService] Silent Generation Error (Suppressed):", err);
        throw err;
      }

      // Handle specific connection errors
      const errString = String(err);

      // [STALE SESSION HANDLING]
      // Detect 400/403/Fetch errors typical of expiring Perchance sessions
      const isStale =
        errString.includes("400") ||
        errString.includes("401") ||
        errString.includes("403") ||
        errString.includes("Fetch failed") ||
        errString.includes("invalid_key");

      if (isStale) {
        log("[LlmService] Stale Session or Invalid Key Detected.");

        // Dynamic import to avoid circular dependency
        const { showAlert } = await import("../mesmer/ui/core/modal.js");

        if (errString.includes("invalid_key")) {
          showAlert(
            "Engine Error",
            "The AI engine reported an invalid key. This usually happens after a brief period of inactivity. Please refresh the page.",
          );
        } else {
          showAlert(
            "Session Stale",
            "Your connection to the AI engine has expired. Please refresh the page to reconnect.",
          );
        }

        // Return null to fail gracefully
        return null;
      }

      if (
        errString.includes("stream keep alive") ||
        errString.includes("timeout") ||
        errString.includes("NetworkError")
      ) {
        utilsError("[LlmService] Network Error:", err);
        throw new Error(
          `${ERROR_MESSAGES.CONNECTION_LOST} This is often caused by Ad-Blockers blocking the 'keep-alive' signal. Please check your network settings.`,
        );
      }

      // Re-throw unknown errors
      throw err;
    }
  },

  /**
   * Formats the message history for the LLM.
   * @param {Array} messages - List of message objects { role, text, characterName }.
   * @returns {string} Formatted history string.
   */
  _formatHistory: (messages) =>
    messages
      .map((m) => {
        // Map roles to labels
        let label = "Character";
        if (m.characterName) {
          label = m.characterName;
        } else if (m.role === "user") {
          label = "User";
        }

        // Schema Harmonization: Use .content (V6) or .text (Legacy)
        const text = m.content || m.text || "";
        return `${label}: ${text}`;
      })
      .join("\n\n"),
};
