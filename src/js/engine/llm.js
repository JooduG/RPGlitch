// apps/rpglitch/js/llm-adapter.js

/**
 * Generates text using the Perchance AI plugin via a stream.
 */
export const generateStream = async ({
  payload,
  options = {},
  signal,
  onToken,
  onDone,
}) => {
  if (!window.ai) throw new Error("Perchance AI plugin not available.");

  // Map internal roles to prompt-friendly labels
  const chatHistory = (payload.messages || [])
    .map((m) => {
      const label = m.role === "user" ? "User" : m.characterName || "Character";
      const text = m.content || m.text || "";
      return `${label}: ${text}`;
    })
    .join("\n\n");

  const instruction = [
    payload.system,
    chatHistory ? `\n[CONVERSATION HISTORY]\n${chatHistory}` : "",
    payload.startWith ? `\n${payload.startWith}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const { params = {} } = payload;

  try {
    const result = await window.ai(instruction, {
      temperature: options.temperature ?? params.temperature,
      top_p: options.top_p ?? params.top_p,
      repetition_penalty: options.repetition_penalty,
      max_tokens: params.maxTokens,
      model: params.model,
      stop_sequences: payload.stopSequences || [],
      signal,
    });

    if (onToken) onToken(result);
    if (onDone) onDone();

    return result;
  } catch (error) {
    const errString = String(error);
    if (
      errString.includes("stream keep alive") ||
      errString.includes("timeout") ||
      errString.includes("NetworkError")
    ) {
      console.error("[RPGlitch] AI Plugin Error:", error);
      throw new Error(
        "Connection lost with AI server. This usually implies ad-blockers are interfering. Please disable them and try again.",
      );
    }
    throw error;
  }
};
