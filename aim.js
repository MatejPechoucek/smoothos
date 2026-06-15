// ---------- Aim Trainer ----------
// Self-contained app module. script.js handles the window (drag/open/close);
// this file owns the game inside #aimtrainer's body.

var AimTrainer = (function () {
  // DOM the game cares about.
  var windowEl = document.getElementById("aimtrainer");
  var bodyEl   = windowEl ? windowEl.querySelector(".windowbody") : null;
  var startBtn = document.getElementById("startgame");

  // ----- config -----
  var GAME_SECONDS = 10;
  var TARGET_COUNT = 3;   // how many targets alive at once
  var TARGET_SIZE  = 44;  // px
  var PLAY_W = 840;       // must match .window.playing in style.css
  var PLAY_H = 680;
  var GAP = 24;

  // ----- game state -----
  var timeLeft = 0;
  var score = 0;
  var timerId = null;     // countdown setInterval handle
  var spawnDelay = null;  // setTimeout handle for first spawn
  var timerEl = null;     // countdown display
  var scoreEl = null;     // score display
  var gameEl = null;      // arena
  var resultEl = null;    // game-over panel
  var targets = [];       // live targets: { el, x, y, size }

  // ----- lifecycle -----

  function start(center) {
    stop(); // guard: clear any prior round before starting fresh (fix 7)

    windowEl.classList.add("playing");
    // Center vertically every round (initial + replay); horizontal stays put.
    // floor at 0 so a short viewport can't push it off the top edge.
    //var left = Math.max(0, (window.innerWidth  - PLAY_W) / 2);
    var top  = Math.max(0, (window.innerHeight - PLAY_H) / 2);
    //windowEl.style.left = left + "px";
    windowEl.style.top  = top + "px";

    // keep horizontal position, but pull back so the wider window doesn't
    // spill off the right/left edge. clamp current left into [0, maxLeft].
    var maxLeft = Math.max(GAP, window.innerWidth - PLAY_W - GAP); // 24px right gap
    var left = Math.min(Math.max(GAP, windowEl.offsetLeft), maxLeft);
    windowEl.style.left = left + "px";

    // HUD
    scoreEl = document.createElement("div");
    scoreEl.className = "aim-score";
    bodyEl.appendChild(scoreEl);

    timerEl = document.createElement("div");
    timerEl.className = "aim-timer";
    bodyEl.appendChild(timerEl);

    // arena
    gameEl = document.createElement("div");
    gameEl.className = "aim-game";
    bodyEl.appendChild(gameEl);

    // reset + start
    score = 0;
    timeLeft = GAME_SECONDS;
    renderScore();
    renderTimer();
    timerId = setInterval(tick, 1000);

    // Wait out the window resize transition before measuring the arena,
    // otherwise clientWidth/Height is ~0 and targets clump top-left (fix 6).
    spawnDelay = setTimeout(function () {
      for (var i = 0; i < TARGET_COUNT; i++) spawnTarget();
    }, 480);

    console.log("AimTrainer.start()");
  }

  function stop() {
    if (timerId !== null)    { clearInterval(timerId); timerId = null; }
    if (spawnDelay !== null)  { clearTimeout(spawnDelay); spawnDelay = null; }
    if (timerEl) { timerEl.remove(); timerEl = null; }
    if (scoreEl) { scoreEl.remove(); scoreEl = null; }
    if (gameEl)  { gameEl.remove();  gameEl = null; } // fix 2: tear down arena
    if (resultEl) { resultEl.remove(); resultEl = null; }
    targets = [];
    windowEl.classList.remove("playing");
    console.log("AimTrainer.stop()");
  }

  function tick() {
    timeLeft -= 1;
    renderTimer();
    if (timeLeft <= 0) endGame(); // time up → show result
  }

  // Time's up: tear down the round but keep the window open and show the score.
  function endGame() {
    if (timerId !== null)    { clearInterval(timerId); timerId = null; }
    if (spawnDelay !== null) { clearTimeout(spawnDelay); spawnDelay = null; }
    if (gameEl)  { gameEl.remove();  gameEl = null; }
    if (timerEl) { timerEl.remove(); timerEl = null; }
    if (scoreEl) { scoreEl.remove(); scoreEl = null; }
    targets = [];

    resultEl = document.createElement("div");
    resultEl.className = "aim-result";

    var title = document.createElement("h1");
    title.className = "aim-title";
    title.textContent = "Time!";

    var final = document.createElement("p");
    final.className = "aim-final";
    final.textContent = "Score: " + score;

    var again = document.createElement("button");
    again.className = "cta";
    again.textContent = "Play again";
    again.addEventListener("click", function () { start(false); }); // replay: no recenter

    resultEl.appendChild(title);
    resultEl.appendChild(final);
    resultEl.appendChild(again);
    bodyEl.appendChild(resultEl);
  }

  // ----- targets -----

  function spawnTarget() {
    var size = TARGET_SIZE;
    var pos = freePos(size, targets); // fix 5: avoid overlapping live targets
    var el = document.createElement("div");
    el.className = "target";
    el.style.width  = size + "px";
    el.style.height = size + "px";
    el.style.left = pos.x + "px";
    el.style.top  = pos.y + "px";

    var target = { el: el, x: pos.x, y: pos.y, size: size };
    el.addEventListener("click", function () { hit(target); }); // fix 4
    gameEl.appendChild(el);
    targets.push(target);
    return target;
  }

  function hit(target) {
    target.el.remove();
    var i = targets.indexOf(target);
    if (i !== -1) targets.splice(i, 1);
    score += 1;
    renderScore();
    spawnTarget(); // fix 3: respawn so count stays constant
  }

  // ----- geometry -----

  function randomPos(size) {
    var w = gameEl.clientWidth  - size;
    var h = gameEl.clientHeight - size;
    return { x: Math.random() * w, y: Math.random() * h };
  }

  function freePos(size, others) {
    for (var i = 0; i < 30; i++) {
      var p = randomPos(size);
      var clash = others.some(function (o) {
        return overlaps({ x: p.x, y: p.y, size: size }, o);
      });
      if (!clash) return p;
    }
    return randomPos(size); // give up after 30 tries, place anyway
  }

  function overlaps(a, b) {
    var ar = a.size / 2, br = b.size / 2;
    var ax = a.x + ar, ay = a.y + ar;
    var bx = b.x + br, by = b.y + br;
    var dx = ax - bx, dy = ay - by;
    var dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (ar + br + ar / 5); // small gap so they never touch
  }

  // ----- HUD render -----

  function renderTimer() { if (timerEl) timerEl.textContent = timeLeft + "s"; }
  function renderScore() { if (scoreEl) scoreEl.textContent = "Score: " + score; }

  // ----- wiring -----

  if (startBtn) {
    startBtn.addEventListener("click", function () { start(true); }); // first launch: center
  }

  if (windowEl) {
    var closeBtn = windowEl.querySelector("[data-close]");
    if (closeBtn) closeBtn.addEventListener("click", stop);
  }

  return { start: start, stop: stop };
})();
