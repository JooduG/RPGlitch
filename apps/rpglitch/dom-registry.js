/**
 * DOM Registry - Centralized DOM element management and validation
 * Provides systematic element tracking and validation to prevent UI spawning issues
 */

class DOMRegistry {
  constructor() {
    this.elements = new Map();
    this.requiredElements = new Set();
    this.optionalElements = new Set();
    this.validationErrors = [];
  }

  /**
   * Register a DOM element with validation
   * @param {string} id - Unique identifier for the element
   * @param {string} selector - CSS selector to find the element
   * @param {boolean} required - Whether the element is required for app functionality
   * @param {string} context - Context where this element is used
   * @returns {Element|null} The found element or null if not found
   */
  register(id, selector, required = true, context = 'Unknown') {
    if (required) {
      this.requiredElements.add(id);
    } else {
      this.optionalElements.add(id);
    }

    const element = document.querySelector(selector);
    this.elements.set(id, element);

    if (required && !element) {
      this.validationErrors.push({
        id,
        selector,
        context,
        type: 'missing_required'
      });
    }

    return element;
  }

  /**
   * Register element by ID (common use case)
   * @param {string} id - Element ID
   * @param {boolean} required - Whether the element is required
   * @param {string} context - Context where this element is used
   * @returns {Element|null} The found element or null if not found
   */
  registerById(id, required = true, context = 'Unknown') {
    return this.register(id, `#${id}`, required, context);
  }

  /**
   * Get a registered element
   * @param {string} id - Element identifier
   * @returns {Element|null} The element or null if not found
   */
  get(id) {
    return this.elements.get(id) || null;
  }

  /**
   * Validate all registered elements
   * @returns {Object} Validation results
   */
  validate() {
    const missing = [];
    const found = [];

    for (const id of this.requiredElements) {
      const element = this.elements.get(id);
      if (!element) {
        missing.push(id);
      } else {
        found.push(id);
      }
    }

    const optional = [];
    for (const id of this.optionalElements) {
      const element = this.elements.get(id);
      if (element) {
        optional.push(id);
      }
    }

    return {
      missing,
      found,
      optional,
      totalRequired: this.requiredElements.size,
      totalOptional: this.optionalElements.size,
      isValid: missing.length === 0
    };
  }

  /**
   * Get validation errors
   * @returns {Array} Array of validation error objects
   */
  getValidationErrors() {
    return [...this.validationErrors];
  }

  /**
   * Clear validation errors
   */
  clearValidationErrors() {
    this.validationErrors = [];
  }

  /**
   * Log validation results to console
   */
  logValidationResults() {
    const results = this.validate();
    
    if (results.isValid) {
      console.log('✅ DOM Registry: All required elements found', {
        required: results.found.length,
        optional: results.optional.length
      });
    } else {
      console.error('❌ DOM Registry: Missing required elements', {
        missing: results.missing,
        found: results.found.length,
        total: results.totalRequired
      });
    }
  }

  /**
   * Get all registered elements as an object
   * @returns {Object} Object with element IDs as keys
   */
  getAll() {
    const result = {};
    for (const [id, element] of this.elements) {
      result[id] = element;
    }
    return result;
  }

  /**
   * Check if an element exists
   * @param {string} id - Element identifier
   * @returns {boolean} True if element exists
   */
  exists(id) {
    return this.elements.has(id) && this.elements.get(id) !== null;
  }
}

// Create global instance
window.DOMRegistry = new DOMRegistry();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMRegistry;
}