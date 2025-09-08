# JavaScript Guide: DOM Manipulation

This guide outlines the rules and best practices for interacting with the Document Object Model (DOM) in this project. The primary goal is to ensure consistency, performance, and maintainability.

**Core Principle:** All direct DOM manipulation must be performed using the `cash` library. It provides a lightweight, jQuery-like syntax that is consistent and powerful.

---

## 1. Using `cash` for DOM Operations

`cash` is included locally and is available globally as `$`. It should be used for all DOM tasks.

### Selecting Elements

- **By ID:** `$('#some-id')`
- **By Class:** `$('.some-class')`
- **By Attribute:** `$('input[name="username"]')`
- **Complex Selectors:** `$('#main-app-container .profile-card')`

### Manipulating Classes & Attributes

- **Add/Remove Class:** `element.addClass('new-class')`, `element.removeClass('old-class')`
- **Toggle Class:** `element.toggleClass('active')`
- **Get/Set Attribute:** `element.attr('data-id')`, `element.attr('data-status', 'updated')`

### Creating & Inserting Elements

Always create elements using `cash` and append them. Avoid using `innerHTML` to prevent potential security vulnerabilities and poor performance.

```javascript
// Correct Way
const newProfile = $('<article class="profile-card"></article>');
newProfile.append('<h3>New Character</h3>');
$('#profile-list').append(newProfile);

// Incorrect Way (Avoid This)
// document.getElementById('profile-list').innerHTML += '<article>...</article>';
```

### Event Handling

Use the `.on()` method to attach event listeners.

```javascript
$('#create-btn').on('click', () => {
  console.log('Button was clicked!');
  // Handle event
});
```

---

## 2. DOM Performance Best Practices

- **Batch DOM Updates:** When performing multiple manipulations, "detach" an element from the DOM, perform the changes, and then "reattach" it. This causes only one reflow/repaint instead of many. `cash` does not have a `detach` method like jQuery, so the best practice is to build the element tree in memory before appending it to the live DOM.

- **Event Delegation:** For lists of items, attach a single event listener to the parent container instead of one for each item. This is more memory-efficient.

```javascript
// Good: Event delegation
$('#profile-list').on('click', '.delete-btn', function() {
  // 'this' refers to the .delete-btn that was clicked
  $(this).closest('.profile-card').remove();
});
```

---

## 3. Syntax Comparison: `cash` vs. Vanilla JS vs. jQuery

This table helps translate common operations between `cash`, standard JavaScript, and jQuery.

| Task | `cash` Syntax | Vanilla JavaScript Syntax | jQuery Syntax |
| :--- | :--- | :--- | :--- |
| **Select by ID** | `$('#my-id')` | `document.getElementById('my-id')` | `$('#my-id')` |
| **Select by Class** | `$('.my-class')` | `document.querySelectorAll('.my-class')` | `$('.my-class')` |
| **Add Class** | `el.addClass('foo')` | `el.classList.add('foo')` | `el.addClass('foo')` |
| **Set Attribute** | `el.attr('foo', 'bar')` | `el.setAttribute('foo', 'bar')` | `el.attr('foo', 'bar')` |
| **Add Listener** | `el.on('click', fn)` | `el.addEventListener('click', fn)` | `el.on('click', fn)` |
| **Create Element**| `$('<div>')` | `document.createElement('div')` | `$('<div>')` |
