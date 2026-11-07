(() => {
  function createRenderer(canvas, getScene) {
    const ctx = canvas.getContext("2d");
    const stars = Array.from({ length: 65 }, (_, i) => ({
      x: (i * 137.5) % 900,
      y: (i * 73.1) % 350,
      r: i % 3 === 0 ? 1.8 : 1,
    }));
    function roundRect(a, b, w, h, r, fill) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(a, b, w, h, r);
      ctx.fill();
    }
    function drawSupporters(t) {
      for (let i = 0; i < 3; i++) {
        const cx = [110, 450, 785][i],
          cy = 328 + Math.sin(t * 0.004 + i * 2) * 6;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalAlpha = 0.24;
        ctx.filter = "saturate(0.25)";
        ctx.strokeStyle = "#ffe4b3";
        ctx.lineWidth = 4;
        const wave = Math.sin(t * 0.008 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(-23, 6);
        ctx.lineTo(-40, -10 + wave);
        ctx.moveTo(23, 6);
        ctx.lineTo(40, -10 - wave);
        ctx.stroke();
        ctx.font = '45px "Segoe UI Emoji",sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(["🍎", "🍊", "🍐"][i], 0, 0);
        ctx.fillStyle = "#30233c";
        for (const ex of [-7, 7]) {
          ctx.beginPath();
          ctx.arc(ex, 0, 2.3, 0, 7);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 5, 6, 0, Math.PI);
        ctx.strokeStyle = "#30233c";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }
    function draw(t) {
      const { state, items, x, tilt, particles, labels, combo, flash } =
        getScene();
      const g = ctx.createLinearGradient(0, 0, 0, 480);
      g.addColorStop(0, "#202b51");
      g.addColorStop(1, "#576383");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 900, 480);
      for (const s of stars) {
        ctx.globalAlpha = 0.45 + 0.4 * Math.sin(t * 0.001 + s.x);
        ctx.fillStyle = "#ffe4a7";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffe8b0";
      ctx.beginPath();
      ctx.arc(777, 73, 29, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#283456";
      ctx.beginPath();
      ctx.arc(789, 64, 26, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#354662";
      ctx.beginPath();
      ctx.moveTo(0, 405);
      ctx.quadraticCurveTo(200, 310, 430, 410);
      ctx.quadraticCurveTo(650, 330, 900, 390);
      ctx.lineTo(900, 480);
      ctx.lineTo(0, 480);
      ctx.fill();
      ctx.fillStyle = "#273b50";
      ctx.beginPath();
      ctx.moveTo(0, 440);
      ctx.quadraticCurveTo(240, 380, 520, 445);
      ctx.quadraticCurveTo(700, 395, 900, 438);
      ctx.lineTo(900, 480);
      ctx.lineTo(0, 480);
      ctx.fill();
      drawSupporters(t);
      ctx.font = '34px "Segoe UI Emoji",sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const a of items) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(Math.sin(t * 0.003 + a.x) * 0.15);
        if (a.kind === "superstar") {
          ctx.shadowColor = "#98fff2";
          ctx.shadowBlur = 18 + 6 * Math.sin(t * 0.008);
          ctx.scale(1.3, 1.3);
        }
        ctx.fillText(a.icon, 0, 0);
        if (a.kind === "superstar") {
          ctx.shadowBlur = 0;
          ctx.font = "bold 11px sans-serif";
          ctx.fillStyle = "#c4fff5";
          ctx.fillText("+10秒", 0, -27);
        }
        ctx.restore();
      }
      ctx.save();
      ctx.translate(x, 415);
      ctx.rotate(tilt);
      ctx.strokeStyle = "#ffd599";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 26, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#d99a60";
      ctx.beginPath();
      ctx.moveTo(-48, -3);
      ctx.lineTo(48, -3);
      ctx.lineTo(36, 43);
      ctx.quadraticCurveTo(0, 53, -36, 43);
      ctx.closePath();
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = "#b77748";
      ctx.lineWidth = 3;
      for (let a = -60; a < 70; a += 13) {
        ctx.beginPath();
        ctx.moveTo(a, -3);
        ctx.lineTo(a + 14, 50);
        ctx.stroke();
      }
      for (let y = 9; y < 49; y += 11) {
        ctx.beginPath();
        ctx.moveTo(-50, y);
        ctx.lineTo(50, y);
        ctx.stroke();
      }
      ctx.restore();
      roundRect(-51, -7, 102, 11, 5, "#ffe0a3");
      ctx.restore();
      for (const p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (const l of labels) {
        ctx.globalAlpha = Math.min(1, l.life * 2);
        ctx.font = "bold 23px sans-serif";
        ctx.fillStyle = l.color;
        ctx.fillText(l.text, l.x, l.y);
      }
      ctx.globalAlpha = 1;
      if (combo >= 2 && state === "playing") {
        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = "#ffe0a3";
        ctx.fillText(
          combo + (combo >= 10 ? " COMBO · FEVER ×2" : " COMBO"),
          Math.max(110, Math.min(790, x)),
          350,
        );
        const progress = Math.min(combo / 10, 1);
        roundRect(x - 45, 366, 90, 5, 2, "#273b50");
        roundRect(
          x - 45,
          366,
          90 * progress,
          5,
          2,
          combo >= 10 ? "#98fff2" : "#ffe0a3",
        );
      }
      if (flash > 0) {
        ctx.fillStyle = "rgba(255,100,100," + flash * 0.25 + ")";
        ctx.fillRect(0, 0, 900, 480);
      }
    }

    return draw;
  }

  window.StarCatch.createRenderer = createRenderer;
})();
