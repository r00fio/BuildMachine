(function () {
    angular.module('app').factory('WebWorker', ['$q', '$state', '$rootScope', '$ionicPopup', '$ionicLoading', '$timeout', 'sslChecker', 'sys', 'persistence',
    function ($q, $state, $rootScope, $ionicPopup, $ionicLoading, $timeout, sslChecker, sys, persistence) {
        var worker;

        /* Все вызовы складываются в стеки пока не будет получен результат SSL Pinning */
        var isConnectionSecured;
        var invokeStack = [],  invokeDeferredStack = [], postMessageStack = [], postMessageOnSslPinningStack = [];

        var blockFunctionalityOnSslPinningFailure, sslPinningFailureText;

        var postMessageHandler;

        /**
         * Взвращает воркер
         */
        var get = function () {
            return worker;
        };

        /**
         * Отправка данных
         * @param cmd  - команда
         * @param cmdInfo  - униикальное имя для того, чтобы распознать команду
         * @param args - массив аргументов
         */
        var postMessage = function (cmd, cmdInfo, args) {
            if (hasNetwork()) {
                if (isConnectionSecured === true) {
                    worker.postMessage({
                        cmd: cmd,
                        cmdInfo: cmdInfo,
                        args: args
                    });
                } else {
                    if (isConnectionSecured === false) {
                        if (blockFunctionalityOnSslPinningFailure) {
                            if (angular.isFunction(postMessageHandler)) {
                                postMessageHandler({
                                    cmd: cmd,
                                    cmdInfo: cmdInfo,
                                    result: {code: 1099, msg: sslPinningFailureText}
                                });
                            }
                            if (!/^connect/.test(cmd)) {
                                sys.buffer(function () {
                                    alert(sslPinningFailureText, 'Обратите внимание!').then(function(){ $rootScope.goToAuthStateOnInsecureSsl(); });
                                });
                            }
                        } else {
                            // Чтобы одно и то же сообщение не выводить пачкой, если было несколько запросов подряд
                            postMessageOnSslPinningStack.push(arguments);
                            sys.buffer(function () {
                                confirm(sslPinningFailureText, 'Обратите внимание!', 'Принимаю риск').then(function(ok){
                                    if (ok) {
                                        isConnectionSecured = true;
                                        while(postMessageOnSslPinningStack.length) {
                                            postMessage.apply(this, postMessageOnSslPinningStack.shift());
                                        }
                                    } else {
                                        if (angular.isFunction(postMessageHandler)) {
                                            while(postMessageOnSslPinningStack.length) {
                                                var stackElem = postMessageOnSslPinningStack.shift();
                                                postMessageHandler({
                                                    cmd: stackElem[0],
                                                    cmdInfo: stackElem[1],
                                                    result: {code: 1099, msg: sslPinningFailureText}
                                                });
                                            }
                                        }
                                        $rootScope.goToAuthStateOnInsecureSsl();
                                    }
                                });
                            });
                        }
                    } else {
                        postMessageStack.push(arguments);
                    }
                }
            }
        };

        var deferredStack = {};
        var deferredUid = 0;

        var invokeDeferred = function(deferred, arguments){
            if (isConnectionSecured === true) {
                var cmd = arguments.length ? arguments[0] : undefined;
                var cmdInfo = new Date().getTime() + '.' + ++deferredUid;
                var args = [];
                for (var i = 1; i < arguments.length; i++) {
                    args.push(arguments[i]);
                }

                deferredStack[cmdInfo] = deferred;

                if (worker) {
                    worker.postMessage({cmd: cmd, cmdInfo: cmdInfo, args: args});
                } else {
                    var msgText = 'WebWorker is not initialized by method "startWorker()"';
                    console.warn(msgText);
                    deferred.reject({code: 1099, msg: msgText});
                }
            } else {
                if (isConnectionSecured === false) {
                    if (blockFunctionalityOnSslPinningFailure) {
                        deferred.reject({code: 1099, msg: sslPinningFailureText});
                        sys.buffer(function () {
                            alert(sslPinningFailureText, 'Обратите внимание!').then(function(){ $rootScope.goToAuthStateOnInsecureSsl(); });
                        });
                    } else {
                        // Чтобы одно и то же сообщение не выводить пачкой, если было несколько запросов подряд
                        invokeDeferredStack.push([deferred, arguments]);
                        sys.buffer(function () {
                            confirm(sslPinningFailureText, 'Обратите внимание!', 'Принимаю риск').then(function(ok){
                                if (ok) {
                                    isConnectionSecured = true;
                                    while(invokeDeferredStack.length) {
                                        var stackElem = invokeDeferredStack.shift();
                                        invokeDeferred.call(this, stackElem[0], stackElem[1]);
                                    }
                                } else {
                                    while(invokeDeferredStack.length) {
                                        invokeDeferredStack.shift()[0].reject({code: 1099, msg: sslPinningFailureText});
                                    }
                                    $rootScope.goToAuthStateOnInsecureSsl();
                                }
                            });
                        });
                    }
                } else {
                    deferred.reject({code: 1099, msg: sslPinningFailureText});
                }
            }
        };

        /**
         * Вызов серверного метода: invoke('cmd', param1, param2, ..., paramN);
         * @param cmd - имя функции
         * @param param1, param2, ..., paramN
         * @return promise
         */
        var invoke = function(cmd) {
            var deferred = $q.defer();
            if (!hasNetwork()) {
                deferred.reject({code: 1099, msg: ''}); // просто реджект, параметры не важны, хотя возможно отдельные запросы будут неадекватными
                return deferred.promise;
            } else if (angular.isDefined(isConnectionSecured)) {
                invokeDeferred(deferred, arguments);
            } else {
                invokeStack.push([deferred, arguments]);
            }

            return deferred.promise;
        };

        /**
         * Остановка воркера.
         */
        var stopWorker = function () {
            if (typeof(Worker) !== "undefined" && worker) {
                worker.terminate();
                worker = undefined;
            }
        };

        /**
         * Запуск воркера
         */
        var startWorker = function () {
            if (typeof(Worker) !== 'undefined') {
                console.log('init worker');
                if (typeof(worker) == 'undefined' && !worker) {
                    worker = new Worker('worker.js');
                    console.log('init worker success');
                    initSslCheck();
                }
            } else {
                $ionicPopup.alert({
                    title: 'Ошибка',
                    template: 'Извините, Ваше устройство не поддерживается.'
                });
                $ionicPopup.alert('Sorry! No Web Worker support.');
                console.log('Sorry! No Web Worker support.');
            }
        };

        var setFunction = function (processingResults) {
            postMessageHandler = processingResults;
            worker.onmessage = function (event) {
                try {
                    if (event.data) {
                        if (event.data.isDebug) {
                            console[event.data.type](event.data.message);
                            return;
                        }
                        if (isNotAvailableServer(event)) {
                            sys.buffer(function() {
                                alert('Попробуйте повторить позже', 'Сбой в работе системы');
                            });
                            $ionicLoading.hide();
                        } else if (isSessionViolation(event)) {
                            sys.buffer(function() {
                                $rootScope.exit(false);
                            });
                        } else if (isSessionTimeout(event)) {
                            sys.buffer(function() {
                                $rootScope.exit(true);
                            });
                        } else {
                            if (deferredStack[event.data.cmdInfo]) {
                                var deferred = deferredStack[event.data.cmdInfo];
                                delete deferredStack[event.data.cmdInfo];
                                if (event.data.result && event.data.result.code) {
                                    deferred.reject(event.data.result);
                                } else {
                                    deferred.resolve(event.data.result);
                                }
                                $rootScope.$applyAsync();
                            } else {
                                processingResults(event.data);
                            }
                        }
                    } else {
                        console.error('Worker callback event returns empty data. ', event.data);
                    }
                } catch (e) {
                    console.error('Worker callback error:' + e.toString(), e.stack);
                }
            };
        };

        function hasNetwork() {
            if (isOffline()) {
                sys.buffer(function () {
                    alert('Вероятно, соединение с Интернетом прервано!');
                });
                $timeout(function() {
                    $ionicLoading.hide();
                });
                return false;
            }
            return true;
        }

        /**
         * Проверка на наличие интернета
         * @returns {boolean}
         */
        function isOffline() {
            if (navigator && navigator.connection) {
                return navigator.connection.type == Connection.UNKNOWN || navigator.connection.type == Connection.NONE;
            }
            return false;
        }

        /**
         * Недоступность сервера
         * @param event
         * @returns {boolean}
         */
        function isNotAvailableServer(event) {
            return event.data.result && event.data.result.code == -1
                && !/^(getNewChatMessages)$/.test(event.data.cmd);
        }

        /**
         * Превышение лимита сессий
         * @param event
         * @returns {boolean}
         */
        function isSessionViolation(event) {
            return event.data.result && event.data.result.code == 4;
        }

        /**
         * Протухание сессии
         * @param event
         * @returns {boolean}
         */
        function isSessionTimeout(event) {
            return event.data.result && Array.isArray(event.data.result.msg) && event.data.result.msg[0] == 'Недопустимый формат запроса';
        }

        /**
         * Инициализация проверки ssl, выполняется при старте воркера и при окончании сессии (выходе)
         */
        var initSslCheck = function() {
            if (angular.isUndefined(isConnectionSecured) && !isOffline()) {
                sslChecker.checkServer().then(function (msg) {
                    isConnectionSecured = true;
                }).catch(function (msg) {
                    isConnectionSecured = false;
                    blockFunctionalityOnSslPinningFailure = persistence.get('blockFunctionalityOnSslPinningFailure');
                    sslPinningFailureText = persistence.get('sslPinningFailureText') || 'Ваше подключение не защищено! Для безопасного использования приложения МТС Банка рекомендуем его переустановить';
                }).finally(function () {
                    while (invokeStack.length) {
                        var stackElem = invokeStack.shift();
                        invokeDeferred.call(this, stackElem[0], stackElem[1]);
                    }
                    while (postMessageStack.length) {
                        postMessage.apply(this, postMessageStack.shift());
                    }
                });
            }
        };

        var getIsConnectionSecured = function() {
            return isConnectionSecured;
        };

        var resetSslCheck = function() {
            isConnectionSecured = undefined;
        };

        return {
            get: get,
            postMessage: postMessage,
            startWorker: startWorker,
            stopWorker: stopWorker,
            setFunction: setFunction,
            invoke: invoke,
            initSslCheck: initSslCheck,
            getIsConnectionSecured: getIsConnectionSecured,
            resetSslCheck: resetSslCheck
        }
    }]);
})();