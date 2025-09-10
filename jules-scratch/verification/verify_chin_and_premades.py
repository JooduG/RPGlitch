from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto(f"file:///app/build/output/RPGlitch.html")

    # Click the "Characters" tab to open the chin
    page.click('button[data-chin="characters"]')

    # Wait for the chin to be visible
    page.wait_for_selector('.chin[data-chin="characters"]:not([hidden])')

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
