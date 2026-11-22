<script>
  /**
   * @file src/ui/atoms/Label.svelte
   * Accessible label atom wrapping bits-ui Label.Root with dropdown trigger forwarding.
   */
  import { Label } from "bits-ui";

  let { class: className = "", disabled = false, children, onclick, ...rest } = $props();

  function handleClick(e) {
    if (rest.for) {
      const target = document.getElementById(rest.for);

      // Clicking a label tied to a dropdown trigger opens it rather than only focusing.
      // Switches handle native label clicks directly.
      if (target && target.tagName === "BUTTON" && target.getAttribute("role") !== "switch") {
        e.preventDefault();
        requestAnimationFrame(() => {
          target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
          target.click();
        });
      }
    }
    onclick?.(e);
  }
</script>

<Label.Root
  class={[
    "flex w-full items-center gap-standard text-left text-[10px] font-bold tracking-widest text-slate-400 uppercase",
    disabled ? "cursor-default" : "cursor-pointer",
    className,
  ]}
  onclick={handleClick}
  {...rest}>
  {@render children?.()}
</Label.Root>
