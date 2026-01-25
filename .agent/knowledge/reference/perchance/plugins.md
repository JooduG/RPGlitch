# Perchance Plugin Ecosystem

## Section 3: The Plugin Ecosystem

Plugins transform Perchance from a self-contained tool into an extensible framework. They are reusable, shareable modules that encapsulate specific functionalities, allowing developers to add complex features with a single line of code.

### Importing Plugins

Plugins are integrated using a simple import syntax within the Lists Panel:

**Syntax:** `{import:plugin-name}`

This makes the plugin's functionality available for use within the generator.

#### Official vs. Community Plugins

**Official Plugins:** Maintained by the platform creator, guaranteed to be stable and will not be deleted or altered in breaking ways.

**Community Plugins:** Created by users without stability guarantees. Best practice: "fork" or "remix" a community plugin to create a personal copy, ensuring long-term stability.

### Essential Plugin Categories

**UI and Layout:**

- `layout-maker-plugin`, `navbar-plugin`, `tabs-plugin` - Create sophisticated visual layouts.

**Interactivity:**

- `tap-plugin` - Click specific outputs to re-randomize them.
- `goto-plugin` - Foundation for text-based adventures.

**Data Persistence:**

- `kv-plugin`, `remember-plugin` - Store data that persists across page reloads.

### The AI Plugins

The most powerful extensions are the AI plugins:

**`ai-text-plugin`**: Interface to a Large Language Model for generating text (stories, poems, dialogue).

**`text-to-image-plugin`**: Utilizes Stable Diffusion to generate images.

**Funding Model:** Ads are displayed for non-logged-in users to cover server costs.

**Important:** Do not fork AI plugins. Their client-side code is inextricably linked to a backend that cannot be replicated by users.
