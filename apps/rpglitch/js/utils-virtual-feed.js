
/**
 * utils-virtual-feed.js
 * A virtual scrolling implementation for the RPGlitch chat feed.
 * Handles variable height items using estimated heights + ResizeObserver.
 */

export class VirtualFeed {
    /**
     * @param {HTMLElement} container - The scrollable container
     * @param {Function} renderItemCallback - (item, container) => void. Function to render a single item.
     */
    constructor(container, renderItemCallback) {
        this.container = container;
        this.renderCallback = renderItemCallback;

        this.items = [];
        this.heights = new Map(); // itemId -> actual pixel height
        this.estimatedHeight = 150; // A reasonable guess for a message (text + padding)
        this.buffer = 5; // Extra items to render above/below viewport

        // Create Spacers
        this.spacerTop = document.createElement('div');
        this.spacerTop.className = 'virtual-spacer-top';
        this.spacerTop.style.height = '0px';
        this.spacerTop.style.width = '100%';

        this.spacerBottom = document.createElement('div');
        this.spacerBottom.className = 'virtual-spacer-bottom';
        this.spacerBottom.style.height = '0px';
        this.spacerBottom.style.width = '100%';

        // State Loop
        this.resizeObserver = new ResizeObserver(this._onResize.bind(this));

        // Throttled Scroll Handler
        this._ticking = false;
        this.container.addEventListener('scroll', () => {
            if (!this._ticking) {
                window.requestAnimationFrame(() => {
                    this.render();
                    this._ticking = false;
                });
                this._ticking = true;
            }
        }, { passive: true });

        // Initial setup
        this.container.innerHTML = "";
    }

    /**
     * Updates the data source and triggers a render.
     * @param {Array} newItems - Array of objects. Each MUST have a unique `.id` property.
     */
    setItems(newItems) {
        // Detect if we should stick to bottom
        // We stick if we are already near the bottom
        const threshold = 50;
        const isAtBottom = (this.container.scrollHeight - this.container.scrollTop - this.container.clientHeight) < threshold;

        this.items = newItems;
        this.render();

        if (isAtBottom) {
            // Use setTimeout to allow DOM to paint and sizes to settle if needed
            // But usually requestAnimationFrame is better to look smooth
            requestAnimationFrame(() => {
                this.container.scrollTop = this.container.scrollHeight;
            });
        }
    }

