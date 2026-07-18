# Inline Chat Image Generation Pipeline Analysis

## 1. User Click in the UI

In [UnifiedConsole.svelte:L493-533](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/molecules/UnifiedConsole.svelte#L493-L533), under the **Storymode** accordion settings, the **PHOTO** button is bound to an asynchronous click handler:

- It sets the simulation state to block input and set the active generation role to `"ai"` (`simulationState.start_generation("ai")`).
- It invokes [visual_engine.visualize](file:///c:/Users/johng/source/repos/RPGlitch/src/media/visual.svelte.js#L269-L343), passing the current `runtime.story_id`, a text intent (`app.prologue` or a default phone selfie prompt), and the target type `"selfie"`.

## 2. Orchestration in `VisualEngine.visualize`

In [visual.svelte.js:L269-L343](file:///c:/Users/johng/source/repos/RPGlitch/src/media/visual.svelte.js#L269-L343), the sensory cortex orchestrator resolves the target metadata:

1. **Target Mapping**: `"selfie"` is mapped to `vTarget = "selfie"` and a portrait aspect ratio.
2. **Context Resolution**: The engine loads physical features (`eternal` and `present` physical traits) of the active `ai`, `user`, and `fractal` (environment) entities.
3. **Refinement Prompt Generation**: It compiles these details and the raw intent description into a system instruction using [PromptTemplates.BUILDER](file:///c:/Users/johng/source/repos/RPGlitch/src/media/optics.js#L274-L351) from [optics.js](file:///c:/Users/johng/source/repos/RPGlitch/src/media/optics.js).
   - For `"selfie"`, it injects a specific layout instruction (chest-up view with one arm outstretched forward toward the lower frame, environment mapped in the background).
   - It requests the LLM to write a `<think>` block, output exactly one `<image_prompt>` block, and include a short in-character `<caption text="...">...</caption>` block.
4. **LLM Execution**: The `llm_service` processes this payload to refine the image prompt and generate the caption.
5. **XML Extraction & Peeling**: The visual engine parses the refined image prompt out of the `<image_prompt>` tags and extracts the caption text.
6. **Rate-Limit Safeguard**: It introduces a `2000ms` delay to allow the LLM's rate limits to settle before queuing the image generation request.

## 3. Generative Pipeline in `VisualEngine.generate`

In [visual.svelte.js:L88-L235](file:///c:/Users/johng/source/repos/RPGlitch/src/media/visual.svelte.js#L88-L235), the engine executes the generation request:

1. **Resolution Selection**: Mode `"selfie"` maps to portrait aspect ratio `512x768` via [getResolution](file:///c:/Users/johng/source/repos/RPGlitch/src/media/optics.js#L356-L371).
2. **Engine Selection**: [findImageEngine](file:///c:/Users/johng/source/repos/RPGlitch/src/media/visual.svelte.js#L22-L53) scans the DOM context (`window` or parent sandbox frame boundaries) to locate Perchance's hosted image generation plugins (`pluginTextToImage` or `textToImage`).
3. **Resilience**: The request is executed within a custom [CircuitBreaker](file:///c:/Users/johng/source/repos/RPGlitch/src/media/resilience.js) and [ExponentialBackoffRetryer](file:///c:/Users/johng/source/repos/RPGlitch/src/media/resilience.js) (up to 3 retries, with a 90-second generation timeout safety limit).
4. **Seed generation**: A secure random seed is generated.
5. **Negative Prompting**: The engine appends the standard global `NEGATIVE_PROMPT` defined in [optics.js:L9](file:///c:/Users/johng/source/repos/RPGlitch/src/media/optics.js#L9).

## 4. Logging & Chat Integration

Back in the click handler in [UnifiedConsole.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/molecules/UnifiedConsole.svelte):

1. **Response Check**: Once a `imageUrl` is successfully returned:
2. **Session Persistence**: It commits the character caption and the image payload (with prompt, seed, and resolution metadata stored under attachments) to the database using `session_driver.log_message(...)`.
3. **Release**: The console completes the generation cycle (`simulationState.complete()`), unlocking the input bar for subsequent turns.
