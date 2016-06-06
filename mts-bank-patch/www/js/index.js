(function(window, navigator, document, config, mtsPersistentStorage){

    /* Плагины начинаем использовать здесь */
    var initPlugins = function(){

        var onHandShake = function () {
            var handShakeEvent = new Event('handshake');
            document.dispatchEvent(handShakeEvent);
        };

        document.addEventListener('handShakerEnabled', function() {
            shake.startWatch(onHandShake, config.handShakeSensitivity);
        }, false);
        document.addEventListener('handShakerDisabled', function() {
            shake.stopWatch();
        }, false);

        /* Если плагин подключен, закрепляем портретную ориентацию */
        if (window.screen.lockOrientation) {
            window.screen.lockOrientation('portrait');
        }

        // Задействование датчика приближения
        if (navigator.proximity && config.enableProximitySensor) {
            navigator.proximity.enableSensor();

            var oldState = 0;
            var changeStateToCloseRequests = 0;
            var changeStateToCloseAttempts = 5; // Определяет задержку реакции на приближение в n*100 миллисек (100, 200, 300 и т.д.)
            setInterval(function(){
                navigator.proximity.getProximityState(function(state) {
                    if (state && (oldState !== state) && (++changeStateToCloseRequests % changeStateToCloseAttempts)) { return; }

                    if (oldState !== state) {
                        oldState = state;
                        var evt = new Event('proximitychange');
                        evt.proximityState = state;
                        document.dispatchEvent(evt);
                    }
                });
            }, 100);
        }


        if (window.plugins && window.plugins.appPreferences) {
            var prefs = window.plugins.appPreferences;

            // Установка в глоб. объект настроек "фич" пользователя
            for (var serviceName in config.clientServices) {
                prefs.fetch(
                    function(value) {
                        config.clientServices[serviceName] = value;
                    },
                    function(error) {
                        console.log(error);
                    },
                    serviceName
                );
            }

            // Установка в глоб. объект фона пользователя
            prefs.fetch (
                function(value) {
                    if (value) {
                        config.clientBackground = value;
                    } else {
                        // Если вычитали null, установим фон по умолчанию
                        prefs.store (
                            function() {console.log('saved bg')},
                            function(error) { console.log('background error: ' + error); },
                            'background',
                            config.clientBackground
                        );
                    }
                },
                function(error) {
                    console.log('background error: ' + error);
                    // Если не смогли вычитать, установим фон по умолчанию
                    prefs.store (
                        function() {console.log('saved bg')},
                        function(error) { console.log('background error: ' + error); },
                        'background',
                        config.clientBackground
                    );
                },
                'background'
            );

        }
    };

    var init = function(){
        mtsPersistentStorage.load().then(function(){
            angular.bootstrap(document, ['app']);
        });
    };

    var initOutputOfBackground = function() {
        document.addEventListener('pause', function() {
            var pauseApp = new Event('pauseApp');
            document.dispatchEvent(pauseApp);
        }, false);

        document.addEventListener('resume', function() {
            var resumeApp = new Event('resumeApp');
            document.dispatchEvent(resumeApp);
        }, false);
    };

    var onDeviceReady = function() {
        initPlugins();
        init();
        initOutputOfBackground();
    };

    var onDocumentReady = function() {
        init();
    };

    var bindEvents = function() {
        if (window.cordova) {
            document.addEventListener('deviceready', onDeviceReady, false);
        } else {
            angular.element(document).ready(onDocumentReady);
        }
    };

    var initialize = function() {
        bindEvents();
    };

    initialize();

})(window, navigator, document, window.AppConfig || {}, mtsPersistentStorage);
