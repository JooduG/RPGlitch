<script>
  import { Label } from "bits-ui";

  let { class: className = "", disabled = false, children, onclick, ...rest } = $props();

  function handleClick(e) {
    if (rest.for) {
      const target = document.getElementById(rest.for);

      // If the target is a dropdown trigger, clicking the label usually only focuses it natively.
      // We want it to open! We exclude switches since native label clicks handle them perfectly.
      if (target && target.tagName === "BUTTON" && target.getAttribute("role") !== "switch") {
        e.preventDefault();
        // Headless UI libraries (like bits-ui / radix) often listen to `pointerdown`
        // to open dropdowns to avoid focus stealing, so `target.click()` is ignored.
        requestAnimationFrame(() => {
          target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
          target.click(); // Fallback for standard buttons
        });
      }
    }
    onclick?.(e);
  }
</script>

<Label.Root
  class="flex w-full items-center gap-4 {disabled
    ? 'cursor-default'
    : 'cursor-pointer'} text-left text-[10px] font-bold tracking-widest text-slate-400 uppercase {className}"
  onclick={handleClick}
  {...rest}
>
  {@render children?.()}
</Label.Root>
