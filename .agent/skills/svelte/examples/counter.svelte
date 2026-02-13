<script lang="ts">
    import { untrack } from "svelte"
    interface Props {
        initial?: number
    }
    const props: Props = $props()

    let count = $state(untrack(() => props.initial ?? 0)) // Isolated Initial State
    // (Alternative: If reactive reset is needed, use an $effect)
    let double = $derived(count * 2) // Correct Derived

    $effect(() => {
        // Correct Effect
        console.log(`Count changed to: ${count}`)
    })

    function increment() {
        count += 1
    }
</script>

<button onclick={increment}>
    Count: {count}, Double: {double}
</button>
