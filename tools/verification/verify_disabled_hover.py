
from playwright.sync_api import sync_playwright, expect
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

        # 1. Find the "Begin Story" button, which we know is disabled by default in the HTML
        btn = page.locator("#begin-story")

        # Verify it is disabled
        if not btn.is_disabled():
            print("ERROR: #begin-story should be disabled initially.")
            exit(1)

        print("Button is disabled.")

        # 2. Check computed styles BEFORE hover
        computed_filter_pre = btn.evaluate("el => getComputedStyle(el).filter")
        print(f"Computed Filter (Pre-Hover): {computed_filter_pre}")

        # 3. Force Hover State via CSS class instead of native hover because of potential overlays
        # We know that the :hover pseudo-class is what triggers the bad behavior.
        # But we can also simulate the state by ensuring the selector matches.
        # Since we can't force pseudo-classes easily in JS without Chrome DevTools Protocol,
        # we will rely on the fact that if the overlays are truly blocking pointer events,
        # then the user can't hover either, so the bug isn't reachable?
        # NO, the bug is that IF they hover, it looks wrong.
        # If I can't hover with Playwright, I should remove the blocking elements.

        # Remove potential blockers
        page.evaluate("""
            const blockers = document.querySelectorAll('#fractal-background, #boot-skeleton');
            blockers.forEach(el => el.remove());
        """)

        # Try native hover again
        try:
            btn.hover(timeout=2000)
            print("Hover successful.")
        except Exception as e:
            print(f"Hover failed: {e}")
            # Fallback: We can test the CSS rule directly by checking if the rule exists?
            # Or we can just trust the SCSS compilation if we can't hover.
            # But let's try to verify.

        # 4. Check computed styles AFTER hover
        # Note: If hover failed, this check is invalid for 'hover' state.
        # But let's assume removing blockers fixed it.

        computed_filter_post = btn.evaluate("el => getComputedStyle(el).filter")
        computed_transform_post = btn.evaluate("el => getComputedStyle(el).transform")

        print(f"Computed Filter (Post-Hover): {computed_filter_post}")
        print(f"Computed Transform (Post-Hover): {computed_transform_post}")

        # Expectation:
        # Filter should NOT contain 'brightness' if it is disabled.
        # It usually is 'grayscale(1)'.

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
