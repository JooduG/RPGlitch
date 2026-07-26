<script>
  /**
   * @file ImageReroll.svelte
   * 🎲 The 3-Card Reroll Picker
   * Vampire-Survivors-style card flip selection. Three image candidates
   * are dealt face-down then revealed simultaneously.
   * Candidates are already generated before the picker opens — no loading state here.
   */
  import { imageReroll, selectCandidate, closeReroll } from "@state";
  import { Backdrop } from "@atoms";
  import { Dialog } from "bits-ui";
  import { fade } from "svelte/transition";

  let open = $state(true);

  $effect(() => {
    if (!open) closeReroll();
  });
</script>

{#if imageReroll.picker_open}
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
                  {#if imageReroll.error}
                    <div class="flex flex-col items-center gap-4" in:fade={{ duration: 200 }}>
                      <p class="text-lg text-red-400">{imageReroll.error}</p>
                      <button
                        class="rounded-lg bg-white/10 px-6 py-2 font-bold text-white transition-colors hover:bg-white/20"
                        onclick={() => closeReroll()}
                      >
                        Close
                      </button>
                    </div>
                  {:else}
                    <!-- CARD GRID -->
                    <div class="flex flex-wrap items-center justify-center gap-4 md:gap-8" in:fade={{ duration: 300 }}>
                      {#each imageReroll.candidates as candidate, i (i)}
                        <button
                          type="button"
                          class="group relative h-72 w-56 cursor-pointer perspective-[1000px] md:h-80 md:w-64"
                          onclick={() => selectCandidate(i)}
                          aria-label="Select candidate {i + 1}"
                        >
                          <div
                            class="relative h-full w-full transition-transform duration-700 ease-out"
                            style="transform-style: preserve-3d; {imageReroll.selected_index === i
                              ? 'transform: rotateY(180deg) scale-105;'
                              : imageReroll.selected_index !== null
                                ? 'transform: scale-95; opacity-0.4;'
                                : ''}"
                          >
                            <!-- FRONT: face-down card -->
                            <div
                              class="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-white/15 bg-linear-to-br from-zinc-800/80 to-zinc-900/90 shadow-xl backdrop-blur-md"
                              style="backface-visibility: hidden;"
                            >
                              <div class="flex flex-col items-center gap-3">
                                <div
                                  class="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/20 bg-white/5 text-lg font-bold text-white/40"
                                >
                                  {i + 1}
                                </div>
                                <span class="font-mono text-xs tracking-widest text-white/30 uppercase">Select</span>
                              </div>
                            </div>

                            <!-- BACK: revealed image -->
                            <div
                              class="absolute inset-0 overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl"
                              style="backface-visibility: hidden; transform: rotateY(180deg);"
                            >
                              <img src={candidate.url} alt="Candidate {i + 1}" class="h-full w-full object-cover" />
                              <div class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent"></div>
                            </div>
                          </div>

                          <!-- Selected indicator -->
                          {#if imageReroll.selected_index === i}
                            <div class="absolute -inset-1 -z-10 rounded-2xl border-2 border-emerald-400/60" in:fade={{ duration: 200 }}></div>
                          {/if}
                        </button>
                      {/each}
                    </div>

                    {#if imageReroll.selected_index === null}
                      <p class="font-mono text-sm tracking-widest text-slate-500 uppercase" in:fade={{ duration: 300 }}>
                        Choose the one you like best
                      </p>
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
