// Run against a local static server; use a fresh browser context for each run.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    // Keep the timed smoke test deterministic; rare time extensions have their own test.
    await page.addInitScript(() => {
      Math.random = () => 0.5;
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400 && !r.url().endsWith("/favicon.ico"))
        errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(process.env.TEST_URL || "http://127.0.0.1:8000");
    assert.match(await page.title(), /ほしぞらキャッチ/);
    await page.click("#sound");
    assert.equal(
      await page.locator("#sound").getAttribute("aria-pressed"),
      "false",
    );
    await page.click("#sound");
    await page.selectOption("#bgm", "2");
    for (const mode of ["EASY", "HARD"]) {
      await page.selectOption("#difficulty", mode);
      await page.click("#start");
      await page.waitForTimeout(1200);
      assert.notEqual(await page.locator("#time").textContent(), "20.0秒");
      assert.equal(await page.locator("#difficulty").isDisabled(), true);
      await page.click("#pause");
      const time = await page.locator("#time").textContent();
      await page.waitForTimeout(300);
      assert.equal(await page.locator("#time").textContent(), time);
      await page.click("#start");
      await page.locator("h1").click(); // keyboard input should target the document
      await page.keyboard.press("p");
      assert.equal(await page.locator("#title").textContent(), "ひとやすみ");
      await page.keyboard.press("p");
      await page.waitForFunction(
        () => document.querySelector("#start").textContent === "もう一度あそぶ",
        null,
        { timeout: 30000 },
      );
      assert.equal(await page.locator("#time").textContent(), "0.0秒");
      assert.equal(await page.locator("#difficulty").isDisabled(), false);
      const saved = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("starcatch-rankings-v2")),
      );
      assert.equal(saved[mode].length, 1);
      await page.reload();
      assert.match(
        await page
          .locator(mode === "EASY" ? "#rankEasy" : "#rankHard")
          .textContent(),
        /点/,
      );
    }
    const pending = page.waitForEvent("download");
    await page.click("#export");
    const download = await pending;
    const fs = require("node:fs");
    const data = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
    assert.equal(data.rankings.EASY.length, 1);
    assert.equal(data.rankings.HARD.length, 1);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: assets, audio controls, EASY/HARD gameplay, pause/resume, rankings, JSON export, mobile width; no JS errors",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
