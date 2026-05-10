with open('src/ui/storymode/Message.test.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import { render, screen } from "@testing-library/svelte";', 'import { render } from "@testing-library/svelte";')

with open('src/ui/storymode/Message.test.js', 'w', encoding='utf-8') as f:
    f.write(content)
