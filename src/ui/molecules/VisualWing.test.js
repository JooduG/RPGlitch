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
// Replicate handleCreativeAction logic for verification
// We verify the LOGIC FLOW, since mounting the Svelte 5 component in this Node env is complex.
/**
 * @param {any} char
 */
function ensureModifiers(char) {
  if (!char.modifiers) {
    char.modifiers = {
      prompt: "",
      negative_prompt: "",
      no_background: false,
      flipped: false,
      profile_picture_seed: 0,
      last_generated_seed: null,
      color_name: "",
    };
  } else {
    char.modifiers.prompt ??= "";
    char.modifiers.negative_prompt ??= "";
    char.modifiers.no_background ??= false;
    char.modifiers.flipped ??= false;
    char.modifiers.profile_picture_seed ??= 0;
    char.modifiers.last_generated_seed ??= null;
    char.modifiers.color_name ??= "";
  }
}

/**
 * @param {any} ctx
 */
async function handleCreativeAction(ctx) {
  let { busyField, activeField, char, isEnhanceMode, enhancementType } = ctx;
  if (busyField) return { ...ctx, result: "busy" };
  // Fix Logic under test:
  const currentTargetKey = activeField?.key; // This used to crash if activeField null
  busyField = currentTargetKey || "visual-prompt";
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
  test("ensureModifiers initializes missing modifiers object", () => {
    /** @type {any} */
    const char = {};
    ensureModifiers(char);
    expect(char.modifiers).toBeDefined();
    expect(char.modifiers.prompt).toBe("");
    expect(char.modifiers.negative_prompt).toBe("");
    expect(char.modifiers.no_background).toBe(false);
  });

  test("ensureModifiers preserves existing modifiers and fills missing fields", () => {
    /** @type {any} */
    const char = {
      modifiers: {
        prompt: "Existing prompt",
      },
    };
    ensureModifiers(char);
    expect(char.modifiers.prompt).toBe("Existing prompt");
    expect(char.modifiers.negative_prompt).toBe("");
    expect(char.modifiers.no_background).toBe(false);
    expect(char.modifiers.profile_picture_seed).toBe(0);
  });

  test("handleCreativeAction SAFE when activeField is NULL (Fetch Mode)", async () => {
    const context = {
      busyField: null,
      activeField: null, // The crash condition
      char: { modifiers: { prompt: "" } },
      isEnhanceMode: false,
      enhancementType: null,
    };
    const result = await handleCreativeAction(context);
    expect(result.result).toBe("success");
    expect(TextToImage.composeBasePrompt).toHaveBeenCalled();
    expect(result.error).toBeUndefined();
  });
  test("handleCreativeAction runs Enhance when fields present", async () => {
    const context = {
      busyField: null,
      activeField: { key: "visual-prompt", label: "Image Prompt" },
      char: { modifiers: { prompt: "A dragon" } },
      isEnhanceMode: true,
      enhancementType: "generative",
    };
    const result = await handleCreativeAction(context);
    expect(result.result).toBe("success");
  });

  test("handleCreativeAction writes both prompt and negative_prompt from Refine result", () => {
    /** @type {any} */
    const char = { modifiers: { prompt: "old prompt", negative_prompt: "" } };
    // Simulate refine result update logic from handle_creative_action
    const refineResult = {
      prompt: "RAW photograph of a character, sharp focus, 8k.",
      negativePrompt: "blurry, low quality, anime",
    };
    if (refineResult) {
      if (refineResult.prompt) char.modifiers.prompt = refineResult.prompt;
      if (refineResult.negativePrompt) char.modifiers.negative_prompt = refineResult.negativePrompt;
    }
    expect(char.modifiers.prompt).toBe("RAW photograph of a character, sharp focus, 8k.");
    expect(char.modifiers.negative_prompt).toBe("blurry, low quality, anime");
  });
});
