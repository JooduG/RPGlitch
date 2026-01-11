<script>
    import { app } from '../stores/app.svelte.js';
</script>

<button 
    class="gear-btn" 
    onclick={() => app.toggleControlPanel()}
    title="Open Control Panel"
>
    ⚙️
</button>

<style>
    .gear-btn {
        background: transparent;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0.5;
        transition: opacity 0.2s, transform 0.3s;
        padding: 0;
        color: #71717a;
        pointer-events: auto;
    }
    .gear-btn:hover {
        opacity: 1;
        transform: rotate(45deg);
        color: #e4e4e7;
    }
</style>
