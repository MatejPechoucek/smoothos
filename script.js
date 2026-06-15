// ---------- Window manager ----------
// Convention-based: any .window is draggable + raisable.
// Any [data-close] closes its parent window. Any [data-open="id"] opens that window.
// New apps need only HTML — no JS edits.

var zCounter = 10;
function bringToFront(element) {
  zCounter += 1;
  element.style.zIndex = zCounter;
}

function closeWindow(element) {
  element.classList.remove("opening");
  element.classList.add("closing");
  setTimeout(function () {
    element.style.display = "none";
    element.classList.remove("closing");
  }, 320);
  removeDockChip(element); // close also clears any dock chip
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

// Drag a window by its .windowheader.
function makeDraggable(element) {
  var initialX = 0, initialY = 0, currentX = 0, currentY = 0;
  var handle = element.querySelector(".windowheader") || element;

  handle.onmousedown = startDragging;

  function startDragging(e) {
    e = e || window.event;
    e.preventDefault();
    initialX = e.clientX;
    initialY = e.clientY;
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
  }

  function stopDragging() {
    element.classList.remove("dragging");
    document.onmouseup = null;
    document.onmousemove = null;
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