// An opaque origin reproduces module CORS restrictions without relaxing browser policy.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const base = "http://127.0.0.1:8000/local-loading/";
    await page.route(base + "**", (route) => {
      const relative = new URL(route.request().url()).pathname.replace(
        "/local-loading/",
        "",
      );
      const headers =
        relative === "index.html"
          ? {
              "Content-Security-Policy":
                "sandbox allow-scripts allow-downloads",
            }
          : {};
      return route.fulfill({
        body: fs.readFileSync(path.join(__dirname, "..", relative)),
        contentType: relative.endsWith(".js")
          ? "text/javascript"
          : relative.endsWith(".css")
            ? "text/css"
            : "text/html",
        headers: { ...headers, "Access-Control-Allow-Origin": "" },
      });
    });
    await page.goto(base + "index.html");
    await page.click("#start");
    await page.waitForTimeout(1200);
    assert.equal(await page.locator("#overlay").isVisible(), false);
    assert.notEqual(await page.locator("#time").textContent(), "20.0秒");
    await page.click("#pause");
    assert.equal(await page.locator("#title").textContent(), "ひとやすみ");
    await page.click("#start");
    assert.equal(await page.locator("#overlay").isVisible(), false);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: start, timer, pause/resume with opaque origin and unavailable localStorage",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
