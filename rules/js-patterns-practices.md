---
description: JavaScript patterns, performance optimization techniques, code organization, and debugging best practices for modern web development.
globs: **/*.js
alwaysApply: false
---

# JavaScript Patterns and Best Practices

## Performance Optimization

### **Debouncing**

```javascript
// Debouncing for expensive operations
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Usage examples
const debouncedSearch = debounce((query) => {
  // Expensive search operation
  performSearch(query);
}, 300);

const debouncedResize = debounce(() => {
  // Handle window resize
  updateLayout();
}, 100);
```

### **Throttling**

```javascript
// Throttling for rate limiting
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Usage examples
const throttledScroll = throttle(() => {
  // Handle scroll events
  updateScrollPosition();
}, 16); // ~60fps

const throttledInput = throttle((value) => {
  // Handle input changes
  validateInput(value);
}, 100);
```

### **Memoization**

```javascript
// Memoization for expensive calculations
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

// Usage examples
const expensiveCalculation = memoize((a, b) => {
  // Expensive computation
  return a * b + Math.pow(a, 2) + Math.pow(b, 2);
});

const fibonacci = memoize((n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});
```

### **Lazy Loading**

```javascript
// Lazy loading with Intersection Observer
const lazyLoad = (selector, callback) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  });
  
  document.querySelectorAll(selector).forEach(el => {
    observer.observe(el);
  });
};

// Usage
lazyLoad('.lazy-image', (img) => {
  img.src = img.dataset.src;
  img.classList.remove('lazy');
});

// Dynamic imports for code splitting
const loadModule = async (moduleName) => {
  try {
    const module = await import(`./modules/${moduleName}.js`);
    return module.default;
  } catch (error) {
    console.error(`Failed to load module: ${moduleName}`, error);
    return null;
  }
};
```

## Code Organization

### **Utility Functions**

```javascript
// Utility functions for common operations
const utils = {
  // Type checking
  isString: (value) => typeof value === 'string',
  isNumber: (value) => typeof value === 'number' && !isNaN(value),
  isArray: (value) => Array.isArray(value),
  isObject: (value) => typeof value === 'object' && value !== null,
  isFunction: (value) => typeof value === 'function',
  
  // DOM utilities
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),
  
  // Event utilities
  on: (element, event, handler) => element.addEventListener(event, handler),
  off: (element, event, handler) => element.removeEventListener(event, handler),
  
  // Storage utilities
  storage: {
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    get: (key) => {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch {
        return null;
      }
    }
  },
  
  // String utilities
  capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),
  slugify: (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  
  // Array utilities
  unique: (arr) => [...new Set(arr)],
  chunk: (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
};
```

### **Configuration Management**

```javascript
// Configuration object
const config = {
  api: {
    baseUrl: 'https://api.example.com',
    timeout: 5000,
    retries: 3
  },
  features: {
    darkMode: true,
    animations: true,
    offline: false
  },
  storage: {
    prefix: 'app_',
    ttl: 3600000 // 1 hour
  }
};

// Environment-based configuration
const env = {
  development: {
    api: { baseUrl: 'http://localhost:3000' },
    debug: true
  },
  production: {
    api: { baseUrl: 'https://api.production.com' },
    debug: false
  }
};

const currentConfig = {
  ...config,
  ...env[process.env.NODE_ENV || 'development']
};
```

### **Feature Detection**

```javascript
// Feature detection for progressive enhancement
const features = {
  supportsIntersectionObserver: 'IntersectionObserver' in window,
  supportsResizeObserver: 'ResizeObserver' in window,
  supportsFetch: 'fetch' in window,
  supportsServiceWorker: 'serviceWorker' in navigator,
  supportsIndexedDB: 'indexedDB' in window,
  supportsLocalStorage: (() => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  })()
};

// Conditional feature usage
if (features.supportsIntersectionObserver) {
  // Use Intersection Observer
  setupLazyLoading();
} else {
  // Fallback to scroll events
  setupScrollBasedLazyLoading();
}
```

## Error Handling

### **Custom Error Classes**

```javascript
// Custom error classes for better error handling
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class NetworkError extends Error {
  constructor(message, status, url) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.url = url;
  }
}

class StorageError extends Error {
  constructor(message, operation) {
    super(message);
    this.name = 'StorageError';
    this.operation = operation;
  }
}
```

### **Error Boundaries**

```javascript
// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  logError(event.error, {
    type: 'global',
    url: window.location.href,
    userAgent: navigator.userAgent
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  logError(event.reason, {
    type: 'promise',
    url: window.location.href
  });
  event.preventDefault();
});

// Error logging utility
const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  console.error('Error occurred:', errorInfo);
  
  // Send to error reporting service
  if (window.errorReportingService) {
    window.errorReportingService.captureException(error, { extra: context });
  }
  
  // Store locally for debugging
  const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
  errors.push(errorInfo);
  localStorage.setItem('app_errors', JSON.stringify(errors.slice(-10))); // Keep last 10
};
```

## Testing and Debugging

### **Modern Debugging**

```javascript
// Modern debugging techniques
console.log('Debug info:', { user, timestamp: Date.now() });
console.table(data);
console.group('Grouped logs');
console.groupEnd();

// Performance measurement
console.time('operation');
// ... operation
console.timeEnd('operation');

// Assertions
console.assert(condition, 'Assertion failed');

// Conditional logging
const DEBUG = true;
const debug = DEBUG ? console.log.bind(console) : () => {};

// Debug utilities
const debugUtils = {
  log: (message, data) => {
    if (DEBUG) {
      console.log(`[DEBUG] ${message}`, data);
    }
  },
  
  time: (label) => {
    if (DEBUG) {
      console.time(label);
    }
  },
  
  timeEnd: (label) => {
    if (DEBUG) {
      console.timeEnd(label);
    }
  },
  
  trace: (message) => {
    if (DEBUG) {
      console.trace(message);
    }
  }
};
```

### **Testing Utilities**

```javascript
// Simple testing utilities
const test = {
  assert: (condition, message) => {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  },
  
  assertEquals: (actual, expected, message) => {
    if (actual !== expected) {
      throw new Error(`Assertion failed: ${message}. Expected ${expected}, got ${actual}`);
    }
  },
  
  assertArrayEquals: (actual, expected, message) => {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      throw new Error(`Assertion failed: ${message}. Both arguments must be arrays`);
    }
    if (actual.length !== expected.length) {
      throw new Error(`Assertion failed: ${message}. Array lengths differ`);
    }
    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) {
        throw new Error(`Assertion failed: ${message}. Arrays differ at index ${i}`);
      }
    }
  }
};

// Usage example
try {
  test.assertEquals(sum(2, 3), 5, 'Basic addition');
  test.assertArrayEquals([1, 2, 3], [1, 2, 3], 'Array comparison');
  console.log('All tests passed!');
} catch (error) {
  console.error('Test failed:', error.message);
}
```

## Code Quality Patterns

### **Clean Code Principles**

```javascript
// Meaningful variable names
const userPreferences = getUserPreferences();
const isUserLoggedIn = checkUserLoginStatus();
const hasValidPermissions = validateUserPermissions();

// Small, focused functions
const calculateTotalPrice = (items) => {
  return items.reduce((total, item) => total + item.price, 0);
};

const applyDiscount = (total, discountPercent) => {
  return total * (1 - discountPercent / 100);
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Single responsibility
const processOrder = (order) => {
  const total = calculateTotalPrice(order.items);
  const discountedTotal = applyDiscount(total, order.discount);
  const formattedTotal = formatCurrency(discountedTotal);
  
  return {
    ...order,
    total: discountedTotal,
    formattedTotal
  };
};
```

### **Consistent Code Style**

```javascript
// Consistent naming conventions
const CONSTANTS = {
  API_BASE_URL: 'https://api.example.com',
  MAX_RETRIES: 3,
  TIMEOUT_MS: 5000
};

// Consistent function declarations
const arrowFunction = () => {
  // Use for simple functions
};

function regularFunction() {
  // Use for more complex functions
}

// Consistent error handling
const safeOperation = async () => {
  try {
    const result = await riskyOperation();
    return { success: true, data: result };
  } catch (error) {
    logError(error);
    return { success: false, error: error.message };
  }
};
```

---

## References

- [Modern JavaScript Features](../.cursor/rules/js-modern-features.mdc) - ES2023+ features
- [DOM Manipulation](../.cursor/rules/js-dom-manipulation.mdc) - Modern DOM APIs
- [Storage Strategy](../.cursor/rules/js-storage-strategy.mdc) - Client-side storage approaches
