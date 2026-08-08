<script>
  /**
   * @file ImagePicker.svelte
   * 🎲 The 3-Card Regenerate Picker
   * Three image candidates are revealed face-up so the user can see
   * and pick their favorite. Includes a "Regenerate" button for a 2nd
   * round of generation with LLM-refined prompts.
   */
  import {
    image_picker,
    select_candidate,
    close_regenerate,
    deliver_candidates,
    set_regenerate_error,
    begin_picker_regeneration,
    get_persisted_meta,
  } from "./ImagePicker.svelte.js";
  import { visual_engine, get_resolution } from "@media";
  import { Backdrop, Button } from "@atoms";
  import { Dialog } from "bits-ui";
  import { fade } from "svelte/transition";

  let is_regenerating = $state(false);

  function resolve_candidate_resolution(candidate) {
    const meta_res = candidate?.metadata?.resolution;
    if (meta_res && typeof meta_res === "string" && meta_res.includes("x")) {
      const [w, h] = meta_res.split("x").map(Number);
      if (w && h) return { width: w, height: h };
    }
    const mode = candidate?.metadata?.mode || image_picker.last_mode || "character";
    return get_resolution(mode);
  }

  async function handle_regenerate() {
    if (is_regenerating) return;
    const key = image_picker.regenerating_key;
    if (!key) {
      set_regenerate_error("No image context available to regenerate.");
      return;
    }

    // Read persisted meta BEFORE begin_picker_regeneration (plain variables, not $state)
    const meta = get_persisted_meta();

    is_regenerating = true;
    // Regenerate IN PLACE — the picker modal stays open, drops back to the
    // Generating state, and fills with the fresh round of cards on
    // deliver_candidates(). (Previously this called close_picker(), which made
    // the button appear to do nothing: it just closed the modal and you had to
    // click "Select Image" again.)
    begin_picker_regeneration();
    try {
      const signature_color = image_picker.signature_color;

      const prompt = meta.prompt || "";
      const mode = meta.mode || "character";
      const negative_prompt = meta.negative_prompt || "";

      if (!prompt) {
        console.error("[ImagePicker] NO PROMPT! meta was:", meta);
        set_regenerate_error("No prompt found for this image. Cannot regenerate.");
        return;
      }

      let final_prompt = prompt;
      let final_negative = negative_prompt;
      try {
        const refined = await visual_engine.enhance(prompt, mode);
        if (refined?.prompt) {
          final_prompt = refined.prompt;
          final_negative = refined.negative_prompt || negative_prompt;
        }
      } catch (enhanceErr) {
        console.warn("[ImagePicker] Prompt enhancement failed, using original prompt:", enhanceErr);
      }

      // SAFETY NET: If enhance() returned a full JSON blob instead of just the prompt field,
      // extract the prompt field from it. This happens when _parseRefineResponse fails to peel the JSON.
      if (final_prompt.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(final_prompt.trim());
          if (parsed.prompt && typeof parsed.prompt === "string") {
            final_prompt = parsed.prompt;
            if (parsed.negative_prompt) final_negative = parsed.negative_prompt;
          }
        } catch (_e) {
          const prompt_match = final_prompt.match(/"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
          if (prompt_match && prompt_match[1]) {
            final_prompt = prompt_match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
          }
        }
      }

      const new_candidates = await visual_engine.generate_candidates(final_prompt, {
        mode,
        negative_prompt: final_negative,
        count: 3,
        min_success: 2,
      });

      if (new_candidates.length < 2) {
        set_regenerate_error("Not enough images generated. Please try again.");
        return;
      }

      deliver_candidates(
        new_candidates.map((c) => ({
          url: c.url,
          metadata: { ...c.metadata, prompt: final_prompt, mode },
          signature_color,
        })),
        { prompt: final_prompt, mode, negative_prompt: final_negative },
      );
    } catch (err) {
      console.error("[Regenerate Error]", err);
      set_regenerate_error(`Regenerate failed: ${err.message || err}`);
    } finally {
      is_regenerating = false;
    }
  }
</script>

