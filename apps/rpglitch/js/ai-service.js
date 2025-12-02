// apps/rpglitch/js/ai-service.js
/**
 * Generates text using the Perchance AI plugin via a stream.
 * Now purely a pass-through. All prompt formatting happens in ContextBuilder.
 * * @param {Object} payload - { system, messages, params, stopSequences }
 * @param {AbortSignal} signal - Signal to abort the request
 * @param {Function} onToken - Callback for each streamed token
 * @param {Function} onDone - Callback when generation completes
 * @returns {Promise<string>} - The full generated text
 */
export async function generateStream({ payload, signal, onToken, onDone }) {
  if (!window.ai) throw new Error("Perchance AI plugin not available.");

  // 1. Construct the final instruction string
  // We strictly follow the payload provided by the ContextBuilder.
  // No hidden suffixes (like "Narrator:") are added here anymore.

  // Format chat history if present
  const chatHistory = (payload.messages || [])
    .map(m => {
      // Map internal roles to prompt-friendly labels
      const label = m.role === "user" ? "User" : m.characterName || "Character";
      return `${label}: ${m.text}`;
    })
    .join("\n\n");

  const instruction = [
    payload.system,
    chatHistory ? `\n[CONVERSATION HISTORY]\n${chatHistory}` : "",
    payload.startWith ? `\n${payload.startWith}` : "" // Allow builder to set the starting cursor
  ].filter(Boolean).join("\n");

  // 2. Call the Plugin
  const result = await window.ai(instruction, {
    temperature: payload.params?.temperature,
    top_p: payload.params?.top_p,
    max_tokens: payload.params?.maxTokens,
    model: payload.params?.model,
    stop_sequences: payload.stopSequences || [],
    signal,
  });

  if (onToken) onToken(result);
  if (onDone) onDone();

  return result;
}