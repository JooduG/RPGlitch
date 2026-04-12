<script>
  /**
   * @file Slider.svelte
   * 🕹️ THE DIAGNOSTIC SLIDER
   * A reusable Nordic range input with a glass track and Frozen knob.
   */
  let {
    value = $bindable(1.0),
    min = 0,
    max = 2.0,
    step = 0.1,
    disabled = false,
    label = "",
    onchange = null,
  } = $props();
</script>

<label class="slider-group" class:disabled>
  <span class="slider-label">
    {label}: {disabled ? 'DISABLED' : (value ?? 1.0).toFixed(1)}
  </span>
  <input
    type="range"
    {min}
    {max}
    {step}
    bind:value
    {disabled}
    onchange={(e) => onchange?.(e)}
  />
</label>

<style>
  .slider-group {
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    width: 100%;
    gap: var(--spacing-xxs);
  }

  .slider-label {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxs);
    color: var(--font-color-s);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-m);
    margin-bottom: var(--spacing-xxs);
  }

  .slider-group.disabled {
    opacity: var(--opacity-m);
  }

  input[type="range"] {
    display: block;
    width: 100%;
    margin: 0;
    height: var(--spacing-s);
    background: transparent;
    appearance: none;
    outline: none;
    border: none;
    padding: 0;
    overflow: visible;
  }

  /* Track Styling */
  input[type="range"]::-webkit-slider-runnable-track {
    width: 100%;
    height: 0.25rem;
    background: var(--glass-xs);
    box-shadow: inset 0 1px 2px rgb(var(--color-black-rgb) / var(--opacity-s));
    border-radius: var(--border-radius-full);
    border: none;
  }

  input[type="range"]::-moz-range-track {
    width: 100%;
    height: 0.25rem;
    background: var(--glass-xs);
    box-shadow: inset 0 1px 2px rgb(var(--color-black-rgb) / var(--opacity-s));
    border-radius: var(--border-radius-full);
    border: none;
  }

  /* Thumb Styling */
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: var(--spacing-s);
    height: var(--spacing-s);
    background: var(--color-frozen);
    border-radius: var(--border-radius-full);
    cursor: pointer;
    box-shadow:
      0 0 8px var(--color-frozen),
      var(--shadow-s);
    margin-top: -0.25rem; /* Centering on 0.25rem track */
    border: none;
    transition: transform var(--motion-fast) var(--motion-elastic);
  }

  input[type="range"]::-moz-range-thumb {
    appearance: none;
    width: var(--spacing-s);
    height: var(--spacing-s);
    background: var(--color-frozen);
    border-radius: var(--border-radius-full);
    cursor: pointer;
    box-shadow:
      0 0 8px var(--color-frozen),
      var(--shadow-s);
    border: none;
    transition: transform var(--motion-fast) var(--motion-elastic);
  }

  input[type="range"]:active:not(:disabled)::-webkit-slider-thumb {
    transform: scale(1.2);
  }

  input[type="range"]:active:not(:disabled)::-moz-range-thumb {
    transform: scale(1.2);
  }

  input[type="range"]:disabled::-webkit-slider-thumb {
    appearance: none;
    background: var(--color-frozen);
    opacity: var(--opacity-s);
    box-shadow: none;
    border: none;
  }

  input[type="range"]:disabled::-moz-range-thumb {
    background: var(--color-frozen);
    opacity: var(--opacity-s);
    box-shadow: none;
    border: none;
  }
</style>
