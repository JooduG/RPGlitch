from playwright.sync_api import sync_playwright
import os

def verify_clarity(page):
    # Load the local file - using absolute path
    cwd = os.getcwd()
    file_path = f"file://{cwd}/apps/rpglitch/RPGlitch.html"
    print(f"Navigating to {file_path}")
    page.goto(file_path)

    # Wait for the app to load
    page.wait_for_selector("body")

    # Verification Logic
    print("Verifying Button Opacity...")
    # Check a button (e.g., Settings cog or a generic button if visible)
    # The settings button is often visible or we can check the chat input button
    submit_btn = page.locator('#story-form button[type="submit"]')
    if submit_btn.is_visible():
        opacity = submit_btn.evaluate("el => getComputedStyle(el).opacity")
        print(f"Submit Button Opacity: {opacity}")
        if opacity != '1':
             print("FAILURE: Submit button opacity is not 1")

    print("Verifying Chat Message Opacity...")
    # Inject a dummy message to test if not present
    page.evaluate("""
        const msg = document.createElement('div');
        msg.className = 'story-message user';
        msg.innerHTML = '<i>Italic Text</i> <b>Bold Text</b> <em style="font-weight:bold">Bold Italic</em>';
        document.getElementById('chat-feed').appendChild(msg);
    """)

    # Check italic opacity
    italic_el = page.locator('.story-message i').first
    italic_opacity = italic_el.evaluate("el => getComputedStyle(el).opacity")
    print(f"Italic Text Opacity: {italic_opacity}")

    # Check bold-italic opacity
    bold_italic_el = page.locator('.story-message em').first
    bold_italic_opacity = bold_italic_el.evaluate("el => getComputedStyle(el).opacity")
    print(f"Bold Italic Text Opacity: {bold_italic_opacity}")

    # Check muted text in reset
    # Create a muted element
    page.evaluate("""
        const muted = document.createElement('div');
        muted.className = 'muted';
        muted.textContent = 'Muted Text';
        document.body.appendChild(muted);
    """)
    muted_el = page.locator('.muted').first
    muted_opacity = muted_el.evaluate("el => getComputedStyle(el).opacity")
    print(f"Muted Class Opacity: {muted_opacity}")

    # Check Glass Button color
    # Create a glass button
    page.evaluate("""
        const btn = document.createElement('button');
        btn.className = 'btn-glass';
        btn.textContent = 'Glass Button';
        document.body.appendChild(btn);
    """)
    glass_btn = page.locator('.btn-glass').first
    glass_color = glass_btn.evaluate("el => getComputedStyle(el).color")
    print(f"Glass Button Color: {glass_color}")
    # Expected rgb(255, 255, 255) -> solid white

    # Take screenshot
    page.screenshot(path="verification_clarity.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_clarity(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
