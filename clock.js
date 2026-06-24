// ---------- Menu-bar clock ----------
// Self-contained module. Ticks #menubar-clock once a second. Visibility is the
// menu bar's job (body.clock-on, toggled by Settings); format is controlled by
// Settings via setFormat(). Exposed on window.Clock so settings.js can call it.
window.Clock = (function () {
  var el = document.getElementById("menubar-clock");
  var use24 = false;
  var timer = null;

  function render() {
    if (!el) return;
    var opts = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: !use24 };
    el.textContent = new Date().toLocaleTimeString([], opts);
  }

  // Settings calls this on load and whenever the 24-hour toggle changes.
  function setFormat(is24) {
    use24 = !!is24;
    render();
  }

  // Tick every second. Always running; cheap, and the bar may be hidden anyway.
  if (el) {
    render();
    timer = setInterval(render, 1000);
  }

  return { setFormat: setFormat };
})();
