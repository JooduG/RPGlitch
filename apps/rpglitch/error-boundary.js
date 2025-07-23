/**
 * Error Boundary - Comprehensive error handling and graceful degradation
 * Provides systematic error catching, logging, and recovery mechanisms
 */

class ErrorBoundary {
  constructor() {
    this.errorCount = 0;
    this.maxErrors = 10;
    this.errorHistory = [];
    this.recoveryStrategies = new Map();
  }

  /**
   * Wrap a function with error boundary
   * @param {Function} fn - Function to wrap
   * @param {string} context - Context for error reporting
   * @param {Object} options - Error handling options
   * @returns {Function} Wrapped function
   */
  static wrap(fn, context = 'Unknown', options = {}) {
    const {
      fallback = null,
      retryCount = 0,
      silent = false,
      critical = false
    } = options;

    return function(...args) {
      try {
        return fn.apply(this, args);
      } catch (error) {
        ErrorBoundary.handleError(error, context, {
          fallback,
          retryCount,
          silent,
          critical,
          args
        });
        return fallback;
      }
    };
  }

  /**
   * Handle an error with comprehensive logging and recovery
   * @param {Error} error - The error that occurred
   * @param {string} context - Context where the error occurred
   * @param {Object} options - Error handling options
   */
  static handleError(error, context, options = {}) {
    const {
      fallback = null,
      silent = false,
      critical = false,
      args = []
    } = options;

    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      critical,
      args: args.length > 0 ? args : undefined
    };

    // Log error details
    if (!silent) {
      console.error(`[${context}] Error:`, errorInfo);
      
      if (critical) {
        console.error('🚨 CRITICAL ERROR - Application may be unstable');
      }
    }

    // Track error for analytics
    ErrorBoundary.trackError(errorInfo);

    // Attempt recovery if possible
    if (fallback && typeof fallback === 'function') {
      try {
        fallback(error, context);
      } catch (fallbackError) {
        console.error(`[${context}] Fallback also failed:`, fallbackError);
      }
    }

    // Show user-friendly error message for critical errors
    if (critical && !silent) {
      ErrorBoundary.showUserError(context, error.message);
    }
  }

  /**
   * Track error for analytics and monitoring
   * @param {Object} errorInfo - Error information
   */
  static trackError(errorInfo) {
    if (!window.ErrorBoundary) {
      window.ErrorBoundary = new ErrorBoundary();
    }

    const boundary = window.ErrorBoundary;
    boundary.errorCount++;
    boundary.errorHistory.push(errorInfo);

    // Keep only recent errors
    if (boundary.errorHistory.length > 50) {
      boundary.errorHistory = boundary.errorHistory.slice(-50);
    }

    // Check if too many errors have occurred
    if (boundary.errorCount > boundary.maxErrors) {
      console.warn('⚠️ Too many errors detected - consider application restart');
    }
  }

  /**
   * Show user-friendly error message
   * @param {string} context - Error context
   * @param {string} message - Error message
   */
  static showUserError(context, message) {
    const errorContainer = document.getElementById('error-container') || 
                          document.createElement('div');
    
    if (!document.getElementById('error-container')) {
      errorContainer.id = 'error-container';
      errorContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 10000;
        max-width: 300px;
        font-family: Arial, sans-serif;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(errorContainer);
    }

    errorContainer.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">⚠️ Error in ${context}</div>
      <div style="font-size: 0.9em;">${message}</div>
      <button onclick="this.parentElement.remove()" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 5px 10px;
        margin-top: 10px;
        border-radius: 3px;
        cursor: pointer;
      ">Dismiss</button>
    `;

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorContainer.parentElement) {
        errorContainer.remove();
      }
    }, 10000);
  }

  /**
   * Register a recovery strategy for a specific context
   * @param {string} context - Context to register strategy for
   * @param {Function} strategy - Recovery function
   */
  static registerRecoveryStrategy(context, strategy) {
    if (!window.ErrorBoundary) {
      window.ErrorBoundary = new ErrorBoundary();
    }
    window.ErrorBoundary.recoveryStrategies.set(context, strategy);
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  static getErrorStats() {
    if (!window.ErrorBoundary) {
      return { count: 0, history: [] };
    }

    const boundary = window.ErrorBoundary;
    return {
      count: boundary.errorCount,
      history: boundary.errorHistory,
      maxErrors: boundary.maxErrors
    };
  }

  /**
   * Clear error history
   */
  static clearErrorHistory() {
    if (window.ErrorBoundary) {
      window.ErrorBoundary.errorCount = 0;
      window.ErrorBoundary.errorHistory = [];
    }
  }

  /**
   * Wrap multiple functions with error boundaries
   * @param {Object} functions - Object with function names as keys
   * @param {string} context - Base context for all functions
   * @returns {Object} Object with wrapped functions
   */
  static wrapObject(functions, context) {
    const wrapped = {};
    for (const [name, fn] of Object.entries(functions)) {
      if (typeof fn === 'function') {
        wrapped[name] = ErrorBoundary.wrap(fn, `${context}.${name}`);
      } else {
        wrapped[name] = fn;
      }
    }
    return wrapped;
  }
}

// Create global instance
window.ErrorBoundary = new ErrorBoundary();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorBoundary;
}