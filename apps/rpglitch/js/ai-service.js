// apps/rpglitch/js/ai-service.js
/**
 * Generates text using the Perchance AI plugin via a stream.
 * @param {Object} payload - { system, messages, params }
 * @param {AbortSignal} signal - Signal to abort the request
 * @param {Function} onToken - Callback for each streamed token
 * @param {Function} onDone - Callback when generation completes
 * @returns {Promise<string>} - The full generated text
 */
export async function generateStream({ payload, signal, onToken, onDone }) {
  if (!window.ai) throw new Error("Perchance AI plugin not available.");

  // Construct the prompt in the format expected by the plugin/model
  let instruction = (payload.system ? payload.system + "\n\n" : "") +
    (payload.messages || [])
      .map(m => `${m.role === "user" ? "User" : "Character"}: ${m.text}`)
      .join("\n\n") + 
    "\n\nNarrator: ";

  const result = await window.ai(instruction, {
    temperature: payload.params?.temperature,
    top_p: payload.params?.top_p,
    max_tokens: payload.params?.maxTokens,
    model: payload.params?.model,
    signal,
  });

  if (onToken) onToken(result); 
  if (onDone) onDone();
  
  return result;
}