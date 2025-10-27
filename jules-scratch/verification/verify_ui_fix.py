
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the app
        await page.goto("file:///app/build/output/RPGlitch.html")

        # Open the characters chin and take a screenshot
        await page.click('button[data-chin="characters"]')
        await page.wait_for_selector('#chin-character-grid > .chin-card')
        await page.screenshot(path="jules-scratch/verification/characters.png")

        # Open the worlds chin and take a screenshot
        await page.click('button[data-chin="worlds"]')
        await page.wait_for_selector('#chin-world-grid > .chin-card')
        await page.screenshot(path="jules-scratch/verification/worlds.png")

        # Close the chin
        await page.click('button[data-chin="worlds"]')

        # Take a screenshot of the storyboard
        await page.screenshot(path="jules-scratch/verification/storyboard.png")

        await browser.close()

asyncio.run(main())
