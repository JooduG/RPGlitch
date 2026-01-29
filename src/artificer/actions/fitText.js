/**
 * Svelte Action: fitText
 * Automatically scales font size down to fit within the container's height/width.
 *
 * @param {HTMLElement} node
 * @param {Object} [options]
 * @param {number} [options.maxSize=24] - Maximum font size in px
 * @param {number} [options.minSize=12] - Minimum font size in px
 * @param {string} [options.lineHeight='1.2'] - Line height to apply
 */
export function fitText(node, options = {}) {
    const maxSize = options.maxSize || 24
    const minSize = options.minSize || 12
    const lineHeight = options.lineHeight || "1.2"

    const resizeObserver = new ResizeObserver(() => {
        adjustFontSize(node, maxSize, minSize, lineHeight)
    })
    resizeObserver.observe(node)

    // Initial adjust
    adjustFontSize(node, maxSize, minSize, lineHeight)

    return {
        update(newOptions) {
            options = newOptions
            adjustFontSize(
                node,
                options.maxSize || 24,
                options.minSize || 12,
                options.lineHeight || "1.2"
            )
        },
        destroy() {
            resizeObserver.disconnect()
        },
    }
}

function adjustFontSize(node, maxSize, minSize, lineHeight) {
    let size = maxSize
    node.style.fontSize = `${size}px`
    node.style.lineHeight = lineHeight

    // While scrolling (overflowing) and size is above min
    // We check scrollHeight > clientHeight (vertical overflow)
    // Or scrollWidth > clientWidth (horizontal overflow, if no-wrap)
    while (
        (node.scrollHeight > node.clientHeight ||
            node.scrollWidth > node.clientWidth) &&
        size > minSize
    ) {
        size--
        node.style.fontSize = `${size}px`
    }
}
