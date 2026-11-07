const assert = require("node:assert/strict");
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
    // Capture the renderer's scene provider only in this test, without production debug hooks.
    await page.route("**/js/rendering.js", async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        body:
          (await response.text()) +
          `\nconst renderer=window.StarCatch.createRenderer;window.StarCatch.createRenderer=(canvas,getScene)=>{window.readScene=getScene;return renderer(canvas,getScene)};`,
      });
    });
    await page.addInitScript(() => {
      Math.random = () => 0.5;
    });
    await page.clock.install({ time: new Date("2026-11-08T00:00:00Z") });
    await page.clock.pauseAt(new Date("2026-11-08T00:00:01Z"));
    await page.goto(process.env.TEST_URL || "http://127.0.0.1:8000");
    await page.click("#start");
    await page.clock.runFor(100);
    await page.locator("h1").click();
    await page.keyboard.down("ArrowLeft");
    await page.clock.runFor(350);
    assert(
      await page.evaluate(() => readScene().tilt < -0.16),
      "left tilt approaches -10deg",
    );
    await page.keyboard.up("ArrowLeft");
    await page.clock.runFor(500);
    assert(
      await page.evaluate(() => Math.abs(readScene().tilt) < 0.002),
      "settles upright",
    );
    await page.keyboard.down("ArrowRight");
    await page.clock.runFor(350);
    assert(
      await page.evaluate(() => readScene().tilt > 0.16),
      "right tilt approaches +10deg",
    );
    await page.keyboard.up("ArrowRight");
    const inject = async (kind, y = 399) => {
      await page.evaluate(
        ({ kind, y }) => {
          const s = readScene();
          s.items.splice(0, s.items.length, {
            x: s.x,
            y,
            kind,
            icon:
              kind === "superstar"
                ? "🌟"
                : kind === "star"
                  ? "⭐"
                  : kind === "bomb"
                    ? "💣"
                    : "🍎",
            speed: 1000,
          });
        },
        { kind, y },
      );
      await page.clock.runFor(32);
    };
    for (const mode of ["EASY", "HARD"]) {
      if (mode === "HARD") {
        await page.reload();
        await page.selectOption("#difficulty", mode);
        await page.click("#start");
        await page.clock.runFor(100);
      }
      const before = await page.evaluate(() => readScene().remaining);
      await inject("superstar");
      const after = await page.evaluate(() => readScene().remaining);
      assert(
        after - before > 9.9 && after - before <= 10,
        "superstar extends by 10 seconds",
      );
      assert.equal(await page.locator("#score").textContent(), "30");
      assert(
        await page.evaluate(() =>
          readScene().labels.some((l) => l.text.includes("+10秒")),
        ),
      );
      await inject("star");
      assert.equal(await page.locator("#score").textContent(), "60");
      for (let i = 0; i < 8; i++) await inject("fruit");
      assert.equal(await page.evaluate(() => readScene().combo), 10);
      assert.equal(await page.locator("#score").textContent(), "190"); // 60 + 7*10 + 20 + 2*20 bonuses
      await inject("star");
      assert.equal(await page.locator("#score").textContent(), "250");
      await inject("bomb");
      assert.equal(await page.evaluate(() => readScene().combo), 0);
      assert.equal(await page.locator("#score").textContent(), "230");
      await inject("fruit");
      await inject("fruit", 520);
      assert.equal(
        await page.evaluate(() => readScene().combo),
        0,
        "miss resets combo",
      );
      await page.click("#pause");
      const t = await page.locator("#time").textContent();
      await page.clock.runFor(1000);
      assert.equal(await page.locator("#time").textContent(), t);
      await page.click("#start");
    }
    await page.setViewportSize({ width: 1000, height: 900 });
    await page.evaluate(() => {
      const s = readScene();
      s.items.splice(0, s.items.length, {
        x: 450,
        y: 200,
        kind: "superstar",
        icon: "🌟",
        speed: 0,
      });
    });
    await page.clock.runFor(32);
    await page.screenshot({
      path: "/tmp/catchstar-features.png",
      fullPage: true,
    });
    const timeLeft = await page.evaluate(() => readScene().remaining);
    await page.clock.runFor(Math.ceil(timeLeft * 1000) + 100);
    assert.equal(
      await page.evaluate(() => readScene().state),
      "ended",
      "extended round eventually ends",
    );
    await page.reload();
    await page.evaluate(() => {
      Math.random = () => 0.999;
    });
    await page.click("#start");
    await page.clock.runFor(400);
    assert(
      await page.evaluate(() =>
        readScene().items.some((item) => item.kind === "superstar"),
      ),
      "rare roll spawns a superstar",
    );
    await page.clock.runFor(20100);
    assert.equal(
      await page.evaluate(() => readScene().state),
      "ended",
      "missing superstars does not extend time",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: EASY/HARD +10s, normal star, combo/fever, bomb/miss reset, pause, left/right tilt and settling",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
