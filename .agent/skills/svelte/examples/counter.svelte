<script lang="ts">
    interface Props {
        initial?: number
    }
    let { initial = 0 }: Props = $props() // Correct Props

    let count = $state(initial) // Correct State
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
