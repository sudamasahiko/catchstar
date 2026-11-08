(() => {
  // One roll controls the event, so superstar rarity is 1.8% and ministar rarity is 4%.
  function createDrop(rule, elapsed, random = Math.random) {
    const roll = random();
    const kind =
      roll >= 0.982
        ? "superstar"
        : roll >= 0.932
          ? "triple"
          : roll >= 0.892
            ? "ministar"
            : roll < rule.bomb
            ? "bomb"
            : roll < rule.star
              ? "star"
              : "fruit";
    const x = 45 + random() * 810;
    const speed = rule.speed + random() * 65 + elapsed * rule.accel;
    const count = kind === "triple" ? 3 : 1;
    const triple = count === 3 ? { caught: 0 } : undefined;
    const itemKind = kind === "triple" ? "star" : kind;
    const icon =
      itemKind === "superstar"
        ? "🌟"
        : itemKind === "ministar"
          ? "⭐"
          : itemKind === "bomb"
          ? "💣"
          : itemKind === "star"
            ? "⭐"
            : ["🍎", "🍊", "🍓", "🍐"][Math.floor(random() * 4)];
    return {
      items: Array.from({ length: count }, (_, i) => ({
        x,
        y: -28 - i * 72,
        kind: itemKind,
        icon,
        speed,
        triple,
      })),
      // Leave room for the whole column before the next drop.
      interval: rule.interval + random() * 0.12 + ((count - 1) * 72) / speed,
    };
  }
  window.StarCatch.createDrop = createDrop;
})();
