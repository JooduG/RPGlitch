<script>
  /**
   * @file ImageRegenerate.svelte
   * 🎲 The 3-Card Regenerate Picker
   * Three image candidates are revealed face-up so the user can see
   * and pick their favorite. Includes a "Regenerate" button for a 2nd
   * round of generation with LLM-refined prompts.
   */
  import { imageRegenerate, selectCandidate, closeRegenerate, deliverCandidates, setRegenerateError, closePicker, getPersistedMeta } from "@state";
  import { visual_engine } from "@media";
  import { Backdrop } from "@atoms";
  import { Dialog } from "bits-ui";
  import { fade } from "svelte/transition";

  let is_regenerating = $state(false);

  async function handle_regenerate() {
    if (is_regenerating) return;
    const key = imageRegenerate.regenerating_key;
    console.log("[ImageRegenerate] handle_regenerate START, key:", key);
    if (!key) {
      setRegenerateError("No image context available to regenerate.");
      return;
    }

    // Read persisted meta BEFORE closePicker (plain variables, not $state)
    const meta = getPersistedMeta();
    console.log("[ImageRegenerate] persisted meta:", { prompt_len: meta.prompt?.length, mode: meta.mode, neg_len: meta.negativePrompt?.length });
    console.log("[ImageRegenerate] persisted prompt preview:", JSON.stringify(meta.prompt).slice(0, 300));

    is_regenerating = true;
    closePicker();
    try {
      const signature_color = imageRegenerate.signature_color;

      const prompt = meta.prompt || "";
      const mode = meta.mode || "character";
      const negativePrompt = meta.negativePrompt || "";

      if (!prompt) {
        console.error("[ImageRegenerate] NO PROMPT! meta was:", meta);
        setRegenerateError("No prompt found for this image. Cannot regenerate.");
        return;
      }

      console.log("[ImageRegenerate] enhancing prompt via LLM, mode:", mode);
      let finalPrompt = prompt;
      let finalNegative = negativePrompt;
      try {
        const refined = await visual_engine.enhance(prompt, mode);
        console.log("[ImageRegenerate] enhance returned:", refined ? { prompt_len: refined.prompt?.length } : "null");
        if (refined?.prompt) {
          finalPrompt = refined.prompt;
          finalNegative = refined.negativePrompt || negativePrompt;
        }
      } catch (enhanceErr) {
        console.warn("[ImageRegenerate] Prompt enhancement failed, using original prompt:", enhanceErr);
      }

      // SAFETY NET: If enhance() returned a full JSON blob instead of just the prompt field,
      // extract the prompt field from it. This happens when _parseRefineResponse fails to peel the JSON.
      if (finalPrompt.trim().startsWith("{")) {
        console.log("[ImageRegenerate] finalPrompt is JSON blob, extracting prompt field...");
        try {
          const parsed = JSON.parse(finalPrompt.trim());
          if (parsed.prompt && typeof parsed.prompt === "string") {
            console.log("[ImageRegenerate] Extracted prompt from JSON:", JSON.stringify(parsed.prompt).slice(0, 200));
            finalPrompt = parsed.prompt;
            if (parsed.negativePrompt) finalNegative = parsed.negativePrompt;
          }
        } catch (_e) {
          const promptMatch = finalPrompt.match(/"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
          if (promptMatch && promptMatch[1]) {
            finalPrompt = promptMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
            console.log("[ImageRegenerate] Extracted prompt via regex fallback:", JSON.stringify(finalPrompt).slice(0, 200));
          }
        }
      }

      console.log("[ImageRegenerate] generating candidates with prompt:", JSON.stringify(finalPrompt).slice(0, 200));
      const newCandidates = await visual_engine.generate_candidates(finalPrompt, {
        mode,
        negativePrompt: finalNegative,
        count: 3,
        min_success: 2,
      });

      if (newCandidates.length < 2) {
        setRegenerateError("Not enough images generated. Please try again.");
        return;
      }

      console.log("[ImageRegenerate] delivering", newCandidates.length, "candidates");
      deliverCandidates(
        newCandidates.map((c) => ({
          url: c.url,
          metadata: { ...c.metadata, prompt: finalPrompt, mode },
          signature_color,
        })),
        { prompt: finalPrompt, mode, negativePrompt: finalNegative },
      );
    } catch (err) {
      console.error("[Regenerate Error]", err);
      setRegenerateError(`Regenerate failed: ${err.message || err}`);
    } finally {
      is_regenerating = false;
    }
  }
</script>

{#if imageRegenerate.picker_open}
  <Dialog.Root open={true} preventScroll={false}>
    <Dialog.Portal>
      <Dialog.Overlay forceMount>
        {#snippet child({ props: overlayProps })}
          <Backdrop {...overlayProps} z_index="600" is_blurred={true}>
            <Dialog.Content forceMount onInteractOutside={(e) => e.preventDefault()} onOpenAutoFocus={(e) => e.preventDefault()}>
              {#snippet child({ props: contentProps })}
                <div
                  {...contentProps}
                  class="relative flex min-h-[60vh] w-[clamp(20rem,90vw,80rem)] flex-col items-center justify-center gap-8"
                  onclick={(e) => e.stopPropagation()}
                >
                  {#if imageRegenerate.error}
                    <div class="flex flex-col items-center gap-4" in:fade={{ duration: 200 }}>
                      <p class="text-lg text-red-400">{imageRegenerate.error}</p>
                      <div class="flex gap-4">
                        <button
                          class="rounded-lg bg-white/10 px-6 py-2 font-bold text-white transition-colors hover:bg-white/20"
                          onclick={() => {
                            closeRegenerate();
                          }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  {:else if imageRegenerate.candidates.length < 2}
                    <div class="flex flex-col items-center gap-4" in:fade={{ duration: 200 }}>
                      <div class="flex gap-1.5">
                        <div class="h-3 w-3 animate-pulse rounded-full bg-white/60" style="animation-delay: 0ms"></div>
                        <div class="h-3 w-3 animate-pulse rounded-full bg-white/60" style="animation-delay: 150ms"></div>
                        <div class="h-3 w-3 animate-pulse rounded-full bg-white/60" style="animation-delay: 300ms"></div>
                      </div>
                      <p class="font-mono text-sm tracking-widest text-slate-500 uppercase">Generating...</p>
                    </div>
                  {:else if imageRegenerate.candidates.length >= 2}
                    <!-- POLAROID CARD GRID -->
                    <div class="flex flex-wrap items-end justify-center gap-6 md:gap-10" in:fade={{ duration: 300 }}>
                      {#each imageRegenerate.candidates as candidate, i (i)}
                        {@const letter = String.fromCharCode(65 + i)}
                        {@const cRes = candidate.metadata?.resolution || "512x768"}
                        {@const [cW, cH] = cRes.split("x").map(Number)}
                        {@const ar = cW && cH ? `${cW} / ${cH}` : "2 / 3"}
                        {@const rot = i === 0 ? -4 : i === 2 ? 4 : 0}
                        <button
                          type="button"
                          class="group relative w-56 pt-2 pb-10 shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out md:w-64 {imageRegenerate.selected_index ===
                          i
                            ? 'scale-105 cursor-default ring-2 ring-emerald-400/60'
                            : imageRegenerate.selected_index !== null
                              ? 'scale-95 cursor-default opacity-40'
                              : 'cursor-pointer hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)]'}"
                          style="background: #f5f0e6; border-radius: 2px; transform-origin: bottom center; transform: rotate({rot}deg);"
                          onclick={() => selectCandidate(i)}
                          aria-label="Select candidate {letter}"
                        >
                          <div class="relative overflow-hidden bg-neutral-200" style="aspect-ratio: {ar};">
                            <img src={candidate.url} alt="Candidate {letter}" class="h-full w-full object-cover" />
                            {#if imageRegenerate.selected_index === i}
                              <div class="absolute inset-0 flex items-center justify-center bg-emerald-500/20">
                                <div class="rounded-full bg-emerald-400 p-3 text-white shadow-lg">
                                  <svg
                                    viewBox="0 0 24 24"
                                    class="h-6 w-6 fill-none stroke-current stroke-3 [stroke-linecap:round] [stroke-linejoin:round]"
                                  >
                                    <polyline
                                      points="20 6 9 17 4 12"
                                      stroke="currentColor"
                                      stroke-width="3"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    />
                                  </svg>
                                </div>
                              </div>
                            {/if}
                          </div>
                          <!-- Polaroid label area -->
                          <div class="absolute right-0 bottom-0 left-0 flex h-10 items-center justify-center">
                            <span class="font-mono text-xl font-bold tracking-widest text-neutral-800 uppercase">{letter}</span>
                          </div>
                        </button>
                      {/each}
                    </div>

                    {#if imageRegenerate.selected_index === null}
                      <div class="flex flex-wrap items-center justify-center gap-3" in:fade={{ duration: 300 }}>
                        <span class="font-mono text-sm tracking-widest text-slate-400 uppercase">Choose One — or</span>
                        <button
                          type="button"
                          class="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-bold text-white transition-all duration-200 hover:bg-white/20"
                          onclick={handle_regenerate}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            class="h-4 w-4 fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]"
                          >
                            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                          </svg>
                          <span class="font-mono text-xs tracking-widest uppercase">Discard & Regenerate</span>
                        </button>
                      </div>
                    {/if}
                  {:else}
                    <div class="flex flex-col items-center gap-4" in:fade={{ duration: 200 }}>
                      <p class="font-mono text-sm tracking-widest text-slate-500 uppercase">No candidates available</p>
                      <button
                        class="rounded-lg bg-white/10 px-6 py-2 font-bold text-white transition-colors hover:bg-white/20"
                        onclick={closeRegenerate}
                      >
                        Close
                      </button>
                    </div>
                  {/if}
                </div>
              {/snippet}
            </Dialog.Content>
          </Backdrop>
        {/snippet}
      </Dialog.Overlay>
    </Dialog.Portal>
  </Dialog.Root>
{/if}
