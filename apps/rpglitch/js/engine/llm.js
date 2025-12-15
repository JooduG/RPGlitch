// apps/rpglitch/js/llm-adapter.js
/**
 * Generates text using the Perchance AI plugin via a stream.
 * Now purely a pass-through. All prompt formatting happens in ContextBuilder.
 * * @param {Object} payload - { system, messages, params, stopSequences }
 * @param {AbortSignal} signal - Signal to abort the request
 * @param {Function} onToken - Callback for each streamed token
 * @param {Function} onDone - Callback when generation completes
 * @returns {Promise<string>} - The full generated text
 */
export async function generateStream({
  payload,
  options = {},
  signal,
  onToken,
  onDone,
}) {
  if (!window.ai) throw new Error("Perchance AI plugin not available.");

  // 1. Construct the final instruction string
  // We strictly follow the payload provided by the ContextBuilder.
  // No hidden suffixes (like "Narrator:") are added here anymore.

  // Format chat history if present
  const chatHistory = (payload.messages || [])
    .map((m) => {
      // Map internal roles to prompt-friendly labels
      const label = m.role === "user" ? "User" : m.characterName || "Character";
      return `${label}: ${m.text}`;
    })
    .join("\n\n");

  const instruction = [
    payload.system,
    chatHistory ? `\n[CONVERSATION HISTORY]\n${chatHistory}` : "",
    payload.startWith ? `\n${payload.startWith}` : "", // Allow builder to set the starting cursor
  ]
    .filter(Boolean)
    .join("\n");

  // 2. Call the Plugin
  try {
    const result = await window.ai(instruction, {
      temperature: options.temperature ?? payload.params?.temperature,
      top_p: options.top_p ?? payload.params?.top_p,
      repetition_penalty: options.repetition_penalty,
      max_tokens: payload.params?.maxTokens,
      model: payload.params?.model,
      stop_sequences: payload.stopSequences || [],
      signal,
    });

    if (onToken) onToken(result);
    // Note: window.ai (the plugin) usually returns the full string at the end if strict streaming isn't enabled,
    // but our usage pattern depends on the specific plugin version behavior.
    // If it streams via a callback in the options (which isn't shown here but might be internal to the plugin wrapper),
    // we would handle it there. Given the signature, we just await the result.

    if (onDone) onDone();

    return result;
  } catch (error) {
    // Detect specific "keep alive" or "timeout" errors from the plugin
    const errString = String(error);
    if (
      errString.includes("stream keep alive") ||
      errString.includes("timeout") ||
      errString.includes("NetworkError")
    ) {
      console.error("[RPGlitch] AI Plugin Error:", error);
      throw new Error(
        "Connection lost with AI server. This is often caused by Ad-Blockers blocking the 'keep-alive' signal. Please disable ad-blockers for this page and try again.",
      );
    }
    throw error; // Re-throw other errors
  }
}
