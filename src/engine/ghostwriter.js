/**
 * src/engine/ghostwriter.js
 * ============================================================================
 * ✍️ GHOSTWRITER EXECUTION ENGINE
 * ============================================================================
 *
 * Implements pure ghostwriting streaming execution with <think> tag suppression
 * and cognition block stripping. Zero @intelligence imports.
 * ============================================================================
 */

import { compile_prompt } from "./prompts.js";
import { normalize_entity } from "../storage/entities.js";
import { state_bridge } from "../utils/bridges.js";
import { filter_narrative_messages, strip_cognition_blocks } from "../utils/text.js";
import { llm_service } from "@platform";

export const THINK_OPEN_TAG = "<THINK>";
export const THINK_CLOSE_TAG = "</THINK>";

/**
 * Executes a ghostwriter stream for drafting user narrative turns.
 * Suppresses thought blocks from live token streaming and strips cognition from the final output.
 *
 * @param {string} [input_text=""] - Context/seed text to continue or draft
 * @param {AbortSignal} [signal=null] - Optional abort signal
 * @param {((chunk: string, is_full_replace: boolean) => void) | null} [on_token=null] - Streaming token callback
 * @returns {Promise<string>} Cleaned narrative prose
 */
export async function execute_ghostwriter(input_text = "", signal = null, on_token = null) {
  const runtime = state_bridge.runtime || {};
  const story_id = runtime.story_id;

  const raw_messages = story_id && state_bridge.session_driver ? await state_bridge.session_driver.load_log(story_id) : [];

  const simulation_log = filter_narrative_messages(raw_messages, { exclude_consolidated: true }).map((m) => ({
    role: m.role === "user" ? "user" : m.role === "fractal" ? "fractal" : "model",
    text: m.text || m.content || "",
    origin: m.character_name || (m.role === "user" ? "USER" : "AI"),
    entity_id: m.entity_id,
  }));

  const entities = {
    AI: runtime.active_ai ? normalize_entity(runtime.active_ai) : null,
    USER: runtime.active_user ? normalize_entity(runtime.active_user) : null,
    FRACTAL: runtime.active_fractal ? normalize_entity(runtime.active_fractal) : null,
  };

  const ghost_prompt = compile_prompt({
    core: "ghostwrite",
    round: runtime.round || 1,
    entities,
    history: simulation_log,
    memories: [],
    task_options: {
      input: input_text,
    },
  });

  let full_accumulated = "";
  let is_inside_think = false;

  const result = await llm_service.generate(
    {
      system: ghost_prompt,
      role: "user",
    },
    {
      silent: true,
      signal,
      onToken: (chunk) => {
        full_accumulated += chunk;
        if (typeof on_token === "function") {
          const starts_think =
            full_accumulated.trimStart().startsWith("<think") ||
            full_accumulated.trimStart().startsWith("<THINK") ||
            full_accumulated.trimStart() === "<";

          if (starts_think || full_accumulated.includes(THINK_OPEN_TAG) || /<think>/i.test(full_accumulated)) {
            is_inside_think = !(full_accumulated.includes(THINK_CLOSE_TAG) || /<\/think>/i.test(full_accumulated));
            if (!is_inside_think) {
              const cleaned = strip_cognition_blocks(full_accumulated).trimStart();
              if (cleaned) on_token(cleaned, true);
            }
          } else if (!is_inside_think) {
            on_token(chunk, false);
          }
        }
      },
    },
  );

  const clean_result = strip_cognition_blocks(typeof result === "string" ? result : result?.text || "").trim();
  return clean_result;
}
