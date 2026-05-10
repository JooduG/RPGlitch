with open('src/ui/storymode/InputBar.svelte', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("max-width: 48rem;", "max-width: var(--width-modal-max);")
content = content.replace("max-height: 12.5rem;", "max-height: var(--card-height-m);")
content = content.replace("width: 1.25rem;\n    height: 1.25rem;", "width: var(--icon-m);\n    height: var(--icon-m);")

with open('src/ui/storymode/InputBar.svelte', 'w', encoding='utf-8') as f:
    f.write(content)
