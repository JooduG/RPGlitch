# 🎨 CSS Cheatsheet

## 🏷️ Selector Types

### Basic Selectors
```css
/* Element Selector */
button { color: blue; }

/* Class Selector */
.button { padding: 10px; }

/* ID Selector */
#submit-button { background: green; }

/* Universal Selector */
* { box-sizing: border-box; }

/* Attribute Selector */
[disabled] { opacity: 0.5; }
```

### Combinators
```css
/* Descendant Selector */
.parent .child { color: red; }

/* Direct Child Selector */
.parent > .child { margin: 10px; }

/* Adjacent Sibling */
.element + .next-element { font-weight: bold; }

/* General Sibling */
.element ~ .sibling { color: gray; }
```

## 🌈 Pseudo-Classes & Pseudo-Elements

### Interaction States
```css
/* Hover, Active, Focus */
button:hover { background: lightgray; }
button:active { transform: scale(0.95); }
button:focus { outline: 2px solid blue; }

/* Input States */
input:disabled { background: #f0f0f0; }
input:valid { border-color: green; }
input:invalid { border-color: red; }
```

### Structural Pseudo-Classes
```css
/* Child Selection */
li:first-child { font-weight: bold; }
li:last-child { color: gray; }
li:nth-child(2n) { background: #f0f0f0; }

/* Element Type */
p:first-of-type { font-size: 1.2em; }
```

### Pseudo-Elements
```css
/* Content Manipulation */
.quote::before { content: '"'; }
.quote::after { content: '"'; }

/* Styling Specific Parts */
::selection { background: yellow; }
```

## 📦 Box Model & Layout

### Basic Box Model
```css
.box {
  width: 200px;
  height: 100px;
  padding: 10px;
  margin: 15px;
  border: 1px solid black;
  box-sizing: border-box;
}
```

### Flexbox
```css
.container {
  display: flex;
  flex-direction: row; /* row | column | row-reverse | column-reverse */
  justify-content: center; /* Main axis alignment */
  align-items: center; /* Cross-axis alignment */
  gap: 10px; /* Space between flex items */
}

.item {
  flex-grow: 1; /* Grow proportionally */
  flex-shrink: 0; /* Prevent shrinking */
  flex-basis: auto; /* Initial main size */
}
```

### Grid
```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 10px;
  grid-auto-rows: minmax(100px, auto);
}
```

## 🌟 Variables & Custom Properties

### CSS Variables
```css
:root {
  --primary-color: #3498db;
  --font-size-normal: 16px;
  --spacing-small: 10px;
}

.element {
  color: var(--primary-color);
  font-size: var(--font-size-normal);
  margin: var(--spacing-small);
}
```

## 📱 Responsive Design

### Media Queries
```css
/* Mobile First Approach */
.element {
  width: 100%; /* Default for mobile */
}

@media (min-width: 768px) {
  .element {
    width: 50%; /* Tablet */
  }
}

@media (min-width: 1024px) {
  .element {
    width: 33%; /* Desktop */
  }
}
```

## 🎬 Animations & Transitions

### Keyframe Animations
```css
@keyframes slide-in {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(0); }
}

.animated-element {
  animation: 
    slide-in 0.5s ease-out,
    fade-in 1s linear;
  animation-fill-mode: forwards;
}
```

### Transitions
```css
.button {
  background-color: blue;
  transition: 
    background-color 0.3s ease,
    transform 0.2s linear;
}

.button:hover {
  background-color: darkblue;
  transform: scale(1.1);
}
```

## 🌈 Color & Typography

### Color Modes
```css
.element {
  /* Color Formats */
  color: red;
  color: #ff0000;
  color: rgb(255, 0, 0);
  color: rgba(255, 0, 0, 0.5);
  color: hsl(0, 100%, 50%);
}
```

### Typography
```css
body {
  font-family: 'Arial', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.5px;
  text-align: center;
}
```

## 💡 Best Practices

1. Use CSS Reset or Normalize
2. Prefer Flexbox/Grid over Float
3. Mobile-First Responsive Design
4. Use CSS Variables for Theming
5. Minimize Specificity
6. Use Shorthand Properties
7. Organize CSS Logically

## 🛠️ Debugging Tools
- Browser Developer Tools
- CSS Linters
- Specificity Calculators 