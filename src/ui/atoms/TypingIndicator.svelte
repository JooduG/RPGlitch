<script>
    let { color = "var(--gunmetal)" } = $props()
</script>

<div class="typing-indicator" style="--dot-color: {color}">
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
</div>

<style lang="scss">
    .typing-indicator {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px; /* Tight gap for pill look */
        padding: 12px 20px; /* Pill padding */
        background: var(--surface-panel); /* Or a specific bubble color */
        border-radius: 9999px; /* Pill shape */
        box-shadow: var(--shadow-sm);
        height: 40px; /* Fixed height for consistency */
        width: fit-content;
    }

    .dot {
        width: 8px;
        height: 8px;
        background-color: var(--dot-color, currentColor);
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out both;

        &:nth-child(1) {
            animation-delay: -0.32s;
        }
        &:nth-child(2) {
            animation-delay: -0.16s;
        }
    }

    @keyframes bounce {
        0%,
        80%,
        100% {
            transform: scale(0);
        }
        40% {
            transform: scale(1);
        }
    }
</style>
