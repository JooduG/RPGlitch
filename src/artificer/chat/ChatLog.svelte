<script>
    import Message from './Message.svelte';
    
    let { messages = [] } = $props();
    let scrollContainer;

    $effect(() => {
        if (messages.length && scrollContainer) {
            // Auto-scroll to bottom on new messages
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    });
</script>

<div class="chat-log" bind:this={scrollContainer}>
    {#each messages as msg}
        <Message 
            text={msg.text} 
            sender={msg.sender} 
            timestamp={msg.timestamp} 
        />
    {/each}
</div>

<style lang="scss">
    .chat-log {
        flex: 1;
        overflow-y: auto;
        padding-bottom: 1rem;
        
        /* Scrollbar styling override */
        &::-webkit-scrollbar {
            width: 6px;
        }
        
        &::-webkit-scrollbar-track {
            background: transparent;
        }
    }
</style>
