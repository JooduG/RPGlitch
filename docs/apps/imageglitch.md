# imageglitch

# ImageGlitch

A minimalist Text-to-Image generator built for the Perchance platform, following the same single-file build flow as RPGlitch.

## For Developers

### Entry / Output

- **Entry HTML:** `apps/imageglitch/ImageGlitch.html`
- **Output HTML:** `build/output/ImageGlitch.html`

### Build Process

To build the application, run the following command:

```bash
npm run build:imageglitch
```

This command will process `apps/imageglitch/ImageGlitch.html`, inline its styles from `ImageGlitch-style-block.html`, and output the final bundled HTML to `build/output/ImageGlitch.html`.

### Styling

The current styling strategy is to **use Pico.css as much as possible** for foundational elements to ensure consistency and a clean, modern aesthetic with minimal effort. We may develop a more custom styling system in the future, but for now, all new components should adhere to Pico.css standards.
