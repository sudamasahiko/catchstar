(() => {
  const { $ } = window.StarCatch;
  function createAudio(getState) {
    let muted = false,
      ac,
      musicTimer,
      noteIndex = 0;
    function tone(
      freq,
      duration = 0.12,
      type = "sine",
      volume = 0.12,
      delay = 0,
    ) {
      if (muted || !ac) return;
      const o = ac.createOscillator(),
        g = ac.createGain(),
        t = ac.currentTime + delay;
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(volume, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + duration);
      o.connect(g);
      g.connect(ac.destination);
      o.start(t);
      o.stop(t + duration + 0.02);
    }
    function effect(kind) {
      if (kind === "fruit") {
        tone(660);
        tone(880, 0.16, "sine", 0.1, 0.06);
      }
      if (kind === "superstar") {
        [523, 784, 1047, 1568, 2093].forEach((n, i) =>
          tone(n, 0.4, "triangle", 0.1, i * 0.08),
        );
      }
      if (kind === "star") {
        [784, 988, 1175, 1568].forEach((n, i) =>
          tone(n, 0.22, "sine", 0.1, i * 0.055),
        );
      }
      if (kind === "bomb") {
        tone(100, 0.3, "sawtooth", 0.1);
        tone(65, 0.35, "triangle", 0.2, 0.06);
      }
      if (kind === "start") {
        [523, 659, 784, 1047].forEach((n, i) =>
          tone(n, 0.2, "triangle", 0.13, i * 0.1),
        );
      }
      if (kind === "end") {
        [523, 659, 784, 1047, 1319].forEach((n, i) =>
          tone(n, 0.5, "triangle", 0.12, i * 0.12),
        );
      }
    }
    const tracks = [
      {
        tempo: 190,
        wave: "triangle",
        notes: [
          659, 0, 784, 880, 784, 659, 587, 523, 587, 0, 659, 784, 659, 587, 523,
          0, 659, 784, 1047, 988, 880, 784, 659, 587, 523, 587, 659, 784, 587,
          0, 523, 0,
        ],
        bass: [131, 175, 220, 196],
      },
      {
        tempo: 140,
        wave: "square",
        notes: [
          523, 659, 784, 659, 880, 784, 659, 587, 523, 523, 659, 784, 1047, 0,
          784, 0, 698, 880, 1047, 880, 784, 659, 587, 659, 784, 0, 659, 587,
          523, 0, 523, 0,
        ],
        bass: [131, 165, 175, 196],
      },
      {
        tempo: 270,
        wave: "sine",
        notes: [
          440, 523, 659, 880, 659, 523, 392, 494, 587, 784, 587, 494, 349, 440,
          523, 698, 523, 440, 330, 415, 494, 659, 494, 415,
        ],
        bass: [110, 98, 87, 82],
      },
    ];
    function music() {
      clearInterval(musicTimer);
      const track = tracks[Number($("bgm").value)];
      noteIndex = 0;
      musicTimer = setInterval(() => {
        if (getState() !== "playing") return;
        const n = noteIndex++,
          waltz = Number($("bgm").value) === 2,
          beat = waltz ? 3 : 4,
          note = track.notes[n % track.notes.length];
        if (note)
          tone(note, 0.24, track.wave, track.wave === "square" ? 0.023 : 0.05);
        if (n % beat === 0)
          tone(
            track.bass[Math.floor(n / (beat * 2)) % 4],
            0.4,
            "triangle",
            0.07,
          );
        if (n % beat !== 0)
          tone(
            track.bass[Math.floor(n / (beat * 2)) % 4] * 2,
            0.12,
            "sine",
            0.035,
          );
      }, track.tempo);
    }
    $("bgm").onchange = () => {
      audio();
      if (getState() === "playing" || getState() === "paused") music();
    };
    function audio() {
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        ac.resume().catch(() => {});
      } catch {}
    }
    $("sound").onclick = () => {
      muted = !muted;
      $("sound").textContent = "♫ サウンド " + (muted ? "OFF" : "ON");
      $("sound").setAttribute("aria-pressed", String(!muted));
      if (!muted) audio();
    };

    return {
      audio,
      effect,
      tone,
      music,
      stopMusic: () => clearInterval(musicTimer),
    };
  }

  window.StarCatch.createAudio = createAudio;
})();
