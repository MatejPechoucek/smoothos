// ---------- Clock in the top bar ----------
function tickClock() {
  var el = document.querySelector("#clock");
  var now = new Date();
  var h = String(now.getHours()).padStart(2, "0");
  var m = String(now.getMinutes()).padStart(2, "0");
  el.textContent = h + ":" + m;
}
tickClock();
setInterval(tickClock, 1000);

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
  }, 320);
}

function openWindow(element) {
  element.style.display = "flex";
  element.classList.remove("closing");
  void element.offsetWidth; // force reflow so anim restarts each open
  element.classList.add("opening");
  bringToFront(element);
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

// Wire every window: draggable + raise on click.
document.querySelectorAll(".window").forEach(function (win) {
  makeDraggable(win);
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
