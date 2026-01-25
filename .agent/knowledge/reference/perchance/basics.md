# Perchance Basics & Web Integration

## Section 1: The Perchance Engine

The Perchance platform, at its core, is a robust engine for procedural text generation. Its architecture is built upon a simple yet powerful declarative syntax that allows developers to create complex, randomized outputs from structured lists of data.

### The Fundamental Paradigm: Lists and References

A generator's logic is primarily defined in the **Lists Panel** of the editor UI. The central paradigm revolves around creating lists and referencing them to construct randomized text.

#### Lists and Items

A list is created by defining a name, followed by its items on subsequent lines. Each item must be indented with a single tab or two spaces.

```text
animal
  pig
  cow
  zebra
```

#### Referencing Lists

To use a list, its name is enclosed in square brackets (`[]`). When the engine encounters this syntax, it selects a random item from the specified list.

**Example:** `A random animal is the [animal].` might produce "A random animal is the cow."

#### Inline Selection (Shorthand)

For simple, inline random choices without creating a formal list, use curly brackets (`{}`) with items separated by a vertical bar (`|`):

```text
The cow is {very|extremely} large.
```

For single-item lists, use shorthand: `listName = [item]`

#### Naming Conventions

List names must adhere to strict rules:

- ✅ Valid: `animal`, `my_list`, `list123`, `MyList`
- ❌ Invalid: Spaces, hyphens, starting with numbers, reserved keywords (`if`, `for`, `while`, `class`, etc.)

#### Code Comments

Use two forward slashes (`//`) to comment. Any text following `//` on the same line is ignored.

### Controlling Randomness

#### Probability and Weighting

The likelihood of an item being selected can be modified using the caret (`^`) operator followed by a number. Default weight is 1.

```text
condiment
  pepper^2      // Twice as likely
  salt           // Default weight
  chilli flakes^0.5  // Half as likely
```

#### Selection Methods

- **`selectMany(n)`**: Selects `n` items, duplicates allowed
- **`selectMany(min, max)`**: Selects a random number between min and max
- **`selectUnique(n)`**: Selects `n` unique items (no duplicates)

#### Consumable Lists

A consumable list creates a temporary copy from which items are removed after being selected. This guarantees that an item cannot be chosen again within the same generation pass—essential for unique inventories or preventing narrative repetition.

**Syntax:** `.consumableList`

### Output Transformation

Perchance includes a rich set of built-in properties and methods for transforming text. These can be chained together by appending them with a period (`.`).

#### Properties

- `.singularForm`, `.pluralForm` - Grammatical forms
- `.pastTense` - Verb conjugation
- `.upperCase`, `.lowerCase`, `.sentenceCase`, `.titleCase` - Case transforms

**Example:** `[animal.pluralForm.titleCase]` produces "Pigs"

#### Methods

- **`.joinItems("separator")`** - Joins multiple items with a separator
- **Example:** `[fruit.selectMany(3).joinItems(", ")]` → "apple, orange, banana"

#### Grammatical Helpers

- **`{a}`** - Outputs "a" or "an" based on the following word
- **`{s}`** - Appends "s" to the preceding word for simple pluralization
- **`{min-max}`** - Selects a random integer within a range (e.g., `{1-100}`) or alphabetical range (e.g., `{a-z}`)

### Managing State with Identifiers

To create coherent outputs, you must often store and reuse a randomly selected value within a single generation.

#### Storing Values

The syntax `[identifierName = listName]` assigns a randomly selected item to an identifier. The stored value can then be reused elsewhere:

```text
[f = flower.selectOne]
The [f] is beautiful. I love the smell of the [f].
```

#### Multi-Action Execution

Multiple assignments and operations can be performed within a single set of square brackets by separating them with commas. Only the final operation's result is displayed as output:

```text
[a = animal, v = verb, a.upperCase + " " + v.pastTense]
```

This first selects an animal, then a verb, then outputs a formatted sentence using both stored values.

### Core Syntax Reference

| Syntax/Property                            | Description                                                         |
| :----------------------------------------- | :------------------------------------------------------------------ |
| `listName`                                 | Defines a list. Items are indented below it.                        |
| `[listName]`                               | Selects and outputs one random item from the list.                  |
| `{item1\|item2}`                           | Shorthand for selecting one random item from an inline list.        |
| `^n`                                       | Sets the selection weight of an item. Example: `item^2`.            |
| `[id = list]`                              | Stores the selected item from `list` in the identifier `id`.        |
| `.selectMany(n)`                           | Selects `n` items from a list, allowing duplicates.                 |
| `.selectUnique(n)`                         | Selects `n` unique items from a list.                               |
| `.consumableList`                          | Creates a list where items are removed after being selected.        |
| `.joinItems("sep")`                        | Joins selected items with a separator. Example: `.joinItems(", ")`. |
| `.titleCase` / `.upperCase` / `.lowerCase` | Case transformations.                                               |
| `.pluralForm` / `.pastTense`               | Grammatical transformations.                                        |
| `{a}`                                      | Outputs "a" or "an" based on the next word.                         |
| `{s}`                                      | Appends "s" to the previous word for simple pluralization.          |
| `{min-max}`                                | Selects a random integer or letter from a range.                    |

---

## Section 2: Web Technologies

A Perchance generator is not merely a script; it is a fully functional, self-contained webpage. The platform seamlessly integrates standard web technologies—HTML, CSS, and JavaScript—allowing developers to build rich, interactive user interfaces.

### The Perchance Editor UI

The editor interface is divided into distinct panels:

- **Lists/Perchance Panel** (Left): Primary workspace for generator logic using Perchance syntax
- **HTML Panel** (Bottom-right): Text editor for the webpage's HTML structure
- **Preview/Output Panel** (Top-right): Live, rendered output of the generator

The editor includes standard IDE features: line wrapping, code folding, font size adjustment, resizable panels, keyboard shortcuts (`Ctrl+S`, `Ctrl+/`, `Tab`), and revision history.

### Structuring the Front-End with HTML

The HTML panel is where the visual structure of the generator is defined. The Perchance engine actively parses this panel with specific rules.

#### Perchance Syntax in HTML

The engine evaluates any text within square `[]` and curly `{}` brackets as Perchance code, replacing it with generated output. To display literal brackets, escape them with a backslash:

```html
<div>Use \[brackets\] like this</div>
```

#### Basic Interactivity with `update()`

The global `update()` function is the primary mechanism for user-driven interactivity. When called, it re-evaluates all Perchance code on the page, generating a new random output.

```html
<button onclick="update()">Randomize</button>
```

### Styling with CSS

CSS is embedded within `<style>` tags directly in the HTML panel. A critical design choice: the Perchance engine **ignores all content inside `<style>` tags**. This prevents syntax collisions, as CSS selectors often use curly braces (`{}`), which would otherwise conflict with Perchance's shorthand list syntax.

#### Theme-Adaptive Styling

The message style input field (for chat apps) accepts CSS with powerful features:

**Theme Adaptation:**

```css
.message-bubble {
    background-color: light-dark(#eeeeee, #333333);
    color: light-dark(black, white);
}
```

### JavaScript Integration

JavaScript code is embedded within `<script>` tags in the HTML panel. Similar to CSS, the Perchance engine does not process content within `<script>` tags—the code is executed directly by the browser.

This separation is crucial: it prevents conflicts between JavaScript syntax (e.g., array literals `[]`) and Perchance syntax, and allows developers to leverage the full JavaScript ecosystem.
