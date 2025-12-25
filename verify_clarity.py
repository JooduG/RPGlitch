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
    submit_btn = page.locator('#story-form button[type="submit"]')
    if submit_btn.is_visible():
        opacity = submit_btn.evaluate("el => getComputedStyle(el).opacity")
        print(f"Submit Button Opacity: {opacity}")
        assert opacity == '1', f"FAILURE: Submit button opacity is {opacity}, but should be '1'"

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
    assert italic_opacity == '1', f"Italic Text Opacity was {italic_opacity}, but expected '1'."

    # Check bold-italic opacity
    bold_italic_el = page.locator('.story-message em').first
    bold_italic_opacity = bold_italic_el.evaluate("el => getComputedStyle(el).opacity")
    print(f"Bold Italic Text Opacity: {bold_italic_opacity}")
    assert bold_italic_opacity == '1', f"Bold Italic Text Opacity was {bold_italic_opacity}, but expected '1'."

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
    assert muted_opacity == '1', f"Muted Class Opacity was {muted_opacity}, but expected '1'."

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
    assert glass_color == "rgb(255, 255, 255)", f"Glass Button Color was {glass_color}, but expected 'rgb(255, 255, 255)'."

    # Take screenshot
    page.screenshot(path="verification_clarity.png")
    print("Verification Passed!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_clarity(page)
        except Exception as e:
            print(f"Error: {e}")
            exit(1)
        finally:
            browser.close()