    /**
     * Core Render Loop
     * Determines which items are visible, sets spacer heights, and renders only visible items.
     */
    render() {
        const scrollTop = this.container.scrollTop;
        const clientHeight = this.container.clientHeight;
        const totalItems = this.items.length;

        // 1. Calculate Offsets & Total Height
        // We do this dynamically because heights might have changed
        const offsets = []; // Index -> Top Offset
        let currentOffset = 0;

        for (let i = 0; i < totalItems; i++) {
            offsets[i] = currentOffset;
            const item = this.items[i];
            const h = this.heights.get(item.id) || this.estimatedHeight;
            currentOffset += h;
        }

        const totalContentHeight = currentOffset;

        // 2. Determine Visible Range
        // Start: first item where (offset + height) > (scrollTop - bufferHeight)
        // End: first item where offset > (scrollTop + clientHeight + bufferHeight)

        // Optimize: Binary search would be faster for 10k items, but for <500 items, linear scan is instant.
        // Let's stick to linear for simplicity and robustness with variable heights.

        const viewTop = scrollTop;
        const viewBottom = scrollTop + clientHeight;

        let startIndex = 0;
        let endIndex = totalItems - 1;

        // Find Start
        for (let i = 0; i < totalItems; i++) {
            const h = this.heights.get(this.items[i].id) || this.estimatedHeight;
            if (offsets[i] + h > viewTop) {
                startIndex = Math.max(0, i - this.buffer);
                break;
            }
        }

        // Find End
        for (let i = startIndex; i < totalItems; i++) {
            if (offsets[i] > viewBottom) {
                endIndex = Math.min(totalItems - 1, i + this.buffer);
                break;
            }
        }

        // Edge case: if scrollTop is huge (users scrolled way down), but items are few?
        // Logic holds.

        // 3. Update Spacers
        const topHeight = offsets[startIndex];

        // Calculate bottom height: Total - (offset of item AFTER end)
        // If endIndex is last item, bottom is 0.
        // offset[endIndex] is top of last rendered item.
        // height of last rendered item needs to be added to get top of next.

        let bottomBase = 0;
        if (endIndex < totalItems - 1) {
            const nextIndex = endIndex + 1;
            bottomBase = offsets[nextIndex];
        } else {
            const lastItem = this.items[endIndex];
            const lastH = this.heights.get(lastItem.id) || this.estimatedHeight;
            bottomBase = offsets[endIndex] + lastH;
        }

        const bottomHeight = totalContentHeight - bottomBase;

        this.spacerTop.style.height = `${topHeight}px`;
        this.spacerBottom.style.height = `${bottomHeight}px`;

        // 4. Render Items
        // We want to avoid blowing away items that are already there if possible (to keep focus/selection),
        // but simple "clear & rebuild" is safer for v1.
        // To support "clear & rebuild" inside a container with spacers, we need to handle the DOM node list.

        // Detach Observer for cleanup
        this.resizeObserver.disconnect();

        // Safe Clear: Remove all elements between top and bottom spacer
        // But since we appended spacers to this.container, we can just manipulate siblings?
        // No, simplest way:
        // container.innerHTML = "" -> Kills spacers.
        // Let's use a DocumentFragment for the new items.

        const fragment = document.createDocumentFragment();

        for (let i = startIndex; i <= endIndex; i++) {
            const item = this.items[i];

            // We need a wrapper to observe height? 
            // Or we assume renderCallback appends a single element?
            // "renderChat" passes a container. It appends a DIV.
            // Let's create a temporary container to capture the element, 
            // OR change the contract so renderCallback returns the element.
            // But refactoring renderChat to return element is invasive.
            // Alternative: pass the fragment to renderCallback.

            // Wait, existing renderMessage calculates logic and appends.
            // We can pass the fragment as the container.

            this.renderCallback(fragment, item, i);
        }

        // Now identify the newly created elements.
        // renderMessage creates <div class="story-message"...>
        // We need to tag them with ID for ResizeObserver.

        const children = Array.from(fragment.children);
        children.forEach((el, idx) => {
            const dataIndex = startIndex + idx;
            const item = this.items[dataIndex];
            if (item) {
                el.dataset.virtualId = item.id;
                this.resizeObserver.observe(el);
            }
        });

        // 5. Commit to DOM
        // We need to keep spacers.
        // Strategy:
        // 1. Ensure spacerTop is first child.
        // 2. Ensure spacerBottom is last child.
        // 3. Everything safely in between is replaced.

        // Implementation:
        // Clear middle
        while (this.container.firstChild) {
            this.container.firstChild.remove();
        }

        this.container.appendChild(this.spacerTop);
        this.container.appendChild(fragment);
        this.container.appendChild(this.spacerBottom);
    }

    _onResize(entries) {
        let changed = false;
        for (const entry of entries) {
            const id = entry.target.dataset.virtualId;
            if (id) {
                const h = entry.borderBoxSize ? entry.borderBoxSize[0].blockSize : entry.target.offsetHeight;
                if (this.heights.get(id) !== h) {
                    this.heights.set(id, h);
                    changed = true;
                }
            }
        }

        // If heights changed, we might need to adjust spacers.
        // NOTE: If we just re-render, it might trigger loops if not careful.
        // But we MUST update spacers if an Estimated(150) -> Actual(300).
        // Otherwise scrollbar lies.
        if (changed) {
            // We do NOT want to full re-render DOM (flash), just adjust spacers.
            // But re-calculating offsets is complex. 
            // Re-calling render() is safest for consistency, but expensive?
            // "Recalculate heights and apply style" is cheaper.

            // Let's just call render() but maybe optimized?
            // Actually, standard practice: just run render logic.
            // Since "items to render" probably won't change much, the DOM diff would be small...
            // BUT we are doing "Clear & Replace" in render(), so that's bad for loop.

            // Optimization: Just update Spacer Heights in place without DOM touch.
            this._updateSpacerHeightsOnly();
        }
    }

    _updateSpacerHeightsOnly() {
        // Plan: Debounce the resize handling strongly.
        if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
        this._resizeTimeout = setTimeout(() => {
            // Only adjust spacers, don't re-render items if possible.
            // But simpler to just render.
            this.render();
        }, 100);
    }
}
