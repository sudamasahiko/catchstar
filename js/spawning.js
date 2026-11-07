(() => {
  // One roll controls the event, so superstar rarity remains 1.2%.
  function createDrop(rule, elapsed, random = Math.random) {
    const roll = random();
    const kind =
      roll >= 0.988
        ? "superstar"
        : roll >= 0.938
          ? "triple"
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
