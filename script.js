// ---------- Window manager ----------
// Convention-based: any .window is draggable + raisable.
// Any [data-close] closes its parent window. Any [data-open="id"] opens that window.
// New apps need only HTML — no JS edits.

var zCounter = 10;
var focusedWin = null; // the window that currently has focus (for keyboard shortcuts)

function bringToFront(element) {
  zCounter += 1;
  element.style.zIndex = zCounter;
  setFocus(element); // raising a window also focuses it
}

// Mark `element` as the focused window; dim the rest. The single source of
// truth for "active window", used by focus styling and keyboard shortcuts.
function setFocus(element) {
  if (focusedWin === element) return;
  document.querySelectorAll(".window.is-focused").forEach(function (w) {
    w.classList.remove("is-focused");
  });
  if (element) element.classList.add("is-focused");
  focusedWin = element;
}

function closeWindow(element) {
  element.classList.remove("opening");
  element.classList.add("closing");
  setTimeout(function () {
    element.style.display = "none";
    element.classList.remove("closing");
  }, 320);
  removeDockChip(element); // close also clears any dock chip
  if (focusedWin === element) setFocus(null);
}

function openWindow(element) {
  element.style.display = "flex";
  element.classList.remove("closing");
  void element.offsetWidth; // force reflow so anim restarts each open
  element.classList.add("opening");
  bringToFront(element);
}

// Minimize: animate out, hide, drop a chip in the dock.
function minimizeWindow(element) {
  element.classList.remove("opening");
  element.classList.add("closing");
  setTimeout(function () {
    element.style.display = "none";
    element.classList.remove("closing");
  }, 320);
  addDockChip(element);
  if (focusedWin === element) setFocus(null);
}

// Restore from the dock.
function restoreWindow(element) {
  removeDockChip(element);
  openWindow(element);
}

// Maximize: toggle full-screen (minus a gap). Inline geometry stays underneath,
// so toggling off restores the window's previous size/position for free.
function maximizeWindow(element) {
  element.classList.toggle("maximized");
  bringToFront(element);
}

// ----- Dock -----
var dock = document.getElementById("dock");

function addDockChip(win) {
  if (dock.querySelector('[data-for="' + win.id + '"]')) return; // already docked
  var title = win.querySelector(".headertext");
  var chip = document.createElement("div");
  var chipbutton = document.createElement("button");
  var chipclose = document.createElement("button");
  chip.className = "dock-chip";
  chip.dataset.for = win.id;
  chipbutton.className = "chip-restore";
  chipbutton.textContent = title ? title.textContent : win.id;
  chipbutton.addEventListener("click", function () { restoreWindow(win); });
  chipclose.className = "chip-close";
  chipclose.textContent = "×"; // ×
  chipclose.title = "Close";
  chipclose.addEventListener("click", function () { closeWindow(win); });
  chip.appendChild(chipbutton);
  chip.appendChild(chipclose);
  dock.appendChild(chip);
}

function removeDockChip(win) {
  var chip = dock.querySelector('[data-for="' + win.id + '"]');
  if (chip) chip.remove();
}

// Standard window chrome. Any .window missing a .windowheader gets the default
// traffic lights + centered title (from data-title). Write a custom header in
// the HTML to opt out. New apps need only: <div class="window" data-title="X">…body…</div>
function buildHeader(win) {
  if (win.querySelector(".windowheader")) return; // custom header already present
  var header = document.createElement("div");
  header.className = "windowheader";
  header.innerHTML =
    '<div class="traffic-lights">' +
      '<div class="closebutton" data-close title="Close"></div>' +
      '<div class="minimizebutton" data-minimize title="Minimize"></div>' +
      '<div class="maximizebutton" data-maximize title="Maximize"></div>' +
    '</div>' +
    '<p class="headertext"></p>' +
    '<span class="header-spacer"></span>';
  // textContent (not innerHTML) so a data-title can't inject markup
  header.querySelector(".headertext").textContent = win.dataset.title || win.id;
  win.insertBefore(header, win.firstChild);
}

// 8 resize handles: 4 edges + 4 corners. Each tagged with data-dir.
var RESIZE_DIRS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
function buildResizer(win) {
  if (win.querySelector(".resizehandle")) return;
  RESIZE_DIRS.forEach(function (dir) {
    var h = document.createElement("div");
    h.className = "resizehandle " + dir;
    h.dataset.dir = dir;
    win.appendChild(h);
  });
}

