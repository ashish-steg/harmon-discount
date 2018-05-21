(function($) {
    $.fn.sessionManagement = function(sessionTime, callback) {
        (function() {
            var IDLE_TIMEOUT = sessionTime; //seconds
            var _idleSecondsCounter = 0;
            document.onclick = function() {
                _idleSecondsCounter = 0;
            };
            document.onmousemove = function() {
                _idleSecondsCounter = 0;
            };
            document.onkeypress = function() {
                _idleSecondsCounter = 0;
            };

            if (true) {
                var sesTimer = window.setInterval(CheckIdleTime, 1000);
            }

            function CheckIdleTime() {
                _idleSecondsCounter++;
                if (IDLE_TIMEOUT - _idleSecondsCounter == 0) {
                    callback();
                }

                if (_idleSecondsCounter >= IDLE_TIMEOUT) {
                    clearInterval(sesTimer);
                }
            }
        })();
    };
}(jQuery));
