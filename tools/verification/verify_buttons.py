
from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the built file
        cwd = os.getcwd()
        file_path = f"file://{cwd}/apps/rpglitch/RPGlitch.html"
        print(f"Navigating to: {file_path}")
        page.goto(file_path)

        # Wait for content to load
        page.wait_for_selector("#main")

        # Screenshot the Storyboard Buttons
        # The .btn-group-pill has Ghost and Primary buttons
        pill = page.locator(".storyboard-actions .btn-group-pill")
        if pill.is_visible():
            pill.screenshot(path="tools/verification/buttons_pill.png")
            print("Screenshot taken: buttons_pill.png")

        # Screenshot the Start Button specifically
        start_btn = page.locator("#begin-story")
        if start_btn.is_visible():
            start_btn.screenshot(path="tools/verification/button_primary_disabled.png")
            print("Screenshot taken: button_primary_disabled.png")

            # Enable it via JS to see active state
            page.evaluate("document.getElementById('begin-story').disabled = false")
            start_btn.screenshot(path="tools/verification/button_primary_active.png")

        # Screenshot the Modal Buttons (Secondary/Contrast)
        # We need to trigger the modal or just find them if hidden?
        # They are in dialog#emergency-modal, usually hidden.
        # Let's unhide the dialog for a sec
        page.evaluate("document.getElementById('emergency-modal').showModal()")
        modal = page.locator("#emergency-modal article")
        if modal.is_visible():
            modal.screenshot(path="tools/verification/buttons_modal.png")
            print("Screenshot taken: buttons_modal.png")

        browser.close()

if __name__ == "__main__":
    run()
