<script>
    let { 
        onclose, 
        variant = 'transparent', // 'transparent' (Stacks) | 'card' (Box) | 'media' (Image)
        children 
    } = $props();

    function handleKeydown(e) {
        if (e.key === 'Escape') onclose();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div 
    class="modal-backdrop" 
    onclick={(e) => { if(e.target === e.currentTarget) onclose(); }}
    onkeydown={(e) => { if(e.key === 'Escape') onclose(); }}
    tabindex="-1"
    role="dialog"
    aria-modal="true"
>
    <div class="modal-stage variant-{variant}">
        {@render children()}
    </div>
</div>

<style lang="scss">
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        z-index: 9000;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fade-in 0.2s ease-out;
        padding: 1rem;
        pointer-events: auto; /* Capture clicks */
    }

    .modal-stage {
        animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        max-height: 100%;
        overflow-y: auto;
        
        /* Hide scrollbar */
        scrollbar-width: none; 
        &::-webkit-scrollbar { display: none; }

        &.variant-transparent {
            background: transparent;
            width: 380px;
            max-width: 100%;
            display: flex;
            flex-direction: column;
            gap: 1rem; 
        }

        &.variant-card {
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 8px;
            padding: 1rem;
            width: 450px;
        }
        
        &.variant-media {
            width: auto; height: auto;
        }
    }

    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scale-in { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>
