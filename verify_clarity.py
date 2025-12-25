from playwright.sync_api import sync_playwright, expect
import os

def verify_clarity(page):
    file_path = (Path.cwd() / "apps" / "rpglitch" / "RPGlitch.html").as_uri()
    page.goto(file_path)
    page.wait_for_selector("body")

    print("--- Verifying Opacity Rules ---")

    # Check all visible buttons
    buttons = page.locator("button, .ui-btn").all()
    print(f"Found {len(buttons)} buttons/btn-like elements.")

    violations = 0

    for i, btn in enumerate(buttons):
        if not btn.is_visible():
            continue

        opacity = float(btn.evaluate("el => getComputedStyle(el).opacity"))
        # Fix: get_attribute takes one argument
        cls = btn.get_attribute("class") or ""
        is_disabled = btn.is_disabled() or "disabled" in cls
        text = btn.inner_text().strip() or "ICON_ONLY"

        print(f"Button {i} [{text}]: Opacity={opacity}, Disabled={is_disabled}")

        if is_disabled:
            # Disabled elements are allowed to be transparent
            if opacity > 0.9:
                print(f"  Note: Disabled button '{text}' is fully opaque (ok but unusual).")
        else:
            # Enabled elements MUST be opaque
            if opacity < 1.0:
                print(f"  VIOLATION: Enabled button '{text}' has opacity {opacity}!")
                violations += 1

    # Check specific fixed elements
    # 1. Chat (Simulated)
    print("\n--- Checking Chat ---")
    page.evaluate("""
        const container = document.createElement('div');
        container.id = 'chat-feed';
        container.innerHTML = `
            <div class='story-message user' data-type='IC'>
                Hello World
            </div>
        `;
        document.body.appendChild(container);
    """)
    msg = page.locator(".story-message.user").first
    msg_opacity = float(msg.evaluate("el => getComputedStyle(el).opacity"))
    print(f"Message Opacity: {msg_opacity}")
    if msg_opacity < 1.0:
        print("  VIOLATION: Chat message is not solid!")
        violations += 1

    # 2. Profile Labels (Simulated)
    print("\n--- Checking Profile Labels ---")
    page.evaluate("""
        const profile = document.createElement('div');
        profile.className = 'profile-row';
        profile.innerHTML = `
            <div class='label-group'>
                <span class='dynamics-label'>Strength</span>
            </div>
            <div class='placeholder-image'>
                <svg></svg>
            </div>
        `;
        document.body.appendChild(profile);
    """)
    label = page.locator(".dynamics-label").first
    label_opacity = float(label.evaluate("el => getComputedStyle(el).opacity"))
    print(f"Label Opacity: {label_opacity}")
    if label_opacity < 1.0:
        print("  VIOLATION: Profile label is not solid!")
        violations += 1

    svg = page.locator(".placeholder-image svg").first
    svg_opacity = float(svg.evaluate("el => getComputedStyle(el).opacity"))
    print(f"SVG Opacity: {svg_opacity}")
    if svg_opacity < 1.0:
        print("  VIOLATION: SVG is not solid!")
        violations += 1

    # Screenshot
    page.screenshot(path="verification.png")
    print("\nScreenshot saved to verification.png")

    if violations > 0:
        raise Exception(f"Found {violations} violations of the Solid White Mandate.")
    else:
        print("SUCCESS: All checks passed.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_clarity(page)
        except Exception as e:
            print(f"FAILED: {e}")
            exit(1)
        finally:
            browser.close()
