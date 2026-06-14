// ---------- Aim Trainer ----------
// Self-contained app module. script.js handles the window (drag/open/close);
// this file owns the game inside #aimtrainer's body.
// Logic is stubbed — only the wiring to script.js / the DOM lives here.

var AimTrainer = (function () {
  // DOM the game cares about.
  var windowEl = document.getElementById("aimtrainer");
  var bodyEl   = windowEl ? windowEl.querySelector(".windowbody") : null;
  var startBtn = document.getElementById("startgame");

  // ----- public hooks (called from wiring below / script.js if needed) -----

  function start() {
    // TODO: build arena, spawn targets, start timer + score.
    windowEl.classList.add("playing");
    // center AFTER class applied so offset sizes are the .playing size
    var w = windowEl.offsetWidth, h = windowEl.offsetHeight;
    windowEl.style.left = (window.innerWidth  - w) / 2 + "px";
    windowEl.style.top  = (window.innerHeight - h) / 2 + "px";
    console.log("AimTrainer.start()");
  }

  function stop() {
    // TODO: tear down arena, clear timers/listeners, reset state.
    windowEl.classList.remove("playing");
    console.log("AimTrainer.stop()");
  }

  // ----- wiring -----

  // "Let's go!" button starts the game.
  if (startBtn) {
    startBtn.addEventListener("click", start);
  }

  // Closing the window should stop the game (free timers/listeners).
  // script.js close button carries [data-close]; listen on the window's.
  if (windowEl) {
    var closeBtn = windowEl.querySelector("[data-close]");
    if (closeBtn) closeBtn.addEventListener("click", stop);
  }

  // Expose for manual control / future script.js calls.
  return { start: start, stop: stop };
})();