// ----- Snap-to-edge (shared across all windows) -----
// Drag a window's header to a viewport edge to tile it: top = maximize,
// left/right = half-screen. A translucent preview shows the target while dragging.
var SNAP_EDGE = 12; // px from the edge that arms a snap
var SNAP_GAP = 24;  // inset around tiled windows (matches .maximized)
var snapPreview = null;

function getSnapPreview() {
  if (!snapPreview) {
    snapPreview = document.createElement("div");
    snapPreview.id = "snap-preview";
    (document.getElementById("desktop") || document.body).appendChild(snapPreview);
  }
  return snapPreview;
}

function zoneFor(x, y) {
  if (y <= SNAP_EDGE) return "max";
  if (x <= SNAP_EDGE) return "left";
  if (x >= window.innerWidth - SNAP_EDGE) return "right";
  return null;
}

function rectFor(zone) {
  var g = SNAP_GAP, W = window.innerWidth, H = window.innerHeight;
  if (zone === "max") return { left: g, top: g, width: W - g * 2, height: H - g * 2 };
  var halfW = (W - g * 3) / 2; // gap at both ends + a gap between halves
  if (zone === "left")  return { left: g,             top: g, width: halfW, height: H - g * 2 };
  if (zone === "right") return { left: g * 2 + halfW, top: g, width: halfW, height: H - g * 2 };
  return null;
}

function showSnapPreview(zone) {
  var p = getSnapPreview();
  if (!zone) { p.style.display = "none"; return; }
  var r = rectFor(zone);
  p.style.left = r.left + "px";
  p.style.top = r.top + "px";
  p.style.width = r.width + "px";
  p.style.height = r.height + "px";
  p.style.display = "block";
}

function applySnap(element, zone) {
  if (!zone) return;
  // remember pre-snap geometry once so the window can pop back later
  if (!element.classList.contains("snapped") && !element.classList.contains("maximized")) {
    element.dataset.snapW = element.offsetWidth;
    element.dataset.snapH = element.offsetHeight;
  }
  if (zone === "max") {
    element.classList.remove("snapped");
    element.classList.add("maximized"); // reuse the maximize geometry
  } else {
    var r = rectFor(zone);
    element.classList.remove("maximized");
    element.classList.add("snapped");
    element.style.left = r.left + "px";
    element.style.top = r.top + "px";
    element.style.width = r.width + "px";
    element.style.height = r.height + "px";
  }
}

// Pull a snapped/maximized window back to its saved size, repositioned so the
// header stays under the cursor. Returns true if it actually un-snapped.
function unsnap(element, mouseX) {
  var isSnap = element.classList.contains("snapped");
  var isMax = element.classList.contains("maximized");
  if (!isSnap && !isMax) return false;
  var curLeft = element.offsetLeft, curWidth = element.offsetWidth;
  var frac = curWidth ? (mouseX - curLeft) / curWidth : 0.5;

  var targetW;
  if (isSnap) {
    var w = parseFloat(element.dataset.snapW);
    var h = parseFloat(element.dataset.snapH);
    element.classList.remove("snapped");
    if (w) element.style.width = w + "px";
    if (h) element.style.height = h + "px";
    targetW = w || element.offsetWidth;
  } else {
    element.classList.remove("maximized"); // underlying inline size restores
    targetW = element.offsetWidth;          // read after reflow
  }
  element.style.left = (mouseX - frac * targetW) + "px";
  return true;
}

// Drag a window by its .windowheader.
function makeDraggable(element) {
  var initialX = 0, initialY = 0, currentX = 0, currentY = 0, dragZone = null;
  var handle = element.querySelector(".windowheader") || element;

  handle.onmousedown = startDragging;

  function startDragging(e) {
    e = e || window.event;
    e.preventDefault();
    unsnap(element, e.clientX); // a tiled/maximized window comes free when grabbed
    initialX = e.clientX;
    initialY = e.clientY;
    dragZone = null;
    element.classList.add("dragging"); // kill transition while dragging
    bringToFront(element);
    document.onmouseup = stopDragging;
    document.onmousemove = onDrag;
  }

  function onDrag(e) {
    e = e || window.event;
    e.preventDefault();
    currentX = initialX - e.clientX;
    currentY = initialY - e.clientY;
    initialX = e.clientX;
    initialY = e.clientY;
    element.style.top = (element.offsetTop - currentY) + "px";
    element.style.left = (element.offsetLeft - currentX) + "px";
    dragZone = zoneFor(e.clientX, e.clientY);
    showSnapPreview(dragZone);
  }

  function stopDragging() {
    element.classList.remove("dragging");
    document.onmouseup = null;
    document.onmousemove = null;
    showSnapPreview(null);
    if (dragZone) applySnap(element, dragZone);
    dragZone = null;
  }
}

