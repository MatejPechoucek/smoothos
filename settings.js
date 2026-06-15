

var SettingsMenu = (function () {
    
    function start(center) {
        stop();
    }

    function stop() {
        windowEl.classList.remove("playing");
        console.log("AimTrainer.stop()");
    }


    return { start: start, stop: stop };
})();