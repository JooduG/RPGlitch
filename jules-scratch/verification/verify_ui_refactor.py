import os
import time
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    chromium = playwright.chromium
    browser = chromium.launch(headless=True)
    page = browser.new_page()

    # Get the absolute path to the HTML file
    current_dir = os.getcwd()
    file_path = os.path.join(current_dir, 'build', 'output', 'RPGlitch.html')

    page.goto(f'file://{file_path}')

    # Wait for the page to load by waiting for the "Stories" tab to be visible
    stories_button = page.get_by_role("tab", name="Stories")
    expect(stories_button).to_be_visible()

    # Open the "Stories" chin to show the layout
    stories_button.click()

    # Wait for the chin to become visible
    chin_stories = page.locator("#chin-stories")
    expect(chin_stories).to_be_visible()

    # Give the JS a moment to attach the event listener
    time.sleep(0.1)

    # Dispatch a click event directly on the backdrop element
    page.dispatch_event("#chin-backdrop", "click")

    # Wait for the chin to be hidden
    expect(chin_stories).to_be_hidden()

    # Take a screenshot for visual verification
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