var MIN_W = 280, MIN_H = 200; // smallest a window may shrink to
function makeResizable(element) {
  var startX = 0, startY = 0, startWidth = 0, startHeight = 0, startLeft = 0, startTop = 0, dir = "";
  var handles = element.querySelectorAll(".resizehandle");
  if (!handles.length) return; // window opted out of resizing

  handles.forEach(function (handle) { handle.onmousedown = startResizing; });

  function startResizing(e) {
    e = e || window.event;
    e.preventDefault();
    e.stopPropagation();
    dir = this.dataset.dir; // which edge/corner was grabbed
    startX = e.clientX;
    startY = e.clientY;
    startWidth  = element.offsetWidth;
    startHeight = element.offsetHeight;
    startLeft = element.offsetLeft; // captured for w/n: anchor the opposite edge
    startTop  = element.offsetTop;
    element.classList.add("resizing"); // kill transition for live resize
    bringToFront(element);
    document.onmouseup = stopResizing;
    document.onmousemove = onResize;
  }

  function onResize(e) {
    e = e || window.event;
    e.preventDefault();
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;

    // East/South: grow toward the mouse, anchor stays put.
    if (dir.indexOf("e") !== -1) {
      element.style.width = Math.max(MIN_W, startWidth + dx) + "px";
    }
    if (dir.indexOf("s") !== -1) {
      element.style.height = Math.max(MIN_H, startHeight + dy) + "px";
    }
    // West/North: resize AND shift left/top so the far edge stays anchored.
    // Derive left/top from the clamped size so min-size doesn't drift the anchor.
    if (dir.indexOf("w") !== -1) {
      var w = Math.max(MIN_W, startWidth - dx);
      element.style.width = w + "px";
      element.style.left = (startLeft + (startWidth - w)) + "px";
    }
    if (dir.indexOf("n") !== -1) {
      var h = Math.max(MIN_H, startHeight - dy);
      element.style.height = h + "px";
      element.style.top = (startTop + (startHeight - h)) + "px";
    }
  }

  function stopResizing() {
    element.classList.remove("resizing");
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Wire every window: build default chrome, then draggable + raise on click.
document.querySelectorAll(".window").forEach(function (win) {
  buildHeader(win); // must run first so data-close/minimize/maximize exist below
  buildResizer(win);
  makeDraggable(win);
  makeResizable(win);
  win.addEventListener("mousedown", function () {
    bringToFront(win);
  });
  // Double-click the header (but not the traffic lights) toggles maximize.
  var header = win.querySelector(".windowheader");
  if (header) header.addEventListener("dblclick", function (e) {
    if (e.target.closest(".traffic-lights")) return;
    maximizeWindow(win);
  });
});

// Focus the welcome window on load so the desktop reads as intentional.
(function () {
  var welcome = document.getElementById("welcome");
  if (welcome && welcome.style.display !== "none") setFocus(welcome);
})();

// ----- Keyboard shortcuts (act on the focused window) -----
// Esc closes it (unless it traps Esc, e.g. the Calculator), Cmd/Ctrl+M minimizes,
// and double-click on a header maximizes (wired above).
document.addEventListener("keydown", function (e) {
  if (!focusedWin) return;
  var d = focusedWin.style.display;
  if (d === "none" || d === "") return; // not actually visible

  if (e.key === "Escape") {
    if (focusedWin.hasAttribute("data-trap-esc")) return; // app owns Esc
    e.preventDefault();
    closeWindow(focusedWin);
  } else if ((e.metaKey || e.ctrlKey) && (e.key === "m" || e.key === "M")) {
    e.preventDefault();
    minimizeWindow(focusedWin);
  }
});

// Wire every close button: closes its own window.
document.querySelectorAll("[data-close]").forEach(function (btn) {
  btn.addEventListener("click", function () {
    closeWindow(btn.closest(".window"));
  });
});

// Wire every opener: opens window whose id == data-open value.
document.querySelectorAll("[data-open]").forEach(function (opener) {
  opener.addEventListener("click", function () {
    var target = document.getElementById(opener.dataset.open);
    if (target) openWindow(target);
  });
});

// Wire every minimize button: minimizes window to dock.
document.querySelectorAll("[data-minimize]").forEach(function (minimizer) {
  minimizer.addEventListener("click", function () {
    minimizeWindow(minimizer.closest(".window"));
  });
});

// Wire every maximize button: toggles full-screen.
document.querySelectorAll("[data-maximize]").forEach(function (maximizer) {
  maximizer.addEventListener("click", function () {
    maximizeWindow(maximizer.closest(".window"));
  });
});