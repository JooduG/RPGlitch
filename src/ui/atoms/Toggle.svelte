<script>
  /** @type {{
   *  value?: boolean,
   *  label?: string,
   *  size?: "md"|"sm",
   *  disabled?: boolean,
   *  onchange?: (e: Event & { currentTarget: HTMLInputElement }) => void
   * }} */
  let {
    value = $bindable(),
    label,
    size = "md",
    disabled = false,
    onchange = (e) => {},
  } = $props();
</script>

<label class="toggle-switch" class:disabled class:sm={size === "sm"}>
  <input
    type="checkbox"
    bind:checked={value}
    {disabled}
    {onchange}
    data-testid={label ? `${label.toLowerCase().replace(/\s+/g, "-")}-toggle` : undefined}
  />
  <span class="slider"></span>
  {#if label}
    <span class="label-text">{label}</span>
  {/if}
</label>

<style>
  .toggle-switch {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-m);
    cursor: pointer;
    user-select: none;
    position: relative;
    padding: var(--spacing-xxs) 0;
    transition: opacity var(--motion-fast);

    /* --- SIZES --- */
    --switch-w: 2.8rem;
    --switch-h: 1.25rem;
    --thumb-size: 1rem;
  }

  .toggle-switch.disabled {
    opacity: var(--opacity-m);
    cursor: not-allowed;
  }

  .toggle-switch.sm {
    --switch-w: 2.22rem;
    --switch-h: 1rem;
    --thumb-size: 0.8rem;
  }

  /* Hidden Input */
  .toggle-switch input {
    opacity: var(--opacity-none);
    width: 0;
    height: 0;
    position: absolute;
  }

  /* The Track */
  .slider {
    position: relative;
    width: var(--switch-w);
    height: var(--switch-h);
    background-color: var(--color-chalk);
    box-shadow: inset 0 1px 2px rgb(var(--color-black-rgb) / 0.2);
    border-radius: var(--border-radius-full);
    transition: all 0.2s var(--motion-elastic);
    flex-shrink: 0;
  }

  /* The Thumb */
  .slider::before {
    content: "";
    position: absolute;
    height: var(--thumb-size);
    width: var(--thumb-size);
    left: calc((var(--switch-h) - var(--thumb-size)) / 2);
    top: calc((var(--switch-h) - var(--thumb-size)) / 2);
    background-color: var(--color-frisk);
    border-radius: var(--border-radius-full);
    transition: all 0.2s var(--motion-elastic);
    box-shadow: var(--shadow-s);
  }

  /* Hover State */
  .toggle-switch:hover:not(.disabled) .slider {
    border-color: rgb(var(--color-white-rgb) / var(--opacity-s));
  }

  /* Checked State */
  .toggle-switch input:checked + .slider {
    background-color: var(--color-gunmetal);
    box-shadow: 0 0 0 1px rgb(var(--color-white-rgb) / var(--opacity-l));
  }

  .toggle-switch input:checked + .slider::before {
    transform: translateX(
      calc(var(--switch-w) - var(--thumb-size) - (var(--switch-h) - var(--thumb-size)))
    );
    background-color: var(--color-white);
    box-shadow: 0 0 var(--spacing-s) rgb(var(--color-white-rgb) / 0.4);
  }

  /* Label Text */
  .label-text {
    color: var(--font-color-m);
    font-weight: var(--font-weight-l);
    font-size: var(--font-size-xs);
    letter-spacing: var(--letter-spacing-m);
    text-transform: uppercase;
    font-family: var(--font-family-body);
    transition: color var(--motion-fast);
  }

  .toggle-switch:hover .label-text {
    color: var(--color-white);
  }

  /* Focus State */
  .toggle-switch input:focus-visible + .slider {
    outline: 2px solid var(--color-frozen);
    outline-offset: 2px;
  }
</style>
