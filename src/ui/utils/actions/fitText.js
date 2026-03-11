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
    let maxSize = options.maxSize || 24
    let minSize = options.minSize || 12
    let lineHeight = options.lineHeight || "1.2"

    const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
            adjustFontSize(node, maxSize, minSize, lineHeight)
        })
    })
    resizeObserver.observe(node)

    // Initial adjust
    adjustFontSize(node, maxSize, minSize, lineHeight)

    return {
        update(newOptions) {
            maxSize = newOptions.maxSize || 24
            minSize = newOptions.minSize || 12
            lineHeight = newOptions.lineHeight || "1.2"
            adjustFontSize(node, maxSize, minSize, lineHeight)
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

    // Tolerance of 1px to prevent subpixel rounding loops
    const TOLERANCE = 1

    // While scrolling (overflowing) and size is above min
    // We check scrollHeight > clientHeight (vertical overflow)
    // Or scrollWidth > clientWidth (horizontal overflow, if no-wrap)
    while ((node.scrollHeight > node.clientHeight + TOLERANCE || node.scrollWidth > node.clientWidth + TOLERANCE) && size > minSize) {
        size--
        node.style.fontSize = `${size}px`
    }
}
