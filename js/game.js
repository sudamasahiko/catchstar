import { bindControls } from "./controls.js";
import { $ } from "./dom.js";
import { createAudio } from "./audio.js";
import { createRankings } from "./rankings.js";
import { createRenderer } from "./rendering.js";
const canvas = $("game");
let mode = "EASY";
const rules = {
  EASY: {
    bomb: 0.1,
    star: 0.3,
    speed: 120,
    accel: 2.8,
    interval: 0.48,
    width: 67,
  },
  HARD: {
    bomb: 0.25,
    star: 0.39,
    speed: 225,
    accel: 5,
    interval: 0.28,
    width: 52,
  },
};
let state = "ready",
  score = 0,
  remaining = 20,
  elapsed = 0,
  spawn = 0,
  items = [],
  particles = [],
  labels = [],
  combo = 0,
  x = 450,
  keys = { left: false, right: false },
  last = 0,
  lastTick = 4,
  flash = 0;
const { audio, effect, tone, music, stopMusic } = createAudio(() => state);
const { recordScore } = createRankings();
const draw = createRenderer(canvas, () => ({
  state,
  combo,
  remaining,
  items,
  x,
  particles,
  labels,
  flash,
}));
function update() {
  $("score").textContent = score;
  $("time").textContent = remaining.toFixed(1) + "秒";
  $("time").style.color = remaining <= 5 ? "#ff9a96" : "";
  $("stageTime").textContent = remaining.toFixed(1) + "秒";
  $("clock").classList.toggle("urgent", remaining <= 5);
}
function start() {
  mode = $("difficulty").value;
  $("difficulty").disabled = true;
  audio();
  state = "playing";
  score = 0;
  remaining = 20;
  elapsed = 0;
  spawn = 0.25;
  items = [];
  particles = [];
  labels = [];
  combo = 0;
  x = 450;
  lastTick = 4;
  keys.left = keys.right = false;
  $("overlay").classList.add("hidden");
  $("pause").textContent = "Ⅱ";
  update();
  effect("start");
  music();
}
$("start").onclick = () => (state === "paused" ? togglePause() : start());
function togglePause() {
  if (state === "playing") {
    state = "paused";
    keys.left = keys.right = false;
    $("title").textContent = "ひとやすみ";
    $("description").innerHTML = "準備ができたら、続きをどうぞ。";
    $("icon").textContent = "🌙";
    $("start").textContent = "つづける";
    $("hint").textContent = "P キーでも再開できます";
    $("overlay").classList.remove("hidden");
    $("pause").textContent = "▶";
  } else if (state === "paused") {
    audio();
    state = "playing";
    $("overlay").classList.add("hidden");
    $("pause").textContent = "Ⅱ";
  }
}
$("pause").onclick = togglePause;
function finish() {
  if (state !== "playing") return;
  state = "ended";
  $("difficulty").disabled = false;
  stopMusic();
  keys.left = keys.right = false;
  const record = recordScore(mode, score);
  const good = score >= 150;
  $("icon").textContent = good ? "🎉 ⭐ 🎉" : "🧺 ✨";
  $("title").textContent = good ? "GOOD！ おみごと！" : "ナイスチャレンジ！";
  $("description").innerHTML =
    '<strong style="font-size:32px;color:#ffd17d">' +
    score +
    "点</strong><br>" +
    (record ? "自己ベスト更新！ " : "") +
    (good
      ? "夜空のごほうびをたっぷり集めたね。"
      : "次は150点を目指してみよう！");
  $("start").textContent = "もう一度あそぶ";
  $("hint").textContent = "果物を連続で取ると、5個ごとに＋20点！";
  $("overlay").classList.remove("hidden");
  $("announce").textContent =
    "ゲーム終了。" + score + "点。" + (good ? "GOOD！" : "");
  effect("end");
}
bindControls({
  canvas,
  keys,
  getState: () => state,
  start,
  togglePause,
  moveBasket: (value) => {
    x = value;
  },
});
function frame(t) {
  const dt = Math.min((t - last) / 1000 || 0, 0.05);
  last = t;
  if (state === "playing") {
    const step = Math.min(dt, remaining);
    remaining = Math.max(0, remaining - step);
    elapsed += step;
    x = Math.max(
      55,
      Math.min(
        845,
        x + ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 620 * step,
      ),
    );
    spawn -= step;
    if (spawn <= 0) {
      const r = Math.random(),
        rule = rules[mode],
        kind = r < rule.bomb ? "bomb" : r < rule.star ? "star" : "fruit";
      items.push({
        x: 45 + Math.random() * 810,
        y: -28,
        kind,
        icon:
          kind === "bomb"
            ? "💣"
            : kind === "star"
              ? "⭐"
              : ["🍎", "🍊", "🍓", "🍐"][Math.floor(Math.random() * 4)],
        speed: rule.speed + Math.random() * 65 + elapsed * rule.accel,
      });
      spawn = rule.interval + Math.random() * 0.12;
    }
    for (let i = items.length - 1; i >= 0; i--) {
      const a = items[i],
        old = a.y;
      a.y += a.speed * step;
      if (
        old < 415 &&
        a.y >= 400 &&
        a.y <= 445 &&
        Math.abs(a.x - x) < rules[mode].width
      ) {
        let delta = a.kind === "bomb" ? -20 : a.kind === "star" ? 30 : 10;
        if (a.kind === "bomb") {
          combo = 0;
          flash = 1;
        } else {
          combo++;
          if (combo % 5 === 0) delta += 20;
        }
        score = Math.max(0, score + delta);
        effect(a.kind);
        labels.push({
          x: a.x,
          y: 385,
          text:
            (delta > 0 ? "+" : "") +
            delta +
            (combo > 0 && combo % 5 === 0 ? " BONUS!" : ""),
          life: 1,
          color: delta < 0 ? "#ffacac" : "#ffe4a3",
        });
        for (let j = 0; j < 12; j++)
          particles.push({
            x: a.x,
            y: 410,
            vx: (Math.random() - 0.5) * 220,
            vy: -Math.random() * 180,
            r: 2 + Math.random() * 3,
            life: 1,
            color: delta < 0 ? "#ff9898" : "#ffdc8e",
          });
        items.splice(i, 1);
      } else if (a.y > 515) {
        if (a.kind !== "bomb") combo = 0;
        items.splice(i, 1);
      }
    }
    for (const p of particles) {
      p.x += p.vx * step;
      p.y += p.vy * step;
      p.vy += 240 * step;
      p.life -= step * 1.7;
    }
    particles = particles.filter((p) => p.life > 0);
    for (const l of labels) {
      l.y -= 40 * step;
      l.life -= step;
    }
    labels = labels.filter((l) => l.life > 0);
    flash = Math.max(0, flash - step * 3);
    if (remaining <= 3 && Math.ceil(remaining) < lastTick && remaining > 0) {
      lastTick = Math.ceil(remaining);
      tone(988, 0.08, "square", 0.045);
    }
    update();
    if (remaining <= 0) finish();
  }
  draw(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
