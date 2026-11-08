const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await browser.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.route("**/js/rendering.js", async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        body:
          (await response.text()) +
          `\nconst renderer=StarCatch.createRenderer;StarCatch.createRenderer=(canvas,getScene)=>{window.readScene=getScene;return renderer(canvas,getScene)};`,
      });
    });
    await p.addInitScript(() => {
      let first = true;
      Math.random = () => {
        if (first) {
          first = false;
          return 0.95;
        }
        return 0.5;
      };
    });
    await p.clock.install({ time: new Date("2026-11-08T00:00:00Z") });
    await p.clock.pauseAt(new Date("2026-11-08T00:00:01Z"));
    await p.goto(process.env.TEST_URL || "http://127.0.0.1:8000");
    assert.equal(await p.locator("#time,.stats,.eyebrow").count(), 0);
    assert.equal(await p.locator(".stage #score").count(), 1);
    assert.equal(await p.locator(".stage #stageTime").count(), 1);
    assert.equal(await p.locator(".stage #best").count(), 0);
    const checkLayout = async () => {
      const boxes = await p.evaluate(() => {
        const rect = (s) => {
          const r = document.querySelector(s).getBoundingClientRect();
          return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
        };
        return {
          stage: rect(".stage"),
          score: rect(".score-hud"),
          clock: rect(".clock"),
          best: rect(".best-score"),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert(
        boxes.score.x < boxes.clock.x && boxes.score.right < boxes.clock.x,
      );
      assert(boxes.score.y >= boxes.stage.y && boxes.clock.y >= boxes.stage.y);
      assert(boxes.best.y >= boxes.stage.bottom);
      assert(!boxes.overflow);
    };
    for (const width of [1000, 390, 320]) {
      await p.setViewportSize({ width, height: 900 });
      await checkLayout();
    }
    const toggle = p.getByRole("switch", { name: "サウンド" });
    await toggle.focus();
    await p.keyboard.press("Space");
    assert.equal(await toggle.getAttribute("aria-checked"), "false");
    assert.equal(await p.locator("#soundState").textContent(), "OFF");
    await p.keyboard.press("Enter");
    assert.equal(await toggle.getAttribute("aria-checked"), "true");
    await p.setViewportSize({ width: 1000, height: 900 });
    await p.click("#start");
    await p.clock.runFor(300);
    const items = await p.evaluate(() => readScene().items);
    assert.equal(items.length, 3);
    assert(
      items.every(
        (i) =>
          i.kind === "star" && i.x === items[0].x && i.speed === items[0].speed,
      ),
    );
    assert.equal(items[0].y - items[1].y, 72);
    await p.clock.runFor(1200);
    await p.screenshot({ path: "/tmp/catchstar-triple.png", fullPage: true });
    await p.clock.runFor(2600);
    assert.equal(
      await p.locator("#score").textContent(),
      "120",
      "third collected star activates double points",
    );
    assert.equal(await p.evaluate(() => readScene().combo), 3);
    assert.match(await p.locator("#announce").textContent(), /三連星.*90点/);
    // Missing the whole column grants no points or extra time.
    await p.reload();
    await p.evaluate(() => (Math.random = () => 0.95));
    await p.click("#start");
    await p.clock.runFor(4300);
    assert.equal(await p.locator("#score").textContent(), "0");
    assert(await p.evaluate(() => readScene().remaining < 16));
    assert.deepEqual(errors, []);
    console.log(
      "PASS: compact HUD at 1000/390/320px, keyboard sound switch, vertical triple spawn, +90 collection and no reward on misses",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
