import { test, expect } from "@playwright/test";
import { chromium } from "playwright";

test.describe("RPGlitch Image Upload and Generation", () => {
  let browser;
  let page;

  test.beforeAll(async () => {
    browser = await chromium.launch();
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("pageerror", (error) => {
      console.error(`PAGE ERROR: ${error.message}`);
    });

    // Mock the Perchance plugins
    await page.addInitScript(() => {
      window.upload = async () => {
        console.log("window.upload called");
        return { url: "http://example.com/uploaded.png" };
      };
      window.textToImage = async ({ prompt }) => {
        console.log(`window.textToImage called with prompt: ${prompt}`);
        return { url: `http://example.com/generated.png?prompt=${prompt}` };
      };
      window.ai = {
        generateStream: async () => {},
      };
      window.remember = () => {};
      window.superFetch = async () => {};
    });

    await page.goto("http://localhost:8080/apps/rpglitch/index.html", {
      waitUntil: "networkidle",
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test("should call window.upload when upload button is clicked", async () => {
    test.setTimeout(60000); // Increase timeout to 60s
    const consoleLogs = [];
    page.on("console", (msg) => {
      consoleLogs.push(msg.text());
    });

    console.log("Clicking #tab-characters");
    await page.click("#tab-characters");

    console.log("Waiting for chin to open");
    await page.waitForFunction(() => {
      const chinContainer = document.querySelector("#chin-container");
      const charactersChin = document.querySelector("#chin-characters");
      return (
        chinContainer &&
        !chinContainer.hasAttribute("hidden") &&
        charactersChin &&
        !charactersChin.hasAttribute("hidden")
      );
    });

    console.log("Clicking #new-character");
    await page.click("#new-character");

    console.log("Waiting for #profile-screen");
    await page.waitForSelector("#profile-screen");

    console.log("Clicking upload button");
    await page.click('button[data-action="upload"]');

    console.log("Waiting for upload to be called");
    await page.waitForTimeout(1000); // give it a moment for the async call

    const success = consoleLogs.some((log) =>
      log.includes("window.upload called"),
    );
    expect(success).toBe(true);
  });

  test("should call window.textToImage when generate button is clicked", async () => {
    test.setTimeout(60000); // Increase timeout to 60s
    const consoleLogs = [];
    page.on("console", (msg) => {
      consoleLogs.push(msg.text());
    });

    console.log("Clicking #tab-characters");
    await page.click("#tab-characters");

    console.log("Waiting for chin to open");
    await page.waitForFunction(() => {
      const chinContainer = document.querySelector("#chin-container");
      const charactersChin = document.querySelector("#chin-characters");
      return (
        chinContainer &&
        !chinContainer.hasAttribute("hidden") &&
        charactersChin &&
        !charactersChin.hasAttribute("hidden")
      );
    });

    console.log("Clicking #new-character");
    await page.click("#new-character");

    console.log("Waiting for #profile-screen");
    await page.waitForSelector("#profile-screen");

    console.log("Filling image url");
    await page.fill('input[name="imageUrl"]', "a beautiful landscape");

    console.log("Clicking generate button");
    await page.click('button[data-action="generate"]');

    console.log("Waiting for textToImage to be called");
    await page.waitForTimeout(1000); // give it a moment for the async call

    const success = consoleLogs.some((log) =>
      log.includes(
        "window.textToImage called with prompt: a beautiful landscape",
      ),
    );
    expect(success).toBe(true);
  });
});
