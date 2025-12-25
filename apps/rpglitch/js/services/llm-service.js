/**
 * Service to abstract the Perchance AI plugin (`window.ai`).
 * Handles formatting, error management, and plugin communication.
 */
export class LlmService {
  /**
   * Generates text using the AI plugin.
   * @param {Object} payload - The context payload { system, messages, params, stopSequences, startWith }.
   * @param {Object} options - Execution options { temperature, silent, signal, onToken }.
   * @returns {Promise<string>} The generated text.
   */
  static async generate(payload, options = {}) {
    if (!window.ai) {
      const msg = "Perchance AI plugin not available.";
      if (!options.silent) {
        // We only alert if not silent, but we always throw so the caller can handle flow.
        console.error(msg);
        alert(msg);
      }
      throw new Error(msg);
    }

    // 1. Format History
    // Critical: Use m.characterName if available. Format: "Name: Message"
    const chatHistory = this._formatHistory(payload.messages || []);

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
      // We prioritize function-level options over payload params
      const genOptions = {
        temperature: options.temperature ?? payload.params?.temperature,
        top_p: options.top_p ?? payload.params?.top_p,
        repetition_penalty:
          options.repetition_penalty ?? payload.params?.repetition_penalty,
        max_tokens: options.maxTokens ?? payload.params?.maxTokens,
        model: options.model ?? payload.params?.model,
        stop_sequences: payload.stopSequences || [],
        signal: options.signal,
        silent: options.silent, // Pass silent flag to plugin wrapper if it supports it
      };

      // 4. Call Plugin
      const result = await window.ai(instruction, genOptions);

      // Simulate streaming callback if provided (since window.ai awaits full response currently)
      if (options.onToken && typeof options.onToken === "function") {
        options.onToken(result);
      }

      return result;
    } catch (error) {
      if (options.silent) {
        // If silent, we log to console but do NOT alert or dispatch global errors here.
        // We re-throw so the caller (e.g. TurnManager) knows it failed.
        console.warn("[LlmService] Silent Generation Error:", error);
        throw error;
      }

      // Handle specific connection errors
      const errString = String(error);

      // [STALE SESSION HANDLING]
      // Detect 400/403/Fetch errors typical of expiring Perchance sessions
      const isStale =
        errString.includes("400") ||
        errString.includes("401") ||
        errString.includes("403") ||
        errString.includes("Fetch failed");

      if (isStale) {
        console.warn("[LlmService] Stale Session Detected. Suppressing error.");

        // Dynamic import to avoid circular dependency
        const { showAlert } = await import("../ui/orchestrator.js");

        // Show non-blocking notice (User must refresh)
        showAlert(
          "Session Stale",
          "Your connection to the AI engine has expired. Please refresh the page to reconnect.",
        );

        // SUPPRESS: Do not re-throw. Return null/empty to fail gracefully.
        return null;
      }

      if (
        errString.includes("stream keep alive") ||
        errString.includes("timeout") ||
        errString.includes("NetworkError")
      ) {
        // [NEXUS FIX] Use shared constant for reliable detection
        const { ERROR_MESSAGES } = await import("../core/constants.js");
        console.error("[LlmService] Network Error:", error);
        throw new Error(
          `${ERROR_MESSAGES.CONNECTION_LOST} This is often caused by Ad-Blockers blocking the 'keep-alive' signal. Please check your network settings.`,
        );
      }

      // Re-throw unknown errors
      throw error;
    }
  }

  /**
   * Formats the message history for the LLM.
   * @param {Array} messages - List of message objects { role, text, characterName }.
   * @returns {string} Formatted history string.
   */
  static _formatHistory(messages) {
    return messages
      .map((m) => {
        // Map roles to labels
        let label = "Character";
        if (m.characterName) {
          label = m.characterName;
        } else if (m.role === "user") {
          label = "User";
        }

        return `${label}: ${m.text}`;
      })
      .join("\n\n");
  }
}
