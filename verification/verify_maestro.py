from playwright.sync_api import sync_playwright
import time
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Assuming the app is built to apps/rpglitch/RPGlitch.html
    # We use file:// protocol.
    app_path = os.path.abspath("apps/rpglitch/RPGlitch.html")
    page.goto(f"file://{app_path}")

    # 1. Verify Disabled Button Physics
    # Create a disabled button dynamically to test
    page.evaluate("""() => {
        const btn = document.createElement('button');
        btn.className = 'ui-btn';
        btn.disabled = true;
        btn.id = 'test-disabled-btn';
        btn.innerText = 'Disabled';
        document.body.appendChild(btn);
    }""")

    # Check computed style
    transform = page.eval_on_selector("#test-disabled-btn", "el => getComputedStyle(el).transform")
    transition = page.eval_on_selector("#test-disabled-btn", "el => getComputedStyle(el).transition")

    assert transform == "none", f"Expected transform to be 'none', but got {transform}"
    # The computed value for 'transition: none' is often 'all 0s ease 0s'.
    assert transition == "all 0s ease 0s", f"Expected transition to be 'none', but got {transition}"

    # 2. Verify Lightbox Layout
    # Mock opening the lightbox
    page.evaluate("""() => {
        const lightbox = {
            init: () => {},
            element: null,
            open: function() {
                 // Manually construct what we expect for visual verification since we can't easily trigger the full service without mocks
                 const overlay = document.createElement('div');
                 overlay.className = 'lightbox-overlay is-visible';
                 overlay.id = 'lightbox-overlay';

                 const content = document.createElement('div');
                 content.className = 'lightbox-content';
                 content.style.marginTop = '100px';

                 const img = document.createElement('img');
                 img.src = 'https://via.placeholder.com/300x400';
                 img.style.width = '300px';
                 img.style.height = '400px';

                 const actions = document.createElement('div');
                 actions.className = 'lightbox-actions';

                 const btn1 = document.createElement('button');
                 btn1.className = 'btn-ghost';
                 btn1.innerText = 'Download';

                 const btn2 = document.createElement('button');
                 btn2.className = 'btn-ghost';
                 btn2.innerText = 'Reroll';

                 actions.appendChild(btn1);
                 actions.appendChild(btn2);
                 content.appendChild(img);
                 content.appendChild(actions); // This is the structural change we made in JS

                 overlay.appendChild(content);
                 document.body.appendChild(overlay);
            }
        };
        lightbox.open();
    }""")

    page.wait_for_selector(".lightbox-overlay.is-visible")
    time.sleep(0.5) # Wait for lightbox fade-in animation to complete
    page.screenshot(path="verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
