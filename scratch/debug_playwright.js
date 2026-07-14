/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/dashboard");
  console.log("URL:", page.url());
  console.log("TITLE:", await page.title());
  console.log("HTML:", await page.content());
  await browser.close();
})();
