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
    this.spacerTop = document.createElement("div");
    this.spacerTop.className = "virtual-spacer-top";
    this.spacerTop.style.height = "0px";
    this.spacerTop.style.width = "100%";

    this.spacerBottom = document.createElement("div");
    this.spacerBottom.className = "virtual-spacer-bottom";
    this.spacerBottom.style.height = "0px";
    this.spacerBottom.style.width = "100%";

    // State Loop
    this.resizeObserver = new ResizeObserver(this._onResize.bind(this));

    // Throttled Scroll Handler
    this._ticking = false;
    this.container.addEventListener(
      "scroll",
      () => {
        if (!this._ticking) {
          window.requestAnimationFrame(() => {
            this.render();
            this._ticking = false;
          });
          this._ticking = true;
        }
      },
      { passive: true },
    );

    // Initial setup
    this.container.innerHTML = "";
  }

  /**
   * Updates the data source and triggers a render.
   * @param {Array} newItems - Array of objects. Each MUST have a unique `.id` property.
   */
  setItems(newItems) {
    this.items = (newItems || []).filter(
      (item) => item && item.id !== undefined,
    );
    this.render();
  }

  /**
   * Core Render Loop
   * Determines which items are visible, sets spacer heights, and renders only visible items.
   */
  render() {
    const scrollTop = this.container.scrollTop;
    const clientHeight = this.container.clientHeight;
    // Capture "Sticky" state BEFORE we touch anything
    const distToBottom = this.container.scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distToBottom < 50;

    const totalItems = this.items.length;

    // 1. Calculate Offsets & Total Height
    const offsets = []; // Index -> Top Offset
    let currentOffset = 0;

    for (let i = 0; i < totalItems; i++) {
      offsets[i] = currentOffset;
      const item = this.items[i];

      if (!item) continue;
      const h = this.heights.get(item.id) || this.estimatedHeight;
      currentOffset += h;
    }

    const totalContentHeight = currentOffset;

    // 2. Determine Visible Range
    const viewTop = scrollTop;
    const viewBottom = scrollTop + clientHeight;

    let startIndex = 0;
    let endIndex = totalItems - 1;

    // Find Start
    for (let i = 0; i < totalItems; i++) {
      if (!this.items[i]) continue;
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

    // 3. Update Spacers
    const topHeight = offsets[startIndex];
    let bottomBase = 0;
    if (endIndex < totalItems - 1) {
      const nextIndex = endIndex + 1;
      bottomBase = offsets[nextIndex];
    } else {
      const lastItem = this.items[endIndex];
      // Safety check for lastItem
      const lastH =
        lastItem && this.heights.get(lastItem.id)
          ? this.heights.get(lastItem.id)
          : this.estimatedHeight;
      bottomBase = offsets[endIndex] + lastH;
    }
    const bottomHeight = totalContentHeight - bottomBase;

    this.spacerTop.style.height = `${topHeight}px`;
    this.spacerBottom.style.height = `${bottomHeight}px`;

    // 4. Recycle & Render
    // ⚡ BOLT OPTIMIZATION: DOM Recycling to prevent Layout Thrashing
    const existingNodes = new Map();
    // Detach all children to recycle or remove
    while (this.container.firstElementChild) {
      const el = this.container.firstElementChild;
      if (
        el === this.spacerTop ||
        el === this.spacerBottom ||
        el === this.footer
      ) {
        el.remove();
        continue;
      }
      if (el.dataset.virtualId) existingNodes.set(el.dataset.virtualId, el);
      el.remove();
    }

    this.resizeObserver.disconnect();
    const fragment = document.createDocumentFragment();

    for (let i = startIndex; i <= endIndex; i++) {
      const item = this.items[i];
      const existing = existingNodes.get(item.id);
      let reused = false;

      const cacheState = this._getCacheState(item);

      // Smart Reuse Check: content equality
      if (existing && existing._vCache) {
        if (this._isCacheMatch(existing._vCache, cacheState)) {
          fragment.appendChild(existing);
          this.resizeObserver.observe(existing); // Re-observe
          reused = true;
        }
      }

      if (!reused) {
        this.renderCallback(fragment, item, i);
        const newNode = fragment.lastElementChild;
        if (newNode) {
          newNode.dataset.virtualId = item.id;
          this.resizeObserver.observe(newNode);
          // Store for next run
          newNode._vCache = cacheState;
        }
      }
    }

    // 5. Commit to DOM
    this.container.appendChild(this.spacerTop);
    this.container.appendChild(fragment);
    this.container.appendChild(this.spacerBottom);

    if (this.footer) {
      this.container.appendChild(this.footer);
    }

    // 6. Restore Scroll Position
    if (isAtBottom) {
      this.container.scrollTop = this.container.scrollHeight;
    } else {
      this.container.scrollTop = scrollTop;
    }
  }

  /**
   * Helper: Extract properties relevant for cache invalidation.
   */
  _getCacheState(item) {
    const opts = item._renderOptions || {};
    const ctx = item._contextEntities || {};
    return {
      text: item.text,
      role: item.role,
      isLast: opts.isLast,
      ai: ctx.ai,
      user: ctx.user,
      fractal: ctx.fractal,
    };
  }

  /**
   * Helper: Compare two cache states for equality.
   */
  _isCacheMatch(cache, state) {
    return (
      cache.text === state.text && // String ref check (fast)
      cache.role === state.role &&
      cache.isLast === state.isLast &&
      cache.ai === state.ai && // Object ref check (fast)
      cache.user === state.user &&
      cache.fractal === state.fractal
    );
  }

  _onResize(entries) {
    let changed = false;
    for (const entry of entries) {
      const id = entry.target.dataset.virtualId;
      if (id) {
        const h = entry.target.offsetHeight;
        if (this.heights.get(id) !== h) {
          this.heights.set(id, h);
          changed = true;
        }
      }
    }

    if (changed) {
      // Debounce render
      if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => {
        this.render();
      }, 50);
    }
  }

  setFooter(element) {
    this.footer = element;
    this.render();
  }

  _updateSpacerHeightsOnly() {
    if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
    this._resizeTimeout = setTimeout(() => {
      this.render();
    }, 100);
  }
}
