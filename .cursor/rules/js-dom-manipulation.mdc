---
description: Modern DOM APIs and manipulation patterns for vanilla JavaScript, including element selection, event handling, and modern DOM methods.
globs: **/*.js
alwaysApply: false
---

# Modern DOM Manipulation

## Element Selection

```javascript
// Modern element selection
const element = document.querySelector('.my-class');
const elements = document.querySelectorAll('.my-class');

// Multiple selectors
const element = document.querySelector('.class1, .class2');

// Context-based selection
const container = document.querySelector('.container');
const child = container.querySelector('.child');

// ID selection (prefer querySelector over getElementById)
const element = document.querySelector('#my-id');
```

## Event Handling

```javascript
// Modern event handling
element.addEventListener('click', (event) => {
  console.log('Clicked!', event.target);
});

// Event delegation
document.addEventListener('click', (event) => {
  if (event.target.matches('.button')) {
    handleButtonClick(event);
  }
});

// Multiple event types
const events = ['click', 'touchstart', 'keydown'];
events.forEach(eventType => {
  element.addEventListener(eventType, handleEvent);
});

// Event removal
const handler = (event) => console.log('Handled');
element.addEventListener('click', handler);
element.removeEventListener('click', handler);

// One-time events
element.addEventListener('click', handler, { once: true });

// Event options
element.addEventListener('click', handler, {
  capture: true,    // Event capture phase
  passive: true,    // Performance optimization
  once: true        // Auto-remove after first trigger
});
```

## DOM Manipulation

```javascript
// Creating elements
const newElement = document.createElement('div');
newElement.textContent = 'Hello World';
newElement.classList.add('new-class');

// Modern insertion methods
parentElement.append(newElement);    // Append at end
parentElement.prepend(newElement);   // Insert at beginning
parentElement.before(newElement);    // Insert before
parentElement.after(newElement);     // Insert after

// Modern removal
element.remove(); // Remove element

// Cloning elements
const clone = element.cloneNode(true); // Deep clone
const shallowClone = element.cloneNode(false); // Shallow clone
```

## Class and Attribute Management

```javascript
// Class manipulation
element.classList.add('new-class');
element.classList.remove('old-class');
element.classList.toggle('toggle-class');
element.classList.contains('check-class');

// Multiple classes
element.classList.add('class1', 'class2', 'class3');

// Attribute handling
element.setAttribute('data-id', '123');
const id = element.getAttribute('data-id');
element.hasAttribute('data-id');
element.removeAttribute('data-id');

// Dataset API (for data-* attributes)
element.dataset.userId = '123';
const userId = element.dataset.userId;
element.dataset.userName = 'John'; // Creates data-user-name attribute
```

## Content Manipulation

```javascript
// Text content
element.textContent = 'New text content';
const text = element.textContent;

// HTML content
element.innerHTML = '<span>HTML content</span>';
const html = element.innerHTML;

// Insert adjacent HTML
element.insertAdjacentHTML('beforebegin', '<div>Before</div>');
element.insertAdjacentHTML('afterbegin', '<div>Inside start</div>');
element.insertAdjacentHTML('beforeend', '<div>Inside end</div>');
element.insertAdjacentHTML('afterend', '<div>After</div>');
```

## Style Manipulation

```javascript
// Direct style manipulation
element.style.backgroundColor = 'red';
element.style.setProperty('--custom-property', 'value');

// Computed styles
const computedStyle = window.getComputedStyle(element);
const backgroundColor = computedStyle.backgroundColor;

// CSS classes for styling
element.classList.add('highlight');
element.classList.remove('hidden');
```

## Form Elements

```javascript
// Form element access
const form = document.querySelector('form');
const input = form.querySelector('input[name="username"]');

// Input values
input.value = 'new value';
const value = input.value;

// Form submission
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  // Process form data
});

// Form validation
const isValid = form.checkValidity();
const validationMessage = input.validationMessage;
```

## Performance Optimization

```javascript
// Document fragments for batch DOM operations
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const div = document.createElement('div');
  div.textContent = `Item ${i}`;
  fragment.appendChild(div);
}
document.body.appendChild(fragment);

// Debounced event handlers
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

const debouncedHandler = debounce((event) => {
  // Handle scroll/resize events
}, 100);

window.addEventListener('scroll', debouncedHandler);
```

## Intersection Observer

```javascript
// Lazy loading with Intersection Observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Load content or trigger animation
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '50px'
});

// Observe elements
document.querySelectorAll('.lazy-load').forEach(el => {
  observer.observe(el);
});
```

## Resize Observer

```javascript
// Monitor element size changes
const resizeObserver = new ResizeObserver(entries => {
  entries.forEach(entry => {
    console.log('Element resized:', entry.contentRect);
    // Handle resize logic
  });
});

resizeObserver.observe(element);
```

## When to Use Vanilla DOM vs Libraries

### **Use Vanilla DOM when:**

- Performance is critical
- You need modern browser APIs
- Learning/understanding DOM fundamentals
- Simple DOM operations
- Modern browser support is guaranteed
- Bundle size is a concern

### **Use DOM Libraries (like Cash DOM) when:**

- Quick DOM manipulation in Perchance projects
- jQuery-like syntax preference
- Cross-browser compatibility needed
- Complex DOM operations
- Team prefers library syntax
- Legacy browser support required

---

## References

- [Cash DOM Usage](./js-cash-dom-usage.mdc) - jQuery-like DOM manipulation
- [Modern JavaScript Features](./js-modern-features.mdc) - ES2023+ features
- [JavaScript Development](./js-development.mdc) - Comprehensive JavaScript guide
