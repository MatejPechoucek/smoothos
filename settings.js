// Settings app: owns all appearance/system state, applies it to the OS live, and
// persists to localStorage. Self-wiring IIFE (script.js doesn't call modules), the
// same pattern as aim.js.
var SettingsMenu = (function () {

    var KEY = "smoothos.settings";
    var DEFAULTS = {
        wallpaper: "aurora",
        icon: "aurora",
        locked: true,        // colours linked by default
        accent: "#3b82f6",
        blur: 0,
        blobs: true,
        light: false,
        reduceMotion: false,
        glassBlur: 24,       // window frost strength (px)
        windowAlpha: 42,     // window opacity stored as percent (5–85)
        radius: 16,          // window corner radius (px)
        clock: false,        // show menu-bar clock
        clock24: false       // 24-hour time format
    };

    var THEMES = {
        aurora: {
            title: "Aurora",
            wallpaper: "radial-gradient(110% 85% at 18% 12%, rgba(164, 174, 255, 0.52), transparent 58%), radial-gradient(95% 80% at 82% 86%, rgba(104, 184, 170, 0.44), transparent 60%), linear-gradient(135deg, #192033 0%, #39415f 48%, #6b7a8f 100%)",
            icon: "linear-gradient(145deg, #7f8cc9, #5c8f9b)"
        },
        dusk: {
            title: "Dusk",
            wallpaper: "radial-gradient(110% 90% at 82% 16%, rgba(245, 197, 157, 0.45), transparent 58%), radial-gradient(100% 85% at 14% 84%, rgba(116, 86, 130, 0.5), transparent 62%), linear-gradient(135deg, #30283b 0%, #78637b 52%, #d1a58a 100%)",
            icon: "linear-gradient(145deg, #b38395, #d2a583)"
        },
        tide: {
            title: "Tide",
            wallpaper: "radial-gradient(100% 82% at 84% 18%, rgba(178, 221, 220, 0.5), transparent 58%), radial-gradient(115% 92% at 14% 90%, rgba(49, 84, 116, 0.58), transparent 62%), linear-gradient(135deg, #102636 0%, #2f6d7a 50%, #b7d5cf 100%)",
            icon: "linear-gradient(145deg, #2f7280, #a9d2cd)"
        },
        plum: {
            title: "Plum",
            wallpaper: "radial-gradient(105% 86% at 78% 20%, rgba(217, 174, 196, 0.46), transparent 58%), radial-gradient(110% 88% at 12% 88%, rgba(71, 59, 105, 0.6), transparent 62%), linear-gradient(135deg, #241e36 0%, #5d5278 52%, #d7acbf 100%)",
            icon: "linear-gradient(145deg, #655781, #d1a4bb)"
        },
        moss: {
            title: "Moss",
            wallpaper: "radial-gradient(105% 86% at 18% 14%, rgba(202, 213, 163, 0.48), transparent 58%), radial-gradient(105% 88% at 84% 86%, rgba(63, 102, 91, 0.58), transparent 62%), linear-gradient(135deg, #1f2c2b 0%, #647760 52%, #c7c392 100%)",
            icon: "linear-gradient(145deg, #657961, #c8c796)"
        },
        graphite: {
            title: "Graphite",
            wallpaper: "radial-gradient(100% 82% at 20% 18%, rgba(169, 180, 194, 0.32), transparent 58%), radial-gradient(110% 90% at 86% 84%, rgba(80, 94, 112, 0.44), transparent 62%), linear-gradient(135deg, #151923 0%, #343b49 52%, #788292 100%)",
            icon: "linear-gradient(145deg, #363e4c, #788292)"
        }
    };

    var root = document.documentElement;
    var body = document.body;
    var desktop = document.getElementById("desktop");
    var wallpapers = document.querySelectorAll(".wallpaper-swatch");
    var icons = document.querySelectorAll(".icon-swatch");
    var iconTiles = document.querySelectorAll(".icon-tile");
    var accents = document.querySelectorAll(".accent-dot");
    var settingInputs = document.querySelectorAll("[data-setting]");
    var lockBtn = document.getElementById("appearance-lock");
    var resetBtn = document.getElementById("settings-reset");
    var tabs = document.querySelectorAll(".settings-tab");
    var panels = document.querySelectorAll(".settings-panel");

    var state = load();

    // ---- persistence -------------------------------------------------------
    function load() {
        var s = {};
        for (var k in DEFAULTS) { s[k] = DEFAULTS[k]; }
        try {
            var saved = JSON.parse(localStorage.getItem(KEY));
            if (saved) {
                for (var j in saved) {
                    if (DEFAULTS.hasOwnProperty(j)) s[j] = saved[j];
                }
            }
        } catch (e) { /* corrupt/blocked storage -> defaults */ }
        normalize(s);
        return s;
    }

    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }

    function normalize(s) {
        if (!THEMES[s.wallpaper]) s.wallpaper = DEFAULTS.wallpaper;
        if (!THEMES[s.icon]) s.icon = DEFAULTS.icon;
        clampNum(s, "blur", 0, 36);
        clampNum(s, "glassBlur", 0, 40);
        clampNum(s, "windowAlpha", 5, 85);
        clampNum(s, "radius", 0, 28);
    }

    // Coerce s[key] to a number in [lo, hi]; fall back to default if NaN.
    function clampNum(s, key, lo, hi) {
        if (typeof s[key] !== "number" || isNaN(s[key])) s[key] = DEFAULTS[key];
        s[key] = Math.max(lo, Math.min(hi, s[key]));
    }

    // ---- apply state to the DOM -------------------------------------------
    function initThemeControls() {
        wallpapers.forEach(function (btn) {
            var theme = THEMES[btn.dataset.theme];
            if (!theme) return;
            btn.title = theme.title;
            btn.setAttribute("aria-label", theme.title + " wallpaper");
            btn.style.backgroundImage = theme.wallpaper;
        });
        icons.forEach(function (btn) {
            var theme = THEMES[btn.dataset.theme];
            if (!theme) return;
            btn.title = theme.title;
            btn.setAttribute("aria-label", theme.title + " icon color");
            btn.style.backgroundImage = theme.icon;
        });
    }

    // Ring the swatch in `list` whose data-theme matches; return it.
    function ring(list, theme) {
        var chosen = null;
        list.forEach(function (btn) {
            var on = btn.dataset.theme === theme;
            btn.classList.toggle("is-selected", on);
            if (on) chosen = btn;
        });
        return chosen;
    }

    function syncControls() {
        settingInputs.forEach(function (el) {
            var key = el.dataset.setting;
            if (el.type === "checkbox") el.checked = !!state[key];
            else el.value = state[key];
        });
    }

    function apply() {
        ring(wallpapers, state.wallpaper);
        var wallpaperTheme = THEMES[state.wallpaper] || THEMES[DEFAULTS.wallpaper];
        root.style.setProperty("--wallpaper", wallpaperTheme.wallpaper);

        var ic = ring(icons, state.icon);
        var iconTheme = THEMES[state.icon] || THEMES[DEFAULTS.icon];
        if (ic) iconTiles.forEach(function (tile) {
            tile.style.backgroundImage = iconTheme.icon;
        });

        root.style.setProperty("--accent", state.accent);
        accents.forEach(function (dot) {
            dot.classList.toggle("is-selected", dot.dataset.accent === state.accent);
        });

        root.style.setProperty("--wallpaper-blur", state.blur + "px");
        root.style.setProperty("--blob-blur", (80 + state.blur) + "px");

        root.style.setProperty("--glass-blur", state.glassBlur + "px");
        root.style.setProperty("--window-alpha", (state.windowAlpha / 100).toFixed(2));
        root.style.setProperty("--window-radius", state.radius + "px");

        desktop.classList.toggle("blobs-off", !state.blobs);
        body.classList.toggle("light", state.light);
        body.classList.toggle("reduce-motion", state.reduceMotion);

        body.classList.toggle("clock-on", state.clock);
        if (window.Clock) window.Clock.setFormat(state.clock24);

        if (lockBtn) {
            lockBtn.classList.toggle("is-locked", state.locked);
            lockBtn.setAttribute("aria-pressed", state.locked);
        }

        syncControls();
    }

    // ---- wiring ------------------------------------------------------------
    wallpapers.forEach(function (btn) {
        btn.addEventListener("click", function () {
            state.wallpaper = btn.dataset.theme;
            if (state.locked) state.icon = btn.dataset.theme;  // lock mirrors to icon
            apply(); save();
        });
    });

    icons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            state.icon = btn.dataset.theme;
            if (state.locked) state.wallpaper = btn.dataset.theme;
            apply(); save();
        });
    });

    accents.forEach(function (dot) {
        dot.addEventListener("click", function () {
            state.accent = dot.dataset.accent;
            apply(); save();
        });
    });

    // Generic checkbox/range controls (blobs, blur, light, reduceMotion).
    settingInputs.forEach(function (el) {
        var evt = el.type === "range" ? "input" : "change";
        el.addEventListener(evt, function () {
            var key = el.dataset.setting;
            state[key] = el.type === "checkbox" ? el.checked : Number(el.value);
            normalize(state);
            apply(); save();
        });
    });

    if (lockBtn) {
        lockBtn.addEventListener("click", function () {
            state.locked = !state.locked;
            if (state.locked) state.icon = state.wallpaper;
            apply(); save();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", function () {
            for (var k in DEFAULTS) { state[k] = DEFAULTS[k]; }
            apply(); save();
        });
    }

    // Tabs: activate the clicked tab + the panel whose data-panel matches.
    tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            tabs.forEach(function (t) { t.classList.remove("active"); });
            panels.forEach(function (p) { p.classList.remove("active"); });
            tab.classList.add("active");
            panels.forEach(function (p) {
                if (p.dataset.panel === tab.dataset.tab) p.classList.add("active");
            });
        });
    });

    // Reflect persisted/default state immediately on load.
    initThemeControls();
    apply();

    function start() {}
    function stop() {}

    return { start: start, stop: stop };

})();
