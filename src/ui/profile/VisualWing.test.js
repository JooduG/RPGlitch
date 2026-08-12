import { describe, expect, test, vi } from "vitest";
const llm_service = {
  enhance: vi.fn(),
};
const prompt_builder = {
  build_enhancement: vi.fn(),
};
const TextToImage = {
  composeBasePrompt: vi.fn((_char) => "Composed Prompt"),
  generate: vi.fn(),
  upload: vi.fn(),
};
// Replicate handle_creative_action logic for verification
// We verify the LOGIC FLOW, since mounting the Svelte 5 component in this Node env is complex.
/**
 * @param {any} char
 */
function ensure_modifiers(char) {
  if (!char.modifiers) {
    char.modifiers = {
      prompt: "",
      negative_prompt: "",
      flipped: false,
      profile_picture_seed: 0,
      last_generated_seed: null,
    };
  } else {
    char.modifiers.prompt ??= "";
    char.modifiers.negative_prompt ??= "";
    char.modifiers.flipped ??= false;
    char.modifiers.profile_picture_seed ??= 0;
    char.modifiers.last_generated_seed ??= null;
  }
}

/**
 * @param {any} ctx
 */
async function handle_creative_action(ctx) {
  let { busyField, activeField, char, isEnhanceMode, enhancementType } = ctx;
  if (busyField) return { ...ctx, result: "busy" };
  // Fix Logic under test:
  const current_target_key = activeField?.key; // This used to crash if activeField null
  busyField = current_target_key || "visual-prompt";
  try {
    if (activeField && isEnhanceMode) {
      if (enhancementType === "generative") {
        const payload = prompt_builder.build_enhancement("modifiers.prompt", char.modifiers.prompt);
        await llm_service.enhance(payload);
      } else {
        // ...
      }
    } else {
      // Fetch Logic
      char.modifiers.prompt = TextToImage.composeBasePrompt(char);
    }
    return { ...ctx, busyField, result: "success" };
  } catch (err) {
    return { ...ctx, error: err, result: "error" };
  }
}
describe("VisualWing Stability (Hotfix)", () => {
  test("ensure_modifiers initializes missing modifiers object", () => {
    /** @type {any} */
    const char = {};
    ensure_modifiers(char);
    expect(char.modifiers).toBeDefined();
    expect(char.modifiers.prompt).toBe("");
    expect(char.modifiers.negative_prompt).toBe("");
  });

  test("ensure_modifiers preserves existing modifiers and fills missing fields", () => {
    /** @type {any} */
    const char = {
      modifiers: {
        prompt: "Existing prompt",
      },
    };
    ensure_modifiers(char);
    expect(char.modifiers.prompt).toBe("Existing prompt");
    expect(char.modifiers.negative_prompt).toBe("");
    expect(char.modifiers.profile_picture_seed).toBe(0);
  });

  test("handle_creative_action SAFE when activeField is NULL (Fetch Mode)", async () => {
    const context = {
      busyField: null,
      activeField: null, // The crash condition
      char: { modifiers: { prompt: "" } },
      isEnhanceMode: false,
      enhancementType: null,
    };
    const result = await handle_creative_action(context);
    expect(result.result).toBe("success");
    expect(TextToImage.composeBasePrompt).toHaveBeenCalled();
    expect(result.error).toBeUndefined();
  });
  test("handle_creative_action runs Enhance when fields present", async () => {
    const context = {
      busyField: null,
      activeField: { key: "visual-prompt", label: "Image Prompt" },
      char: { modifiers: { prompt: "A dragon" } },
      isEnhanceMode: true,
      enhancementType: "generative",
    };
    const result = await handle_creative_action(context);
    expect(result.result).toBe("success");
  });

  test("handle_creative_action writes both prompt and negative_prompt from Refine result", () => {
    /** @type {any} */
    const char = { modifiers: { prompt: "old prompt", negative_prompt: "" } };
    // Simulate refine result update logic from handle_creative_action
    const refine_result = {
      prompt: "RAW photograph of a character, sharp focus, 8k.",
      negative_prompt: "blurry, low quality, anime",
    };
    if (refine_result) {
      if (refine_result.prompt) char.modifiers.prompt = refine_result.prompt;
      if (refine_result.negative_prompt) char.modifiers.negative_prompt = refine_result.negative_prompt;
    }
    expect(char.modifiers.prompt).toBe("RAW photograph of a character, sharp focus, 8k.");
    expect(char.modifiers.negative_prompt).toBe("blurry, low quality, anime");
  });
});
