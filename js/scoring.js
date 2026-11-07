(() => {
  // Ten uninterrupted catches unlock double item points. The five-catch
  // bonus stays +20; bombs and missed collectibles break the streak.
  function resolveCatch(kind, combo) {
    if (kind === "bomb") return { points: -20, combo: 0, extraTime: 0 };
    const nextCombo = combo + 1;
    const base = kind === "fruit" ? 10 : 30;
    return {
      points: base * (nextCombo >= 10 ? 2 : 1) + (nextCombo % 5 === 0 ? 20 : 0),
      combo: nextCombo,
      extraTime: kind === "superstar" ? 10 : 0,
    };
  }
  window.StarCatch.resolveCatch = resolveCatch;
})();