{#if image_picker.picker_open}
  <Dialog.Root open={true} preventScroll={false}>
    <Dialog.Portal>
      <Dialog.Overlay forceMount>
        {#snippet child({ props: overlayProps })}
          <Backdrop {...overlayProps} layer="image">
            <Dialog.Content forceMount onInteractOutside={(e) => e.preventDefault()} onOpenAutoFocus={(e) => e.preventDefault()}>
              {#snippet child({ props: contentProps })}
                <div
                  {...contentProps}
                  class="relative flex min-h-[60vh] w-[clamp(20rem,95vw,96rem)] flex-col items-center justify-center gap-8 px-2 py-6"
                  onclick={(e) => e.stopPropagation()}
                >
                  {#if image_picker.error}
                    <div class="flex flex-col items-center gap-4" in:fade={{ duration: 200 }}>
                      <p class="text-lg text-red-400">{image_picker.error}</p>
                      <div class="flex gap-4">
                        <Button
                          variant="bare"
                          class="rounded-lg bg-white/10 px-6 py-2 font-bold text-white transition-colors hover:bg-white/20"
                          onclick={() => {
                            close_regenerate();
                          }}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  {:else if image_picker.candidates.length < 2}
                    <div class="flex flex-col items-center gap-4" in:fade={{ duration: 200 }}>
                      <div class="flex gap-1.5">
                        <div class="h-3 w-3 animate-pulse rounded-full bg-white/60" style="animation-delay: 0ms"></div>
                        <div class="h-3 w-3 animate-pulse rounded-full bg-white/60" style="animation-delay: 150ms"></div>
                        <div class="h-3 w-3 animate-pulse rounded-full bg-white/60" style="animation-delay: 300ms"></div>
                      </div>
                    </div>
                  {:else if image_picker.candidates.length >= 2}
                    <!-- POLAROID CARD GRID -->
                    <div class="flex max-w-full flex-wrap items-end justify-center gap-6 p-4 md:gap-8 lg:gap-10" in:fade={{ duration: 300 }}>
                      {#each image_picker.candidates as candidate, i (i)}
                        {@const letter = String.fromCharCode(65 + i)}
                        {@const { width: cW, height: cH } = resolve_candidate_resolution(candidate)}
                        {@const ratio = cW && cH ? cW / cH : 2 / 3}
                        {@const ar = `${cW} / ${cH}`}
                        {@const rot = i === 0 ? -4 : i === 2 ? 4 : 0}
                        {@const card_width_class =
                          ratio > 1.15
                            ? "w-72 sm:w-80 md:w-[26rem] lg:w-[28rem]"
                            : ratio >= 0.85
                              ? "w-64 sm:w-72 md:w-80 lg:w-84"
                              : "w-60 sm:w-64 md:w-72 lg:w-76"}
                        <Button
                          variant="bare"
                          class="group relative {card_width_class} shrink-0 pt-2 pb-10 shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out {image_picker.selected_index ===
                          i
                            ? 'scale-105 cursor-default ring-2 ring-emerald-400/60'
                            : image_picker.selected_index !== null
                              ? 'scale-95 cursor-default opacity-40'
                              : 'cursor-pointer hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)]'}"
                          style="background: #f5f0e6; border-radius: var(--radius-sharp); transform-origin: bottom center; transform: rotate({rot}deg);"
                          onclick={() => select_candidate(i)}
                          aria-label="Select candidate {letter}"
                        >
                          <div class="relative overflow-hidden bg-neutral-200" style="aspect-ratio: {ar};">
                            <img src={candidate.url} alt="Candidate {letter}" class="h-full w-full object-cover" />
                            {#if image_picker.selected_index === i}
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
                        </Button>
                      {/each}
                    </div>

                    {#if image_picker.selected_index === null}
                      <div class="flex flex-wrap items-center justify-center gap-3" in:fade={{ duration: 300 }}>
                        <span class="font-mono text-sm tracking-widest text-slate-400 uppercase">Choose One or</span>
                        <Button
                          variant="bare"
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
                        </Button>
                      </div>
                    {/if}
                  {:else}
                    <div class="flex flex-col items-center gap-4" in:fade={{ duration: 200 }}>
                      <p class="font-mono text-sm tracking-widest text-slate-500 uppercase">No pictures available</p>
                      <Button
                        variant="bare"
                        class="rounded-lg bg-white/10 px-6 py-2 font-bold text-white transition-colors hover:bg-white/20"
                        onclick={close_regenerate}
                      >
                        Close
                      </Button>
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
