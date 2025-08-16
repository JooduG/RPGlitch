---
description: Modern browser APIs including Fetch API, Intersection Observer, Resize Observer, and other contemporary web APIs for enhanced functionality.
globs: **/*.js
alwaysApply: false
---

# Modern Browser APIs

## Fetch API

### **Basic Usage**

```javascript
// Simple GET request
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// POST request with JSON data
async function postData(url, data) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error posting data:', error);
    throw error;
  }
}
```

### **Advanced Fetch Patterns**

```javascript
// Fetch with timeout
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Fetch with retry logic
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}

// Fetch utility with default options
const fetchApi = {
  async get(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options
    };
    
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  async post(url, data, options = {}) {
    const defaultOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      ...options
    };
    
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  async put(url, data, options = {}) {
    const defaultOptions = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      ...options
    };
    
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  async delete(url, options = {}) {
    const defaultOptions = {
      method: 'DELETE',
      ...options
    };
    
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
};
```

### **Form Data and File Upload**

```javascript
// Form data submission
async function submitForm(formElement) {
  const formData = new FormData(formElement);
  
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
}

// File upload
async function uploadFile(file, url) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });
  
  return response.json();
}

// Multiple file upload with progress
async function uploadFiles(files, url, onProgress) {
  const formData = new FormData();
  
  Array.from(files).forEach((file, index) => {
    formData.append(`file${index}`, file);
  });
  
  const xhr = new XMLHttpRequest();
  
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });
    
    xhr.open('POST', url);
    xhr.send(formData);
  });
}
```

## Intersection Observer

### **Basic Usage**

```javascript
// Simple intersection observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    } else {
      entry.target.classList.remove('visible');
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '50px'
});

// Observe elements
document.querySelectorAll('.observe').forEach(el => {
  observer.observe(el);
});
```

### **Advanced Patterns**

```javascript
// Lazy loading images
const lazyImageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.remove('lazy');
      lazyImageObserver.unobserve(img);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '100px'
});

document.querySelectorAll('img[data-src]').forEach(img => {
  lazyImageObserver.observe(img);
});

// Infinite scroll
const infiniteScrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadMoreContent();
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '200px'
});

// Observe the last item in the list
const observeLastItem = () => {
  const items = document.querySelectorAll('.list-item');
  if (items.length > 0) {
    infiniteScrollObserver.observe(items[items.length - 1]);
  }
};

// Animation on scroll
const animationObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animation = 'fadeIn 0.6s ease-in-out';
    }
  });
}, {
  threshold: 0.2,
  rootMargin: '50px'
});

document.querySelectorAll('.animate-on-scroll').forEach(el => {
  animationObserver.observe(el);
});
```

## Resize Observer

### **Basic Usage**

```javascript
// Monitor element size changes
const resizeObserver = new ResizeObserver(entries => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;
    console.log(`Element resized to ${width}x${height}`);
    
    // Handle resize logic
    updateLayout(width, height);
  });
});

// Observe specific elements
const element = document.querySelector('.resizable');
resizeObserver.observe(element);
```

### **Advanced Patterns**

```javascript
// Responsive layout updates
const responsiveObserver = new ResizeObserver(entries => {
  entries.forEach(entry => {
    const { width } = entry.contentRect;
    const element = entry.target;
    
    // Update layout based on width
    if (width < 768) {
      element.classList.add('mobile-layout');
      element.classList.remove('desktop-layout');
    } else {
      element.classList.add('desktop-layout');
      element.classList.remove('mobile-layout');
    }
  });
});

// Observe container elements
document.querySelectorAll('.responsive-container').forEach(el => {
  responsiveObserver.observe(el);
});

// Debounced resize handling
const debouncedResizeObserver = new ResizeObserver((entries) => {
  // Debounce resize events
  clearTimeout(window.resizeTimeout);
  window.resizeTimeout = setTimeout(() => {
    entries.forEach(entry => {
      handleResize(entry);
    });
  }, 100);
});
```

## Service Worker API

### **Basic Service Worker**

```javascript
// Service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker registered:', registration);
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}

// Service worker file (sw.js)
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
```

### **Advanced Caching Strategies**

```javascript
// Cache-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open('v1').then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
  );
});

// Network-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseToCache = response.clone();
        caches.open('v1').then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
```

## Web Storage APIs

### **Local Storage**

```javascript
// Local storage utility
const localStorage = {
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('LocalStorage set error:', error);
      return false;
    }
  },
  
  get(key, defaultValue = null) {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return defaultValue;
    }
  },
  
  remove(key) {
    window.localStorage.removeItem(key);
  },
  
  clear() {
    window.localStorage.clear();
  },
  
  // Check available space
  getAvailableSpace() {
    const testKey = '__storage_test__';
    const testValue = 'x'.repeat(1024 * 1024); // 1MB
    let available = 0;
    
    try {
      window.localStorage.setItem(testKey, testValue);
      available += testValue.length;
      
      while (true) {
        window.localStorage.setItem(testKey, testValue + testValue);
        available += testValue.length;
      }
    } catch (e) {
      window.localStorage.removeItem(testKey);
    }
    
    return available;
  }
};
```

### **Session Storage**

```javascript
// Session storage utility
const sessionStorage = {
  set(key, value) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('SessionStorage set error:', error);
      return false;
    }
  },
  
  get(key, defaultValue = null) {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('SessionStorage get error:', error);
      return defaultValue;
    }
  },
  
  remove(key) {
    window.sessionStorage.removeItem(key);
  },
  
  clear() {
    window.sessionStorage.clear();
  }
};
```

## Web Workers

### **Basic Web Worker**

```javascript
// Main thread
const worker = new Worker('worker.js');

worker.postMessage({
  type: 'calculate',
  data: { a: 10, b: 20 }
});

worker.onmessage = (event) => {
  console.log('Result from worker:', event.data);
};

worker.onerror = (error) => {
  console.error('Worker error:', error);
};

// Worker file (worker.js)
self.onmessage = (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'calculate':
      const result = data.a + data.b;
      self.postMessage({ type: 'result', data: result });
      break;
      
    default:
      self.postMessage({ type: 'error', data: 'Unknown message type' });
  }
};
```

### **Shared Web Worker**

```javascript
// Shared worker for cross-tab communication
const sharedWorker = new SharedWorker('shared-worker.js');

sharedWorker.port.onmessage = (event) => {
  console.log('Message from shared worker:', event.data);
};

sharedWorker.port.postMessage({
  type: 'register',
  data: { tabId: Date.now() }
});

// Shared worker file (shared-worker.js)
const connections = [];

self.onconnect = (event) => {
  const port = event.ports[0];
  connections.push(port);
  
  port.onmessage = (event) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'register':
        port.postMessage({ type: 'registered', data: { tabId: data.tabId } });
        break;
        
      case 'broadcast':
        // Broadcast to all connected tabs
        connections.forEach(conn => {
          if (conn !== port) {
            conn.postMessage({ type: 'broadcast', data });
          }
        });
        break;
    }
  };
};
```

---

## References

- [Modern JavaScript Features](./js-modern-features.mdc) - ES2023+ features
- [DOM Manipulation](./js-dom-manipulation.mdc) - Modern DOM APIs
- [Storage Strategy](./js-storage-strategy.mdc) - Client-side storage approaches
