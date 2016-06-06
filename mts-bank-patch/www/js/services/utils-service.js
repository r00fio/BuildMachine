/*
 * Сервис с методами общего применения для модуля app
 */
(function (config) {
    var module = angular.module('app');

    module.factory('utils', function() {
        var base64toBlob = function(base64str, contentType) {
            // decode base64 string, remove space for IE compatibility
            var binary = atob(base64str.replace(/\s/g, ''));

            // get binary length
            var len = binary.length;

            // create ArrayBuffer with binary length
            var buffer = new ArrayBuffer(len);

            // create 8-bit Array
            var view = new Uint8Array(buffer);

            // save unicode of binary data into 8-bit Array
            for (var i = 0; i < len; i++) {
                view[i] = binary.charCodeAt(i);
            }

            // create the blob object with content-type contentType
            return new Blob( [view], { type: contentType });
        };

        var saveAndOpenFile = function(fileName, fileData, mimeType) {
            if (fileName && fileData) {
                if (!mimeType) { mimeType = 'application/octet-stream'; }

                var blob = base64toBlob(fileData, mimeType);

                var platform = window.cordova && cordova.platformId ? cordova.platformId : 'browser';

                if (platform == 'browser') {
                    var fileURL = URL.createObjectURL(blob);
                    window.open(fileURL);
                } else if (platform == 'windowsphone') {
                    alert('Пока не научились записывать файлы и открывать их на WP');
                } else {
                    var directory;

                    if (platform == 'android') {
                        directory = cordova.file.externalDataDirectory;
                    } else {
                        directory = cordova.file.dataDirectory;
                    }

                    var gotDirectoryEntry = function (dir) {
                        dir.getFile(fileName, {create: true, exclusive: false}, gotFileEntry, fail);
                    };

                    var gotFileEntry = function (fileEntry) {
                        fileEntry.createWriter(gotFileWriter, fail);
                    };

                    var gotFileWriter = function (writer) {
                        writer.onwriteend = function (e) {
                            console.log('write is successful');
                            openFile();
                        };

                        writer.onerror = function (e) {
                            console.log('write is failed', e);
                        };

                        writer.write(blob);
                    };

                    var fail = function (error) {
                        console.log(error.code);
                    };

                    var openFile = function () {
                        cordova.plugins.fileOpener2.open(
                            directory + fileName,
                            mimeType,
                            {
                                error: function (e) {
                                    console.log('Error status: ' + e.status + ' - Error message: ' + e.message);
                                },
                                success: function () {
                                    console.log('file opened successfully');
                                }
                            }
                        );
                    };

                    window.resolveLocalFileSystemURL(directory, gotDirectoryEntry, fail);
                }

            }
        };

        var isEmpty = function(obj) {

            // null,  undefined, 0, empty string are "empty"
            if (!obj) return true;

            // Assume if it has a length property with a non-zero value
            // that that property is correct.
            if (obj.length > 0)    return false;
            if (obj.length === 0)  return true;

            // Otherwise, does it have any properties of its own?
            // Note that this doesn't handle
            // toString and valueOf enumeration bugs in IE < 9
            var hasOwnProperty = Object.prototype.hasOwnProperty;
            for (var key in obj) {
                if (hasOwnProperty.call(obj, key)) return false;
            }

            return true;
        };

        /* Преобразование строки в формате yyyy-MM-ddTHH:mm:ss.SSSZ в дату */
        var dateParser = function (value) {
            var a;
            if (typeof value === 'string') {
                a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/.exec(value);
                if (a) {
                    return new Date(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]);
                }
            }
            return value;
        };

        return {
            isString: function(obj) { return Object.prototype.toString.call(obj) === '[object String]'; },
            isObject: function(obj) { return Object.prototype.toString.call(obj) === '[object Object]'; },
            isArray: function(obj) { return Object.prototype.toString.call(obj) === '[object Array]'; },
            isIntVal: function(obj) { return !isNaN(parseInt(obj)); },
            isEmpty: isEmpty,
            /* Получить дату за вычетом календарного месяца от текущей даты */
            getDateCalendarMonthAgo: function() {
                var date = new Date();
                // Подсчитаем количество дней в предыдущем месяце
                var dayCount = 32 - new Date(date.getFullYear(), date.getMonth() - 1, 32).getDate();
                date.setDate(date.getDate() - dayCount + 1);
                return date;
            },
            /* Получить дату за вычетом месяца +1 день от текущей даты */
            getDateMonthAgo: function() {
                var date = new Date();
                date.setMonth(date.getMonth() - 1);
                date.setDate(date.getDate() + 1);
                return date;
            },
            base64toBlob: base64toBlob,
            saveAndOpenFile: saveAndOpenFile,
            dateParser: dateParser
        }
    });

    module.factory('sys', ['$http', '$window', '$q', '$templateCache', '$timeout', function($http, $window, $q, $templateCache, $timeout) {
        var platform = $window.cordova && cordova.platformId !== 'browser'
            ? (config.devicePlatform && config.devicePlatform.toString().match(/^(ios|android|windowsphone)$/i) ? config.devicePlatform : cordova.platformId)
            : config.defaultPlatform || 'browser';

        var getPlatform = function() {
            return platform;
        };

        var getTplByPlatform = function(tplFileName, explicitPlatform) {
            var defaultTplUrl = 'templates/default/' + tplFileName;
            var platformName = explicitPlatform ? explicitPlatform : getPlatform();
            var tplUrl = (getPlatform() === 'browser') ? defaultTplUrl : ('templates/' + platformName + '/' + tplFileName);

            return $http.get(tplUrl, {cache: $templateCache}).then(function(tpl) {
                return tpl.data;
            }).catch(function(){
                return $http.get(defaultTplUrl, {cache: $templateCache}).then(function(tpl) {
                    return tpl.data;
                }).catch(function(){
                    return '<div style="background:gray;color:white;width:100%;height:100%;text-align:center;padding-top:25px;">' +
                                'Для платформы "' + platformName + '" отсутствует шаблон "' + tplFileName + '"' +
                            '</div>';
                });
            });
        };

        var fw7App = null;
        //Для WP управление боковым меню свайпами лучше не включать
        var swipePanel = false;
        if (!config.adaptToWindowsphone) {
            swipePanel = getPlatform() === 'ios' ? 'left' : 'right';
        }
        var initFramework7 = function() {
            fw7App = new Framework7({
                tapHold: false,
                fastClicks: false,
                swipePanel: swipePanel,
                statusbarOverlay: false,
                swipePanelOnlyClose: true,
                //Только для IE
                swipePanelNoFollow: config.adaptToWindowsphone,
                //swipePanelThreshold: 25,
                //swipePanelActiveArea: 70,
                swipeout: !config.adaptToWindowsphone
            });
        };
        var getFramework7App = function() { return fw7App; };

        var clearWebViewCookies = function() {
            var deferred = $q.defer();

            // Плагин CookiesManager имеет смысл использовать только для тех платформ, для которых он реализован на данный момент
            if ($window.CookiesManager && $window.cordova && ($window.cordova.platformId === 'ios' ||
                $window.cordova.platformId === 'android' || $window.cordova.platformId === 'windows')) {
                CookiesManager.clear(
                    function(msg){
                        console.log("Clearing cookies: ", msg);
                        deferred.resolve(msg);
                    },
                    function(msg){
                        console.log("Clearing cookies: ", msg);
                        deferred.reject(msg);
                    }
                );
            } else {
                var msg = 'CookiesManager plugin is not installed';
                console.log("Clearing cookies: ", msg);
                deferred.resolve(msg);
            }

            return deferred.promise;
        };

        var accessKeyboardPlugin = $window.cordova && $window.cordova.plugins && $window.cordova.plugins.Keyboard; // Доступность плагина для Клавиатуры
        var closeNativeKeyboard = function() {
            if (accessKeyboardPlugin) {
                $window.cordova.plugins.Keyboard.close();
            }
        };

        var funcPromise = null;
        var buffer = function(func, delay){
            if (angular.isFunction(func)) {
                $timeout.cancel(funcPromise);
                funcPromise = $timeout(func, delay || 500);
            }
        };

        /* Для отладочных целей */
        var sleep = function(millis) {
            var date = new Date();
            var curDate = null;
            do { curDate = new Date(); }
            while(curDate-date < millis);
        };

        var background = config.clientBackground;
        var getBackground = function() {
            return background;
        };

        return {
            getPlatform: getPlatform,
            getTplByPlatform: getTplByPlatform,

            initFramework7: initFramework7,
            getFramework7App: getFramework7App,

            clearWebViewCookies: clearWebViewCookies,
            closeNativeKeyboard: closeNativeKeyboard,

            buffer: buffer,
            sleep: sleep,

            getBackground: getBackground
        };
    }]);

    module.factory('persistence', ['$window', function($window) {
        return {
            clear: function() { return $window.mtsPersistentStorage.clear(); },
            get: function(key){ return $window.mtsPersistentStorage.get(key); },
            put: function(key, value){ return $window.mtsPersistentStorage.put(key, value); },
            remove: function(key) { return $window.mtsPersistentStorage.remove(key); }
        };
    }]);

    module.factory('stateCache', ['$window', 'persistence', 'utils', function($window, persistence, utils) {
        var stateCache = persistence.get('stateCache');
        if (!utils.isObject(stateCache)) {
            persistence.put('stateCache', stateCache = {});
        } else {
            for (var prop in stateCache) {
                stateCache[prop] = new Date(stateCache[prop]);
            }
        }

        var updateLastVisit = function(stateName){
            stateCache[stateName] = new Date();
        };

        var getLastVisit = function(stateName){
            return stateCache[stateName];
        };

        return {
            updateLastVisit: updateLastVisit,
            getLastVisit: getLastVisit
        };
    }]);

    module.factory('geo', ['$q', function($q) {
        // Форматирование числа с отбивкой разрядов $thinsp; и разделителем запятой
        var toLocaleString = function(num) {
            num = num.toString();
            num = num.split('.');
            num[0] = num[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1\u2009');
            return num.join(',');
        };
        var getGeoPosition = function(options){
            options = angular.extend({enableHighAccuracy: true, timeout: 5000}, options); // Некоторые дефолтные значения, которые можно перекрыть
            var deferred = $q.defer();

            if (navigator.geolocation) {

                navigator.geolocation.getCurrentPosition(function(position){
                    deferred.resolve([position.coords.latitude, position.coords.longitude]);
                }, function(error){
                    var errText = null;
                    var errMsg = error.message ? ' (' + error.message + ')' : '';
                    switch (error.code) {
                        case 1: errText = 'Отказано в доступе к геолокации.' + errMsg; break;
                        case 2: errText = 'Местоположение недоступно.' + errMsg; break;
                        case 3: errText = 'Убедитесь, что геолокацая включена.' + errMsg; break;
                    }
                    console.warn(errText);
                    deferred.reject(errText);

                }, options);

            } else {
                var errText = 'Геолокация не поддерживается на устройстве';
                console.warn(errText);
                deferred.reject(errText);
            }

            return deferred.promise;
        };

        var toRadians = function(n){
            return n * Math.PI / 180;
        };

        // Формула Гаверсинусов
        var getHaversineDistance = function(coords1, coords2){
            var R = 6371000; // Радиус Земли в метрах

            var lat1 = toRadians(coords1[0]);
            var lng1 = toRadians(coords1[1]);

            var lat2 = toRadians(coords2[0]);
            var lng2 = toRadians(coords2[1]);

            var dLat = toRadians(coords1[0] - coords2[0]);
            var dLng = toRadians(coords1[1] - coords2[1]);

            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            var d = R * c;

            return Math.floor(d);
        };

        var formatDistanceM = function(distance) {
            if (!distance || isNaN(distance)) {
                return '';
            }

            return toLocaleString(distance) + ' м.';
        };

        var formatDistanceKm = function(distance) {
            if (!distance || isNaN(distance)) {
                return '';
            }

            distance = parseFloat((distance / 1000).toFixed(2), 10);
            distance = toLocaleString(distance) + ' км.';

            return distance;
        };

        var formatDistance = function(distance) {
            if (distance > 999) {
                return formatDistanceKm(distance);
            } else {
                return formatDistanceM(distance);
            }
        };

        return {
            getPosition: getGeoPosition,
            getHaversineDistance: getHaversineDistance,
            formatDistance: formatDistance,
            formatDistanceM: formatDistanceM,
            formatDistanceKm: formatDistanceKm
        };
    }]);

    module.factory('sslChecker', ['$q', '$window', function($q, $window) {
        var deferredStack = [];
        var isSslPinningPossible, isSslPinningOff;

        var checkServer = function() {
            if (!isSslPinningPossible) {
                initSsl();
            }
            var deferred = $q.defer();

            if (isSslPinningPossible === true) {
                checkCleverClient(deferred);
            } else if (isSslPinningPossible === false) {
                deferred.reject('Не удалось активировать SSL Pinning');
            } else if (isSslPinningOff) {
                deferred.resolve('SSL Pinning не задействован');
            } else {
                deferredStack.push(deferred);
            }

            return deferred.promise;
        };

        function initSsl() {
            if (!config.enableSslPinning) {
                $window.console.log('SSL Pinning отключен параметром enableSslPinning');
                isSslPinningOff = true;
            } else if (!angular.isObject($window && $window.CordovaHttpPlugin)) {
                $window.console.warn('Требуется плагин com.synconset.cordovaHTTP (https://github.com/Telerik-Verified-Plugins/SecureHTTP)');
                isSslPinningOff = true;
            } else {
                $window.CordovaHttpPlugin.enableSSLPinning(
                    true,
                    function (msg) {
                        $window.console.log('SSL Pinning успешно активирован');
                        isSslPinningPossible = true;
                        for (var i = 0; i < deferredStack.length; i++) {
                            checkCleverClient(deferredStack[i]);
                        }
                    },
                    function (msg) {
                        $window.console.warn('Не удалось активировать SSL Pinning. ' + msg);
                        isSslPinningPossible = false;
                    }
                );
            }
        }

        function checkCleverClient(deferred) {
            $window.CordovaHttpPlugin.post(
                config.cleverClientUrl,
                {}, // optional request params
                {}, // optional headers
                function(msg) {
                    $window.console.log('SSL Pinning OK for host ' + config.cleverClientUrl + '. Соединение защищено');
                    deferred.resolve('Соединение защищено');
                },
                function(msg) {
                    //500 SSL handshake failed - другой сертификат
                    //500 There was an error with the request - используется http вместо https или или сертификат самоподписанный
                    //0 The host could not be resolved - если нет сети
                    $window.console.warn('SSL Pinning Error: ' + msg.status + ' ' + msg.error + '. Соединение не защищено');
                    deferred.reject('Соединение не защищено');
                }
            );
        }

        return {
            checkServer: checkServer
        };
    }]);

    module.factory('authDialogs', ['$q', '$rootScope', '$window', '$ionicPopup', '$ionicModal', '$ionicLoading', '$ionicPlatform', '$timeout', 'sys', 'WebWorker', 'persistence',
    function($q, $rootScope, $window, $ionicPopup, $ionicModal, $ionicLoading, $ionicPlatform, $timeout, sys, WebWorker, persistence) {

        var promptIdx = 0;

        // Диалоговое окно по неактивности
        var showPasswordPrompt = function() {

            /* Запрет закрытия окна запроса кода при нажатии back */
            var unregister = $ionicPlatform.registerBackButtonAction(function() {}, 601);
            promptIdx++;

            //Для корректной работы при вызове из Worker'а
            var scope = $rootScope.$new(true);
            scope.data = {promptIdx: promptIdx, waiter: false};
            scope.onInputFocus = function(evt){
                evt.target.setSelectionRange(0, evt.target.value.length);
            };
            scope.onInputBlur = function(evt){
                evt.target.focus();
            };
            scope.$applyAsync();
            var params = {};
            params.type = 'login';
            params.login = persistence.get('login');
            var passwordErrors = 3;        // 3 попытки неправильного ввода, пока захардкожено

            var dlgPromise = $ionicPopup.show({
                scope: scope,
                cssClass: 'alert showInactivityPrompt_' + promptIdx,
                title: 'Превышено время неактивности приложения',
                template: '<div>Введите пароль</div>' +
                            '<div style="position:relative; overflow:hidden;" rs-waiter="data.waiter" rs-waiter-style="{top:\'1px\'}">' +
                                '<input input-clear-btn type="password" placeholder="Пароль" ng-model="data.pswd" autofocus ng-disabled="data.waiter===undefined" ng-blur="onInputBlur($event)" />' +
                        '</div>',
                buttons: [{
                    text: sys.getPlatform() === 'ios' ? 'Отмена' : 'Отменить',
                    onTap: function(evt){
                        unregister();
                        $rootScope.exit(false);
                    }
                }, {
                    text: 'Войти',
                    onTap: function(evt) {
                        evt.preventDefault(); // Запрет автозакрытия окна по кнопке "Войти"

                        if (!scope.data.pswd) {
                            return;
                        }

                        var popupButtons = angular.element('.showInactivityPrompt_' + scope.data.promptIdx + ' .popup-buttons');

                        popupButtons.attr('disabled', 'disabled');
                        scope.data.waiter = undefined;
                        params.password = scope.data.pswd;

                        WebWorker.invoke('checkCodeByResumeApp', params).then(
                            function(result) {
                                if (result && result.data) {
                                    unregister();
                                    dlgPromise.close();
                                } else {
                                    passwordErrors--;
                                    if (passwordErrors == 0) {
                                        unregister();
                                        dlgPromise.close();
                                        $rootScope.exit(false);
                                    } else {
                                        $timeout(function() {
                                            alert('Пароль введен неверно');
                                        });
                                    }
                                }
                            }
                        ).finally(function() {
                            popupButtons.removeAttr('disabled');
                            scope.data.waiter = false;
                        });
                    }
                }]
            });

            return dlgPromise;
        };

        var showShortCodePrompt = function() {
            var deferred = $q.defer();

            var scope = $rootScope.$new(true);
            scope.background = $rootScope.background;
            scope.promptText = 'Введите код быстрого доступа';
            scope.showResetButton = false;
            scope.showCancelButton = true;
            var params = {};

            $ionicModal.fromTemplateUrl('templates/shortCode.html', {
                scope: scope,
                hardwareBackButtonClose: false
            }).then(function (shortCodeModal) {
                scope.shortCodeModal = shortCodeModal;
                scope.shortCodeModal.show();
            });

            scope.checkTouchID = function() {
                $timeout(function() {
                    $window.fingerscanner.checkTouchID(
                        function(touchParams) {
                            params.type = 'touchID';
                            params.login = touchParams.login;
                            params.password = touchParams.password;
                            WebWorker.invoke('checkCodeByResumeApp', params).then(
                                function(result) {
                                    $ionicLoading.hide();
                                    if (result && result.data) {
                                        deferred.resolve();
                                        scope.shortCodeModal.hide();
                                    } else {
                                        scope.cancelShortCode();
                                    }
                                }
                            );
                        },
                        function(e) {
                            console.log('app.error: ' + e);
                        }
                    );
                }, 300);
            };

            // Проверяем на доступность touchId
            if (/^touchID$/.test(persistence.get('authMode')) && $window.fingerscanner) {
                $window.fingerscanner.checkSupportTouchID(
                    function(isTouchIdSupported) {
                        if (isTouchIdSupported) {
                            scope.hasTouchID = true;
                            scope.checkTouchID();
                            scope.$applyAsync();
                        }
                    },
                    function(err) {
                        console.log(err);
                    }
                );
            }

            scope.shortCodeArr = [];
            var shortCodeErrors = 3;        // 3 попытки неправильного ввода КК, пока захардкожено

            scope.pressButton = function($event) {
                var digit = $event.target.textContent || $event.target.innerText;
                if (/^\d$/.test(digit)) {
                    scope.shortCodeArr.push(digit);
                    if (scope.shortCodeArr.length == 4) {
                        codeWasEntered(scope.shortCodeArr.join(''));
                    }
                }
            };

            function codeWasEntered(shortCode) {
                $ionicLoading.show({
                    templateUrl: 'templates/' + sys.getPlatform() + '/loading.html'
                });
                params.type = 'shortCode';
                params.login = persistence.get('idShortCode');
                params.password = shortCode;
                WebWorker.invoke('checkCodeByResumeApp', params).then(
                    function(result) {
                        $ionicLoading.hide();
                        if (result && result.data) {
                            deferred.resolve();
                            scope.shortCodeModal.hide();
                        } else {
                            shortCodeErrors--;
                            scope.shortCodeArr = [];
                            if (shortCodeErrors == 0) {
                                scope.cancelShortCode();
                            } else {
                                $timeout(function() {
                                    alert('Короткий код введен неверно');
                                });
                            }
                        }
                    }
                );
            }

            scope.backspace = function(){
                scope.shortCodeArr.pop();
            };

            scope.cancelShortCode = function(){
                persistence.put('authMode', 'login');
                persistence.remove('idShortCode');
                persistence.remove('registeredTouchID');
                deferred.resolve();
                scope.shortCodeModal.hide();
                $rootScope.exit(false);
            };

            scope.$on('modal.shown', function () {
                $rootScope.showStatusBar(false);
            });

            scope.$on('modal.hidden', function () {
                $rootScope.showStatusBar(true);
            });

            scope.$applyAsync();

            return deferred.promise;
        };

        return {
            showPasswordPrompt: showPasswordPrompt,
            showShortCodePrompt: showShortCodePrompt
        };
    }]);

}(window.AppConfig));