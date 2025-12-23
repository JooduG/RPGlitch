
from playwright.sync_api import sync_playwright, expect
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the built file
        file_path = Path("apps/rpglitch/RPGlitch.html").resolve().as_uri()
        print(f"Navigating to: {file_path}")
        page.goto(file_path)

        # 1. Find the "Begin Story" button, which we know is disabled by default in the HTML
        btn = page.locator("#begin-story")

        # Verify it is disabled
        if not btn.is_disabled():
            print("ERROR: #begin-story should be disabled initially.")
            exit(1)

        print("Button is disabled.")

        # 2. Check box-shadow on disabled button
        computed_shadow = btn.evaluate("el => getComputedStyle(el).boxShadow")
        print(f"Computed Box-Shadow: {computed_shadow}")

        if computed_shadow != "none":
            print("FAIL: Disabled button has a box-shadow.")
        else:
            print("PASS: Disabled button has no box-shadow.")

        # 3. Force Hover State checks (Previous verification)

        # Remove potential blockers
        page.evaluate("""
            const blockers = document.querySelectorAll('#fractal-background, #boot-skeleton');
            blockers.forEach(el => el.remove());
        """)

        # Try native hover
        try:
            btn.hover(timeout=2000)
            print("Hover successful.")
        except Exception as e:
            print(f"Hover failed: {e}")

        computed_filter_post = btn.evaluate("el => getComputedStyle(el).filter")
        computed_transform_post = btn.evaluate("el => getComputedStyle(el).transform")

        print(f"Computed Filter (Post-Hover): {computed_filter_post}")
        print(f"Computed Transform (Post-Hover): {computed_transform_post}")

        if "brightness" in computed_filter_post:
            print("FAIL: Button has brightness filter when disabled and hovered.")
        else:
            print("PASS: Button does not have brightness filter.")

        if computed_transform_post != "none" and computed_transform_post != "matrix(1, 0, 0, 1, 0, 0)":
             print("FAIL: Button has transform when disabled and hovered.")
        else:
             print("PASS: Button has no transform.")

        # Take a screenshot
        btn.screenshot(path="tools/verification/disabled_hover_check.png")
        print("Screenshot taken.")

        browser.close()

if __name__ == "__main__":
    run()
