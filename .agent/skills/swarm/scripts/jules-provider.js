/**
 * @file .agent/skills/swarm/scripts/jules-provider.js
 * 🧪 DEVELOPER LLM PROVIDER  —  Node.js / Jules SDK
 *
 * This file contains the implementation for calling the LLM via the Google Jules SDK.
 * It is physically separated from the `src/` directory to ensure that simulation
 * builds stay browser-pure.
 */

import { jules } from "@google/jules-sdk";

/**
 * Executes a generation request using the Jules SDK.
 *
 * @param {Object} payload - The prompt payload.
 * @param {Object} options - Runtime overrides.
 * @returns {Promise<string>}
 */
export async function execute_jules(payload, options = {}) {
  try {
    const session = await jules.session({
      prompt: payload.system || "",
      messages: payload.messages || [],
      temperature: options.temperature ?? payload.params?.temperature ?? 0.8,
      max_tokens: options.max_tokens ?? payload.params?.max_tokens,
      top_p: options.top_p ?? payload.params?.top_p,
    });

    // Handle streaming
    if (options.onToken) {
      for await (const chunk of session.stream()) {
        if (chunk.type === "token") {
          options.onToken(chunk.text);
        }
      }
    }

    return await session.result();
  } catch (err) {
    const msg = "Jules SDK Execution Failed.";
    console.error(msg, err);
    throw new Error(msg, { cause: err });
  }
}
