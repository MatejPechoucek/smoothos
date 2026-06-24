// ---------- Calculator ----------
// Self-contained app module. script.js handles the window (drag/open/close);
// this file owns the keypad + display inside #calculator's body. Same self-wiring
// IIFE pattern as aim.js / settings.js.
var Calculator = (function () {
  var windowEl  = document.getElementById("calculator");
  var displayEl = document.getElementById("calc-display");

  // ----- state -----
  // current   string shown on the display while typing.
  // previous  the stored left-hand operand (number) or null.
  // op        pending operator (+ - * /) or null.
  // overwrite true right after = or an operator: next digit replaces the display
  //           instead of appending.
  var current  = "0";
  var previous = null;
  var op       = null;
  var overwrite = false;
  var errored  = false;

  var MAX_LEN = 12; // digit cap so the display can't overflow the window

  // ----- input -----
  function inputDigit(d) {
    if (errored) clearAll();
    if (overwrite) { current = d; overwrite = false; }
    else if (current === "0") current = d;
    else if (current.replace("-", "").replace(".", "").length < MAX_LEN) current += d;
    render();
  }

  function inputDot() {
    if (errored) clearAll();
    if (overwrite) { current = "0."; overwrite = false; render(); return; }
    if (current.indexOf(".") === -1) { current += "."; render(); }
  }

  // Pick an operator. If one is already pending and we have fresh input, fold it
  // first so chains like 2 + 3 + 4 evaluate left to right.
  function setOp(nextOp) {
    if (errored) return;
    if (op !== null && !overwrite) compute();
    else previous = parseFloat(current);
    op = nextOp;
    overwrite = true;
  }

  function compute() {
    if (op === null || previous === null) return;
    var a = previous, b = parseFloat(current), r;
    switch (op) {
      case "+": r = a + b; break;
      case "-": r = a - b; break;
      case "*": r = a * b; break;
      case "/":
        if (b === 0) { showError(); return; }
        r = a / b; break;
      default: return;
    }
    current = format(r);
    previous = null;
    op = null;
    overwrite = true;
    render();
  }

  function clearAll() {
    current = "0"; previous = null; op = null; overwrite = false; errored = false;
    render();
  }

  function negate() {
    if (errored || current === "0") return;
    current = current.charAt(0) === "-" ? current.slice(1) : "-" + current;
    render();
  }

  function percent() {
    if (errored) return;
    current = format(parseFloat(current) / 100);
    overwrite = true;
    render();
  }

  function backspace() {
    if (errored) { clearAll(); return; }
    if (overwrite) return; // nothing to delete from a freshly-computed value
    if (current.length <= 1 || (current.length === 2 && current.charAt(0) === "-")) {
      current = "0";
    } else {
      current = current.slice(0, -1);
    }
    render();
  }

  // ----- output -----
  // Trim float noise, keep it inside MAX_LEN, never show "Infinity"/"NaN".
  function format(n) {
    if (!isFinite(n)) return "Error";
    var s = String(Math.round(n * 1e10) / 1e10);
    if (s.replace("-", "").replace(".", "").length > MAX_LEN) {
      s = n.toPrecision(MAX_LEN - 1);
      s = parseFloat(s) + ""; // drop trailing zeros from toPrecision
    }
    return s;
  }

  function showError() {
    current = "Error"; previous = null; op = null; overwrite = true; errored = true;
    render();
  }

  function render() { if (displayEl) displayEl.textContent = current; }

  // ----- dispatch -----
  function handleKey(key) {
    if (key === "clear") return clearAll();
    if (key === "negate") return negate();
    if (key === "percent") return percent();
    if (key === ".") return inputDot();
    if (key === "=") return compute();
    if (key === "+" || key === "-" || key === "*" || key === "/") return setOp(key);
    if (key >= "0" && key <= "9") return inputDigit(key);
  }

  // ----- wiring -----
  if (windowEl) {
    windowEl.querySelectorAll("[data-key]").forEach(function (btn) {
      btn.addEventListener("click", function () { handleKey(btn.dataset.key); });
    });
  }

  // Physical keyboard. Only act while the calculator window is open, so typing
  // into Settings or elsewhere is untouched. preventDefault only for consumed keys.
  document.addEventListener("keydown", function (e) {
    if (!windowEl || windowEl.style.display === "none" || windowEl.style.display === "") return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    var k = e.key;
    if (k >= "0" && k <= "9") { handleKey(k); }
    else if (k === ".") { handleKey("."); }
    else if (k === "+" || k === "-" || k === "*" || k === "/") { handleKey(k); }
    else if (k === "Enter" || k === "=") { handleKey("="); }
    else if (k === "Escape") { handleKey("clear"); }
    else if (k === "Backspace") { backspace(); }
    else if (k === "%") { handleKey("percent"); }
    else return; // not ours — let it through

    e.preventDefault();
  });

  function start() {}
  function stop() {}

  return { start: start, stop: stop };
})();
