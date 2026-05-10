with open('src/ui/storymode/Message.svelte', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(".thinking-wrapper ~ div", ".message-content ~ div")

with open('src/ui/storymode/Message.svelte', 'w', encoding='utf-8') as f:
    f.write(content)
