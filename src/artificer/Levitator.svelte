<script>
    let {
        children,
        className = "",
        lift = "-4px",
        wobbleIntensity = 3,
    } = $props()

    let element = $state()
    let rotX = $state(0)
    let rotY = $state(0)
    let isHovering = $state(false)

    function handleMouseMove(e) {
        if (!element) return
        const rect = element.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const centerX = rect.width / 2
        const centerY = rect.height / 2

        // Normalize -1 to 1
        const percentX = (x - centerX) / (rect.width / 2)
        const percentY = (y - centerY) / (rect.height / 2)

        rotY = percentX * wobbleIntensity
        rotX = -percentY * wobbleIntensity
    }

    function handleMouseEnter() {
        isHovering = true
    }

    function handleMouseLeave() {
        isHovering = false
        rotX = 0
        rotY = 0
    }
</script>

<div
    bind:this={element}
    class="levitator {className}"
    style="--lift-amount: {lift}; --rot-x: {rotX}deg; --rot-y: {rotY}deg"
    onmousemove={handleMouseMove}
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    role="presentation"
>
    {@render children?.()}
</div>

<style lang="scss">
    .levitator {
        /* 
           Using a short duration/ease-out for transform makes the wobble feel responsive 
           but not jittery. 
        */
        transition:
            transform 0.1s ease-out,
            box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        will-change: transform, box-shadow;
        transform-style: preserve-3d;
        perspective: 1000px;

        &:hover {
            transform: translateY(var(--lift-amount)) rotateX(var(--rot-x))
                rotateY(var(--rot-y));
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
        }
    }
</style>
