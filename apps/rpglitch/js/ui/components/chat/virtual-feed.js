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

    this.contentWrapper = document.createElement("div");
    this.contentWrapper.className = "virtual-content-wrapper";

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
    this.container.appendChild(this.spacerTop);
    this.container.appendChild(this.contentWrapper);
    this.container.appendChild(this.spacerBottom);
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

    // ⚡ BOLT OPTIMIZATION: Prevent DOM Trashing
    // Encapsulate state for maintainable comparison
    const renderState = {
      start: startIndex,
      end: endIndex,
      top: topHeight,
      bottom: bottomHeight,
      items: this.items,
    };

    if (
      this._prev &&
      Object.keys(renderState).every(
        (key) => this._prev[key] === renderState[key],
      )
    ) {
      if (isAtBottom) {
        this.container.scrollTop = this.container.scrollHeight;
      }
      return;
    }

    this._prev = renderState;

    // ⚡ BOLT OPTIMIZATION: DOM Recycling
    // Instead of rebuilding the entire container, we only update the spacers
    // and the specific items in the content wrapper.
    this.spacerTop.style.height = `${topHeight}px`;
    this.spacerBottom.style.height = `${bottomHeight}px`;

    // 4. Render Items
    this.resizeObserver.disconnect();

    const fragment = document.createDocumentFragment();

    for (let i = startIndex; i <= endIndex; i++) {
      const item = this.items[i];
      // Pass fragment as container
      this.renderCallback(fragment, item, i);
    }

    // Tag and Observe
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
    this.contentWrapper.innerHTML = "";
    this.contentWrapper.appendChild(fragment);

    // Ensure footer is at the end (if it changed)
    if (this.footer && this.container.lastElementChild !== this.footer) {
      this.container.appendChild(this.footer);
    } else if (!this.footer) {
      // Cleanup footer if removed
      const existing = this.container.querySelector("#active-typing-indicator");
      // Note: The footer logic in setFooter might pass a specific element.
      // If footer is null but we have extra children?
      // Best to ensure container only has: spacerTop, wrapper, spacerBottom, [footer]
      while (this.container.children.length > 3) {
        if (this.container.lastElementChild !== this.spacerBottom) {
           this.container.lastElementChild.remove();
        } else {
           break;
        }
      }
    }

    // 6. Restore Scroll Position
    if (isAtBottom) {
      // Stick to bottom
      this.container.scrollTop = this.container.scrollHeight;
    } else {
      // Restore previous position
      this.container.scrollTop = scrollTop;
    }
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
    // If element is null, we should remove existing footer immediately?
    // render() handles it, but let's be safe.
    if (!element) {
       // Loop to find and remove any footer (anything after spacerBottom)
       let next = this.spacerBottom.nextSibling;
       while(next) {
         let toRemove = next;
         next = next.nextSibling;
         toRemove.remove();
       }
    }
    this.render();
  }

  _updateSpacerHeightsOnly() {
    if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
    this._resizeTimeout = setTimeout(() => {
      this.render();
    }, 100);
  }
}
