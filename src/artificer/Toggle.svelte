<script>
    let {
        value = $bindable(false),
        label,
        size = "md",
        disabled = false,
        onchange,
    } = $props()
</script>

<label class="toggle-switch" class:disabled class:sm={size === "sm"}>
    <input type="checkbox" bind:checked={value} {disabled} {onchange} />
    <span class="slider"></span>
    {#if label}
        <span class="label-text">{label}</span>
    {/if}
</label>

<style lang="scss">
    .toggle-switch {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        user-select: none;
        position: relative;

        &.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* --- SIZES --- */
        --switch-w: 2.75rem;
        --switch-h: 1.5rem;
        --thumb-size: 1.1rem;

        &.sm {
            --switch-w: 2.25rem;
            --switch-h: 1.25rem;
            --thumb-size: 0.9rem;
            font-size: 0.85rem;
        }
    }

    /* Hidden Input */
    input {
        opacity: 0;
        width: 0;
        height: 0;
        position: absolute;
    }

    /* The Track */
    .slider {
        position: relative;
        width: var(--switch-w);
        height: var(--switch-h);
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 99px;
        transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid rgba(255, 255, 255, 0.1);

        /* The Thumb */
        &::before {
            content: "";
            position: absolute;
            height: var(--thumb-size);
            width: var(--thumb-size);
            left: 0.2rem;
            bottom: calc((var(--switch-h) - var(--thumb-size)) / 2 - 1px);
            background-color: #a1a1aa;
            border-radius: 50%;
            transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
    }

    /* Checked State */
    input:checked + .slider {
        background-color: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);

        &::before {
            transform: translateX(
                calc(var(--switch-w) - var(--thumb-size) - 0.4rem)
            );
            background-color: #fff;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }
    }

    /* Label Text */
    .label-text {
        color: #e4e4e7;
        font-weight: 500;
        letter-spacing: 0.02em;
        font-family: var(--font-body, system-ui);
    }

    /* Focus State */
    input:focus-visible + .slider {
        outline: 2px solid white;
        outline-offset: 2px;
    }
</style>
