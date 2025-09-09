from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Get the absolute path to the HTML file
    html_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'build', 'output', 'ImageGlitch.html'))

    # Navigate to the local HTML file
    page.goto(f'file://{html_file_path}')

    # Wait for the page to load
    page.wait_for_load_state('networkidle')

    # Take a screenshot
    page.screenshot(path='jules-scratch/verification/verification.png')

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
