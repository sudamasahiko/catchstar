(() => {
  // Three uninterrupted catches unlock double item points. The five-catch
  // bonus stays +20; bombs and missed collectibles break the streak.
  function resolveCatch(kind, combo) {
    if (kind === "bomb") return { points: -20, combo: 0, extraTime: 0 };
    const nextCombo = combo + 1;
    const base = kind === "fruit" ? 10 : 30;
    return {
      points: base * (nextCombo >= 3 ? 2 : 1) + (nextCombo % 5 === 0 ? 20 : 0),
      combo: nextCombo,
      extraTime: kind === "superstar" ? 10 : 0,
    };
  }
  // Preserve the original identity, so even bombs safely return after three seconds.
  function activateMiniStar(items, source, elapsed) {
    for (const item of items) {
      if ((item.kind === "fruit" || item.kind === "bomb" || item.originalKind) &&
          Math.hypot(item.x - source.x, item.y - source.y) <= 240) {
        if (!item.originalKind) {
          item.originalKind = item.kind;
          item.originalIcon = item.icon;
        }
        item.kind = "star";
        item.icon = "⭐";
        item.restoreAt = elapsed + 3;
      }
    }
  }
  function restoreMiniStars(items, elapsed) {
    for (const item of items) {
      if (item.originalKind && elapsed >= item.restoreAt) {
        item.kind = item.originalKind;
        item.icon = item.originalIcon;
        delete item.originalKind;
        delete item.originalIcon;
        delete item.restoreAt;
      }
    }
  }
  window.StarCatch.activateMiniStar = activateMiniStar;
  window.StarCatch.restoreMiniStars = restoreMiniStars;
  window.StarCatch.resolveCatch = resolveCatch;
})();
