
import os
from playwright.sync_api import sync_playwright, expect

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute path to the HTML file
        file_path = os.path.abspath('build/output/RPGlitch.html')
        page.goto(f'file://{file_path}')

        # 1. Select a character and AI to enable the "Begin Story" button
        page.select_option('select#user-select', index=1)
        page.select_option('select#ai-select', index=1)

        # 2. Verify "Begin Story" button leads to the story view
        begin_story_button = page.locator('button#begin-story')
        expect(begin_story_button).to_be_enabled()
        begin_story_button.click()
        expect(page.locator('#chat-screen-container')).to_be_visible()

        # Go back to the main page to test other buttons
        page.go_back()
        # Need to re-select after navigation
        page.select_option('select#user-select', index=1)
        page.select_option('select#ai-select', index=1)


        # 3. Verify "Copy and Customise" button opens the entity form
        copy_button = page.locator('button:has-text("Copy and Customise")')
        expect(copy_button).to_be_visible()
        copy_button.click()
        expect(page.locator('#entity-form')).to_be_visible()
        h2_element = page.locator('h2')
        expect(h2_element).to_contain_text('Editing')

        # 4. Verify "Save" button works
        save_button = page.locator('button:has-text("Save")')
        save_button.click()
        expect(page.locator('#storyboard')).to_be_visible()

        # 5. Verify Chin Panel auto-closure
        page.locator('#tab-stories').click()
        expect(page.locator('#chin-stories')).not_to_have_attribute('hidden')
        # Click outside to close
        page.locator('body').click(position={'x': 10, 'y': 250}) # y is lower to avoid clicking the topbar
        expect(page.locator('#chin-stories')).to_have_attribute('hidden')

        # 6. Re-open chin and select a character to show final state for screenshot
        page.locator('#chin-toggle').click()
        page.select_option('select#user-select', index=1)

        # 7. Final Screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == '__main__':
    main()
