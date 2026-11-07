import { $ } from "./dom.js";
export function bindControls({
  canvas,
  keys,
  getState,
  start,
  togglePause,
  moveBasket,
}) {
  window.addEventListener("keydown", (e) => {
    if (["SELECT", "BUTTON", "INPUT"].includes(e.target?.tagName)) return;
    if (["ArrowLeft", "ArrowRight", " ", "p", "P"].includes(e.key)) {
      e.preventDefault();
      if (e.key === "ArrowLeft") keys.left = true;
      if (e.key === "ArrowRight") keys.right = true;
      if ((e.key === "p" || e.key === "P") && !e.repeat) togglePause();
      if (
        e.key === " " &&
        !e.repeat &&
        (getState() === "ready" || getState() === "ended")
      )
        start();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
  });
  window.addEventListener("blur", () => {
    keys.left = keys.right = false;
    if (getState() === "playing") togglePause();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && getState() === "playing") togglePause();
  });
  for (const dir of ["left", "right"]) {
    const b = $(dir);
    b.onpointerdown = (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      keys[dir] = true;
    };
    b.onpointerup =
      b.onpointercancel =
      b.onlostpointercapture =
        () => (keys[dir] = false);
  }
  let dragging = false;
  function move(e) {
    if (getState() === "playing")
      moveBasket(
        Math.max(
          55,
          Math.min(
            845,
            ((e.clientX - canvas.getBoundingClientRect().left) /
              canvas.getBoundingClientRect().width) *
              900,
          ),
        ),
      );
  }
  canvas.onpointerdown = (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    move(e);
  };
  canvas.onpointermove = (e) => {
    if (dragging) move(e);
  };
  canvas.onpointerup = canvas.onpointercancel = () => (dragging = false);
}
