from playwright.sync_api import sync_playwright

def verify_dom_structure():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 375, "height": 812}) # Mobile view

        page.goto("http://localhost:8080")

        # Switch to story mode
        page.evaluate("""
            document.body.classList.remove('mode-storyboard');
            document.body.classList.add('mode-storymode');

            document.querySelectorAll('.stage-content--storyboard').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.stage-content--storymode').forEach(el => el.style.display = 'block');

            const feed = document.querySelector("#chat-feed");
            if(feed) feed.style.display = 'block';
        """)

        # To trigger the virtual feed properly, we need to create an instance or leverage existing one.
        # But `feed.js` initializes `virtualFeed` lazily in `renderChat`.
        # We can't access `renderChat` directly as it's module scoped.

        # However, we can construct a NEW VirtualFeed on a dummy element just to verify the class behavior!
        # This is a unit test approach running in the browser context.

        print("Running in-browser unit test...")
        result = page.evaluate("""
            (async () => {
                try {
                    // Import the module dynamically (path relative to server root)
                    const m = await import('./js/ui/components/chat/virtual-feed.js');

                    const container = document.createElement('div');
                    container.id = 'test-virtual-feed';
                    container.style.height = '500px';
                    container.style.overflow = 'auto';
                    document.body.appendChild(container);

                    const vf = new m.VirtualFeed(container, (frag, item) => {
                        const div = document.createElement('div');
                        div.textContent = item.text;
                        div.style.height = '50px';
                        frag.appendChild(div);
                    });

                    // Add items
                    const items = Array.from({length: 20}, (_, i) => ({id: i, text: 'Item ' + i}));
                    vf.setItems(items);

                    // Check structure
                    const wrapper = container.querySelector('.virtual-content-wrapper');
                    const spacerTop = container.querySelector('.virtual-spacer-top');
                    const spacerBottom = container.querySelector('.virtual-spacer-bottom');

                    if (!wrapper) return { error: 'Wrapper not found' };
                    if (!spacerTop) return { error: 'Spacer top not found' };
                    if (!spacerBottom) return { error: 'Spacer bottom not found' };

                    // Check children of wrapper
                    if (wrapper.children.length === 0) return { error: 'Wrapper has no children' };

                    // Verify correct order in container
                    const children = container.children;
                    if (children[0] !== spacerTop) return { error: 'SpacerTop not first' };
                    if (children[1] !== wrapper) return { error: 'Wrapper not second' };
                    if (children[2] !== spacerBottom) return { error: 'SpacerBottom not third' };

                    return { success: true };
                } catch (e) {
                    return { error: e.toString() };
                }
            })()
        """)

        print(f"Test Result: {result}")

        if result.get('success'):
            print("DOM Structure Verified Successfully.")
            page.screenshot(path="verification/dom_structure_pass.png")
        else:
            print(f"Verification Failed: {result.get('error')}")
            page.screenshot(path="verification/dom_structure_fail.png")

        browser.close()

if __name__ == "__main__":
    verify_dom_structure()
