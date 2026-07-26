<script>
  /**
   * @file ImageRegenerate.svelte
   * 🎲 The 3-Card Regenerate Picker
   * Three image candidates are revealed face-up so the user can see
   * and pick their favorite. Includes a "Regenerate" button for a 2nd
   * round of generation with LLM-refined prompts.
   */
  import { imageRegenerate, selectCandidate, closeRegenerate, deliverCandidates, setRegenerateError } from "@state";
  import { visual_engine } from "@media";
  import { Backdrop } from "@atoms";
  import { Dialog } from "bits-ui";
  import { fade } from "svelte/transition";

  let open = $state(true);
  let is_regenerating = $state(false);

  $effect(() => {
    if (!open) closeRegenerate();
  });

  async function handle_regenerate() {
    if (is_regenerating) return;
    is_regenerating = true;
    try {
      const candidates = imageRegenerate.candidates;
      const signature_color = imageRegenerate.signature_color;
      const key = imageRegenerate.regenerating_key;
      if (!key) return;

      const firstCandidate = candidates[0];
      const prompt = firstCandidate?.metadata?.prompt || "";
      const mode = firstCandidate?.metadata?.mode || "character";
      const negativePrompt = firstCandidate?.metadata?.negativePrompt;

      const refined = await visual_engine.enhance(prompt, mode);
      const finalPrompt = refined?.prompt || prompt;
      const finalNegative = refined?.negativePrompt || negativePrompt;

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

      deliverCandidates(
        newCandidates.map((c) => ({
          url: c.url,
          metadata: { ...c.metadata, prompt: finalPrompt },
          signature_color,
        })),
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
  <Dialog.Root bind:open preventScroll={false}>
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
                      <button
                        class="rounded-lg bg-white/10 px-6 py-2 font-bold text-white transition-colors hover:bg-white/20"
                        onclick={() => closeRegenerate()}
                      >
                        Close
                      </button>
                    </div>
                  {:else if is_regenerating}
                    <div class="flex flex-col items-center gap-4" in:fade={{ duration: 200 }}>
                      <div class="flex gap-1.5">
                        <div class="h-3 w-3 animate-pulse rounded-full bg-white/60" style="animation-delay: 0ms"></div>
                        <div class="h-3 w-3 animate-pulse rounded-full bg-white/60" style="animation-delay: 150ms"></div>
                        <div class="h-3 w-3 animate-pulse rounded-full bg-white/60" style="animation-delay: 300ms"></div>
                      </div>
                      <p class="font-mono text-sm tracking-widest text-slate-500 uppercase">Regenerating...</p>
                    </div>
                  {:else}
                    <!-- CARD GRID -->
                    <div class="flex flex-wrap items-center justify-center gap-4 md:gap-8" in:fade={{ duration: 300 }}>
                      {#each imageRegenerate.candidates as candidate, i (i)}
                        <button
                          type="button"
                          class="group relative h-72 w-56 cursor-pointer overflow-hidden rounded-none border-2 shadow-2xl transition-all duration-300 ease-out md:h-80 md:w-64 {imageRegenerate.selected_index ===
                          i
                            ? 'scale-105 border-emerald-400 ring-2 ring-emerald-400/60'
                            : imageRegenerate.selected_index !== null
                              ? 'scale-95 opacity-40'
                              : 'border-white/20 hover:scale-[1.02] hover:border-white/40'}"
                          onclick={() => selectCandidate(i)}
                          aria-label="Select candidate {i + 1}"
                        >
                          <img src={candidate.url} alt="Candidate {i + 1}" class="h-full w-full object-cover" />
                          <div class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent"></div>
                        </button>
                      {/each}
                    </div>

                    {#if imageRegenerate.selected_index === null}
                      <div class="flex flex-col items-center gap-4" in:fade={{ duration: 300 }}>
                        <p class="font-mono text-sm tracking-widest text-slate-500 uppercase">Choose one</p>
                        <button
                          type="button"
                          class="flex items-center gap-2 rounded-lg bg-white/10 px-6 py-2 font-bold text-white transition-all duration-200 hover:bg-white/20"
                          onclick={handle_regenerate}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            class="h-4 w-4 fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]"
                          >
                            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                          </svg>
                          <span class="font-mono text-xs tracking-widest uppercase">Regenerate</span>
                        </button>
                      </div>
                    {/if}
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
