---
description: Cash DOM provides a tiny, fast jQuery-like API for DOM selection and manipulation. Use for concise, readable JS in Perchance projects.
globs: **/*.js
alwaysApply: false
---

# Cash DOM Usage

## Objective

Cash DOM provides a tiny, fast jQuery-like API for DOM selection and manipulation. Use for concise, readable JS in Perchance projects.

## When to Use Cash DOM vs Vanilla DOM

### **Use Cash DOM when:**

- Quick DOM manipulation in Perchance projects
- jQuery-like syntax preference
- Cross-browser compatibility needed
- Complex DOM operations with chaining
- Team prefers library syntax
- Legacy browser support required
- Rapid prototyping and development

### **Use Vanilla DOM when:**

- Performance is critical
- You need modern browser APIs
- Learning/understanding DOM fundamentals
- Simple DOM operations
- Modern browser support is guaranteed
- Bundle size is a concern
- Direct control over DOM operations

## Usage Guidelines

### **How to include:**

    The build process automatically includes Cash DOM. See `build/README.md` for the current version.

### **When to use:** For selecting, updating, or animating DOM elements in JS

### **Example:**

```js
$('#chat-input').val('');
$('#chat-log').append('<chat-message text="Hello!"></chat-message>');
```

### **Works well with:** Hyperscript for event handling, Pico.css for UI

## Common Patterns

### **Element Selection**

```javascript
// Single element
const element = $('#my-element');

// Multiple elements
const elements = $('.my-class');

// Complex selectors
const items = $('ul li:first-child');
```

### **DOM Manipulation**

```javascript
// Content manipulation
$('#element').html('<span>New content</span>');
$('#element').text('Plain text content');

// Attribute manipulation
$('#element').attr('data-id', '123');
const id = $('#element').attr('data-id');

// Class manipulation
$('#element').addClass('highlight');
$('#element').removeClass('old-class');
$('#element').toggleClass('active');
```

### **Event Handling**

```javascript
// Event binding
$('#button').on('click', function() {
  console.log('Button clicked!');
});

// Event delegation
$('#container').on('click', '.item', function() {
  console.log('Item clicked!');
});

// Multiple events
$('#element').on('click touchstart', function() {
  console.log('Element interacted!');
});
```

### **Chaining**

```javascript
// Method chaining
$('#element')
  .addClass('active')
  .attr('data-state', 'loading')
  .html('Loading...')
  .show();
```

## Performance Considerations

### **Efficient Selection**

```javascript
// Cache selectors for repeated use
const $element = $('#my-element');
$element.addClass('active');
$element.removeClass('inactive');

// Use specific selectors
$('div.my-class'); // More specific than $('.my-class')
```

### **Batch Operations**

```javascript
// Batch DOM operations
const $elements = $('.item');
$elements.each(function(index, element) {
  $(element).addClass('processed');
});
```

## Integration with Modern JavaScript

### **ES6+ Features**

```javascript
// Template literals
const message = 'Hello World';
$('#element').html(`<span>${message}</span>`);

// Arrow functions
$('#button').on('click', () => {
  console.log('Arrow function handler');
});

// Destructuring
const { id, text } = elementData;
$(`#${id}`).text(text);
```

### **Async/Await**

```javascript
// Async operations
$('#button').on('click', async () => {
  const data = await fetchData();
  $('#result').html(data.content);
});
```

---

## References

- [Cash DOM Docs](https://github.com/fabiospampinato/cash)
- [DOM Manipulation](../.cursor/rules/js-dom-manipulation.md) - Vanilla DOM APIs
- [Modern JavaScript Features](../.cursor/rules/js-modern-features.md) - ES2023+ features
- [JavaScript Development](../.cursor/rules/js-development.md) - Comprehensive JavaScript guide
