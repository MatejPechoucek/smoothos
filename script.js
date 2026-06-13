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

// ---------- Draggable window ----------
// Make the welcome window draggable by its header.
dragElement(document.getElementById("welcome"));
dragElement(document.getElementById("aimtrainer"));

function dragElement(element) {
  var initialX = 0;
  var initialY = 0;
  var currentX = 0;
  var currentY = 0;

  var header = document.getElementById(element.id + "header");
  if (header) {
    header.onmousedown = startDragging;
  } else {
    element.onmousedown = startDragging;
  }

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

// Raise the clicked window above the others.
var zCounter = 10;
function bringToFront(element) {
  zCounter += 1;
  element.style.zIndex = zCounter;
}

// ---------- Open / Close window ----------
var welcomeScreen = document.querySelector("#welcome");
var aimTrainer = document.querySelector("#aimtrainer");

function closeWindow(element) {
  element.classList.remove("opening");
  element.classList.add("closing");
  // wait for the animation, then fully hide
  setTimeout(function () {
    element.style.display = "none";
  }, 320);
}

function openWindow(element) {
  element.style.display = "flex";
  element.classList.remove("closing");
  // force reflow so the animation restarts every open
  void element.offsetWidth;
  element.classList.add("opening");
  bringToFront(element);
}

// Buttons
var welcomeScreenClose  = document.querySelector("#welcomeclose");
var welcomeScreenClose2 = document.querySelector("#welcomeclose2");
var welcomeScreenOpen   = document.querySelector("#welcomeopen");
var aimTrainerClose     = document.querySelector("#aimclose");
var aimTrainerOpen      = document.querySelector("#aimopen");

welcomeScreenClose.addEventListener("click", function () {
  closeWindow(welcomeScreen);
});
welcomeScreenClose2.addEventListener("click", function () {
  closeWindow(welcomeScreen);
});
welcomeScreenOpen.addEventListener("click", function () {
  openWindow(welcomeScreen);
});
aimTrainerClose.addEventListener("click", function () {
  closeWindow(aimTrainer);
});
aimTrainerOpen.addEventListener("click", function () {
  openWindow(aimTrainer);
});