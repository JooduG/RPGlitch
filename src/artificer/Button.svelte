<script>
    let { label, onclick, variant = 'primary' } = $props();
</script>

<button class="btn {variant}" {onclick}>
    {label}
</button>

<style lang="scss">
    .btn {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        width: 100%;

        &.primary {
            background: #2563eb; /* Blue 600 */
            color: white;
            &:hover { background: #1d4ed8; }
        }

        &.secondary {
            background: #27272a; /* Zinc 800 */
            color: #e4e4e7;
            border: 1px solid #3f3f46;
            &:hover { background: #3f3f46; }
        }

        &.danger {
            background: rgba(220, 38, 38, 0.1);
            color: #f87171;
            border: 1px solid #7f1d1d;
            &:hover { background: rgba(220, 38, 38, 0.2); }
        }
    }
</style>
