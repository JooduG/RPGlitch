from playwright.sync_api import sync_playwright
import os

def run():
    file_path = os.path.abspath("apps/rpglitch/RPGlitch.html")
    url = f"file://{file_path}"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 1024})

        print(f"Navigating to {url}")
        page.goto(url)

        # Wait for main container
        page.wait_for_selector("#main", state="visible")
        page.wait_for_timeout(2000) # Wait for JS to hydrate

        print("Clicking AI slot...")
        # Click the AI Character slot
        page.click("#btn-select-ai")

        # Wait for either drawer or profile screen
        # If no entities, it might show drawer with "Create New" or just "New" button
        page.wait_for_timeout(1000)

        # Check if drawer is open
        if page.is_visible("#entity-drawer"):
            print("Drawer is open. Checking for 'New' button...")
            # Look for a button that creates new entity.
            # In library grid, usually there is a "New Character" card/button.
            # Or a button in header.

            # Let's try to find text "New" or a button with class related to add.
            # Assuming standard UI, let's look for any button in the drawer header or content.

            # Try to create new via JS if button is hard to find
            # But let's look for [data-action="create"] or similar.

            # For now, let's blindly click the first button in the drawer content if any,
            # or try to execute a create command.

            # Usually the first item in library is "Create New"
            # Let's try to click the first element in #library-grid

            # Screenshot the drawer to see what's there
            page.screenshot(path="debug_drawer.png")

            # Just in case, try to click a button with text "New"
            new_btn = page.get_by_text("New", exact=False)
            if new_btn.count() > 0:
                new_btn.first.click()
            else:
                 # Evaluate JS to force create
                 print("Forcing create via JS...")
                 page.evaluate("""
                    // Assuming 'entities' and 'orchestrator' are accessible or we can trigger it.
                    // Actually, let's try to find the create button class.
                    const createBtn = document.querySelector('.btn-create-entity') || document.querySelector('[data-action="create"]');
                    if (createBtn) createBtn.click();
                    else {
                        // If we can't find button, we might need to rely on the fact that we are in a fresh state.
                        // Maybe the app exposes a global to open profile.
                    }
                 """)

        page.wait_for_timeout(1000)

        # If we are now in profile view, #profile-screen should be visible (and not hidden)
        # Note: HTML `hidden` attribute makes it display:none.

        if page.is_visible("#profile-screen"):
             print("Profile screen is visible.")
             page.screenshot(path="verification_profile_view.png")

             # Click Edit Button
             print("Clicking Edit...")
             # The edit button is in the footer actions, usually a pencil icon or "Edit" title.
             # We added `editBtn.title = "Edit Profile"` in view.js
             page.click('button[title="Edit Profile"]')

             page.wait_for_timeout(1000)
             page.screenshot(path="verification_profile_edit.png")
             print("Edit screenshot taken.")
        else:
             print("Profile screen not visible. Taking debug screenshot.")
             page.screenshot(path="debug_failed_state.png")

        browser.close()

if __name__ == "__main__":
    run()
