from playwright.sync_api import sync_playwright

def verify_chat_rendering():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 375, "height": 812}) # Mobile view

        print("Navigating...")
        page.goto("http://localhost:8080")

        # Force show chat feed by toggling classes
        print("Switching to Story Mode view...")
        page.evaluate("""
            document.body.classList.remove('mode-storyboard');
            document.body.classList.add('mode-storymode');

            // Explicitly manage visibility for verification
            document.querySelectorAll('.stage-content--storyboard').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.stage-content--storymode').forEach(el => el.style.display = 'block');

            const feed = document.querySelector("#chat-feed");
            if(feed) feed.style.display = 'block';
        """)

        # Verify injectTestImage exists
        is_defined = page.evaluate("typeof window.injectTestImage === 'function'")
        if not is_defined:
            print("Error: injectTestImage is not defined. Module loading failed?")
            page.screenshot(path="verification/failed_load.png")
            return

        print("Injecting test image...")
        page.evaluate("window.injectTestImage()")

        try:
            # Wait for the bubble
            page.wait_for_selector(".chat-bubble", state="visible", timeout=5000)
            print("Chat bubble rendered successfully.")

            # Take screenshot
            page.screenshot(path="verification/verification.png")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/failed_render.png")

        browser.close()

if __name__ == "__main__":
    verify_chat_rendering()
