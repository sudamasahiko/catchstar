import { $ } from "./dom.js";
export function createRankings() {
  let best = 0,
    rankings = { EASY: [], HARD: [] };
  try {
    const data = JSON.parse(localStorage.getItem("starcatch-rankings-v2"));
    for (const m of ["EASY", "HARD"])
      if (Array.isArray(data?.[m]))
        rankings[m] = data[m]
          .filter(
            (r) =>
              Number.isFinite(r.score) &&
              r.score >= 0 &&
              typeof r.date === "string",
          )
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
    const legacy = Number(localStorage.getItem("starcatch-best"));
    if (!rankings.EASY.length && legacy > 0)
      rankings.EASY.push({ score: legacy, date: "以前の記録" });
  } catch {}
  function renderRanks() {
    for (const m of ["EASY", "HARD"]) {
      const list = $(m === "EASY" ? "rankEasy" : "rankHard");
      list.replaceChildren();
      if (!rankings[m].length) {
        const li = document.createElement("li");
        li.textContent = "まだ記録がありません";
        list.appendChild(li);
      }
      for (const r of rankings[m]) {
        const li = document.createElement("li");
        li.textContent = r.score + "点 · " + r.date;
        list.appendChild(li);
      }
    }
    best = rankings[$("difficulty").value]?.[0]?.score || 0;
    $("best").textContent = best;
  }
  renderRanks();
  $("export").onclick = () => {
    const blob = new Blob(
        [
          JSON.stringify(
            { game: "ほしぞらキャッチ", version: 2, rankings },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "ほしぞらキャッチ-ランキング.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("difficulty").onchange = () => {
    $("difficultyHelp").textContent =
      $("difficulty").value === "EASY"
        ? "EASY：ゆっくり・爆弾少なめ"
        : "HARD：速い・爆弾多め";
    renderRanks();
  };

  function recordScore(mode, score) {
    const record = score > best;
    if (record) {
      best = score;
      try {
        localStorage.setItem("starcatch-best", String(best));
      } catch {}
    }
    rankings[mode].push({ score, date: new Date().toLocaleString("ja-JP") });
    rankings[mode].sort((a, b) => b.score - a.score);
    rankings[mode] = rankings[mode].slice(0, 3);
    try {
      localStorage.setItem("starcatch-rankings-v2", JSON.stringify(rankings));
    } catch {
      $("saveStatus").textContent =
        "ブラウザに保存できませんでした。JSONで保存してください。";
    }
    renderRanks();
    return record;
  }
  return { recordScore };
}
