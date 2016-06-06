/**
 * Создание и инициализация модуля 'app'
 */
(function (appConfig) {
    var app = angular.module('app', ['ionic', 'ngMaterial', 'ui.router', 'commonNgUtilities', 'ng-mfb', 'ngMask', 'ngIOS9UIWebViewPatch']);
    app.config(function($ionicConfigProvider) {
        if (!ionic.Platform.isIOS()) {
            $ionicConfigProvider.scrolling.jsScrolling(false);
        }
    });
    app.run(['$q', '$window', '$document', '$rootScope', '$state', '$ionicPlatform', '$ionicPopup', '$timeout', '$animate',
        '$ionicScrollDelegate', '$ionicModal', 'sys', 'stateCache', 'commonSrv', 'tips', 'WebWorker', 'cardSrv', 'loanSrv',
        'accountSrv', 'depositSrv', 'paymentSrv', 'bankNews', 'chat', 'ideabank', 'persistence', 'settingsSrv',
        '$ionicLoading', 'authDialogs',
    function ($q, $window, $document, $rootScope, $state, $ionicPlatform, $ionicPopup, $timeout, $animate,
              $ionicScrollDelegate, $ionicModal, sys, stateCache, commonSrv, tips, WebWorker, cardSrv,
              loanSrv, accountSrv, depositSrv, paymentSrv, bankNews, chat, ideabank, persistence, settingsSrv,
              $ionicLoading, authDialogs) {

        // Контейнер для глобальных переменных
        $rootScope.globals = {};

        /* Запускаем WebWorker */
        WebWorker.startWorker();
        WebWorker.setFunction();

        /* Инициализация настроек в неавторизованной зоне */
        $rootScope.initializeSettings = function(forced) {
            WebWorker.initSslCheck();
            var deferred = $q.defer();
            if (forced || angular.isUndefined($rootScope.globals.smsCodeLength)) {
                sys.clearWebViewCookies().then(function(){
                    return WebWorker.invoke('getGlobalSettings');
                }).then(function(result) {
                    if (angular.isObject(result.data)) {
                        $rootScope.globals.transferToCardURL = result.data.transferToCardURL;
                        $rootScope.globals.isLoginChangingForRetailClientEnabled = result.data.isLoginChangingForRetailClientEnabled;
                        $rootScope.globals.isMobilePhoneChangingEnabled = result.data.isMobilePhoneChangingEnabled;
                        $rootScope.globals.smsCodeLength = result.data.smsCodeLength;
                        if (typeof(result.data.newChatMessagesRequestInterval) === 'number' && result.data.newChatMessagesRequestInterval > 0) {
                            // Откидываем дробную часть, если вдруг...
                            var reqInterval = result.data.newChatMessagesRequestInterval | 0;
                            // Проследим, чтобы 5 сек было минимальным возможным значением
                            $rootScope.globals.newChatMessagesRequestInterval = (reqInterval < 5 ? 5 : reqInterval) * 1000;
                            $rootScope.globals.reloginTimeSessionTimeout = result.data.reloginTimeSessionTimeout;
                        }
                        $rootScope.globals.isAddressChangeEnabled = result.data.isAddressChangeEnabled;
                        $rootScope.globals.maskedSymbol = result.data.maskedSymbol || '*';

                        // Сразу заперсистим эти параметры
                        persistence.put('blockFunctionalityOnSslPinningFailure', $rootScope.globals.blockFunctionalityOnSslPinningFailure = result.data.blockFunctionalityOnSslPinningFailure);
                        persistence.put('sslPinningFailureText', $rootScope.globals.sslPinningFailureText = result.data.sslPinningFailureText);
                    }

                    /* Инициализация панели подтверждения только после получения длины смс-кода */
                    if (angular.isUndefined($rootScope.confirmPanel)) {
                        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/confirmation.html', function ($ionicModal) {
                            $rootScope.confirmPanel = $ionicModal;
                            deferred.resolve();
                        }, {
                            scope: $rootScope
                        });
                    } else {
                        deferred.resolve();
                    }
                }).catch(function(result) {
                    deferred.reject(result);
                });
            } else {
                deferred.resolve();
            }

            return deferred.promise;
        };

        $rootScope.redirectTransferToCard = function() {
            // Если вдруг параметра $rootScope.globals.transferToCardURL нет, то пытаемся запросить
            $rootScope.initializeSettings().then(function(){
                if ($rootScope.globals.transferToCardURL) {
                    $rootScope.openUrl($rootScope.globals.transferToCardURL, '_blank', 'location=yes');
                } else {
                    // Если с сервера пришла пустая ссылка
                    alert('Сервис временно недоступен', 'Обратите внимание!');
                }
            }).catch(function(result){
                if (result && result.code == 1099) {
                    // Если соединение не защищено, то закрываем меню и переходим на экран ввода логина/КК
                    $rootScope.goToAuthStateOnInsecureSsl(true);
                }
            });
        };

        /* При первом запуске выставляем настройку "Не запрашивать код в течение 3 минут" по умолчанию включенной */
        if (!persistence.get('notFirstLaunch')) {
            persistence.put('noRequestCodeFor3Min', true);
            persistence.put('notFirstLaunch', true);
        }

        /* Переопределение кнопки "Назад" под андройдом для предотвращения выхода из приложения */
        $ionicPlatform.registerBackButtonAction(function(evt){
            if(window.location.hash=='#/'){
                if ($rootScope.adaptToWindowsphone) {
                    if ($window.WinJS) {
                        window.close();
                        return;
                    }
                }
                $window.navigator.app.exitApp();
                return;
            }
            switch ($state.current.name) {
                //Запрет кнопки назад на главной
                case 'home':
                    $ionicPopup.confirm({
                        template: 'Выйти из приложения?',
                        scope: $rootScope,
                        cssClass: 'prompt',
                        buttons: [
                            { text: 'Нет' },
                            {
                                text: 'Да',
                                onTap: function(e) {
                                    $rootScope.exit(true);
                                    $timeout(function() {
                                        if ($rootScope.adaptToWindowsphone) {
                                            if ($window.WinJS) {
                                                window.close();
                                                return;
                                            }
                                        }
                                        if ($window.mayflower) {
                                            $window.mayflower.moveTaskToBack();
                                        }
                                    });
                                }
                            }
                        ]
                    });
                    break;
                case 'unauth_news':
                case 'unauth_currates':
                case 'unauth_atmsandoffices':
                    $state.go($rootScope.globals.unauthMainState);
                    break;
                default:
                    $window.history.back();
            }
        }, 100);

        if ($window.WinJS) {
            WinJS.Application.onbackclick = function (evt) {
                if (cordova) {
                    cordova.fireDocumentEvent('backbutton');
                }
                return true;
            };
            WinJS.Application.onerror = function(error) {
                console.log('Uncaught exception: ');
                console.log(error);
                return true;
            };
        }

        $ionicPlatform.ready(function() {
            /* Прокрутка при тапе по статусбару iOS */
            if ($window.cordova && ionic.Platform.isIOS()) {
                $window.addEventListener("statusTap", function() {
                    if ($state.current.name === 'myfinances') {
                        $$('.page-content').scrollTop(0, 500);
                    } else {
                        $ionicScrollDelegate.scrollTop(true);
                    }
                });
            }
            /* Фикс для двойных тапов на WP */
            if (appConfig.adaptToWindowsphone) {
                if (ionic && ionic.tap) {
                    ionic.tap.requiresNativeClick = function (ele) {
                        if (!ele || ele.disabled || (/^(file|range)$/i).test(ele.type) || (/^(object|video)$/i).test(ele.tagName) || ionic.tap.isLabelContainingFileInput(ele)) {
                            return true;
                        }
                        if (ele.tagName == 'BUTTON' && ele.hasAttribute('ui-sref')) {
                            return ionic.tap.isElementTapDisabled(ele);
                        }
                        if (ele.tagName == 'A' || ele.tagName == 'BUTTON' || ele.hasAttribute('ng-click') || (ele.tagName == 'INPUT' && (ele.type == 'button' || ele.type == 'submit'))) {
                            return true; //Windows Phone edge case, prevent ng-click (and similar) events from firing twice on this platform
                        }
                        return ionic.tap.isElementTapDisabled(ele);
                    }
                }
            }
        });

        //Отключение ngAnimate
        $animate.enabled(false);

        $rootScope.platform = sys.getPlatform();
        sys.getTplByPlatform('header.html');
        $rootScope.adaptToWindowsphone = appConfig.adaptToWindowsphone;

        $rootScope.statusBarColor = "#24A7B3";


        /* Скрытие статусбара оставили только для iOS */
        $rootScope.showStatusBar = function(show) {
            if ($rootScope.platform == 'ios') {
                ionic.Platform.fullScreen(!show, show);
            }
        };
        $rootScope.showStatusBar(false);

        $rootScope.url = appConfig.cleverClientUrl.replace('/clever/client/request.xml', '');

        //----------------- Проверка новых сообщений BEGIN -----------------
        var checkForNewMessages = function(messages){
            if (angular.isArray(messages) && messages.length) {
                var prevMsgCount = chat.getNewMessages().length;
                // Если с последнего раза количество новых сообщений не изменилось, значит новых сообщений нет,
                // иначе генерится событие 'newChatMessagesArrived'
                if (prevMsgCount != messages.length) {
                    chat.setNewMessages(messages);
                    $rootScope.$broadcast('newChatMessagesArrived');
                }
            }
        };

        var newMsgTimeoutHandler; // undefined
        var startNewMsgCheck = function(){
            if ($rootScope.globals.newChatMessagesRequestInterval) {
                newMsgTimeoutHandler = null;
                WebWorker.invoke('getNewChatMessages').then(function (result) {
                    checkForNewMessages(result.data);
                }).finally(function () {
                    if (angular.isDefined(newMsgTimeoutHandler)) {
                        newMsgTimeoutHandler = setTimeout(startNewMsgCheck, $rootScope.globals.newChatMessagesRequestInterval);
                    }
                });
            }
        };

        var stopNewMsgCheck = function() {
            clearTimeout(newMsgTimeoutHandler);
            newMsgTimeoutHandler = undefined;
        };
        //----------------- Проверка новых сообщений END -----------------

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
            if ($rootScope.platform === 'ios') {

                /* для курсов валют и банкоматов стэйты те же самые но таббар должен быть скрыт в неавторизованной зоне */
                if (toState.name.match(/^(currates|atmsandoffices.*|socialNetworks)$/)) {
                    $rootScope.showIosTabbar = $rootScope.isAuthorized;
                } else {
                    $rootScope.showIosTabbar = !toState.name.match(/^(start|login.*|howToConnect|depositselect.depositcompare|depositselect.depositcompareparams|onlinecall|unauth_news.*)$/);
                }
            } else {

                /* для android выставляем главное состояние для возвратов в неавторизованной зоне, смотря откуда вызывается меню (галерея, логопас, кк)*/
                if (toState.name.match(/^(start|login.password|login.shortCode)$/)) {
                    $rootScope.globals.unauthMainState = toState.name;
                }
            }

            // Признак авторизации выставляется false в StartCtrl и LoginCtrl, а true в HomeCtrl
            //$rootScope.isAuthorized = !toState.name.match(/^(start|login.*|howToConnect)$/);

            $state.previous = fromState;
            $state.previousParams = fromParams;

            toState.lastVisit = stateCache.getLastVisit(toState.name);
            stateCache.updateLastVisit(toState.name);

            // Запускаем регулярную проверку новых сообщений в чате, когда заходим в чат
            if (toState.name === 'onlinechat') { startNewMsgCheck(); }
            // Останавливаем проверку новых сообщений в чате, когда уходим из чата
            if (fromState.name === 'onlinechat') { stopNewMsgCheck(); }

            // При переходе между состоянями (кроме 'onlinechat') отправляем запрос на получение новых сообщений чата
            if ($rootScope.isAuthorized && toState.name !== 'onlinechat') {
                WebWorker.invoke('getNewChatMessages').then(function (result) {
                    checkForNewMessages(result.data);
                });
            }
        });

        // ------------------- Вывод приложения из состояния бездействия BEGIN --------------------------------------------------------
        var pauseAppStart, pauseAppEnd, isShownRequestWindow;
        $document.on('pauseApp', function() {
            pauseAppStart = new Date();
        });

        $document.on('resumeApp', function() {
            if ($rootScope.isAuthorized) {
                WebWorker.invoke('invokeEmpty').then(
                    function(result) {
                        if (!result.code) {
                            resumeApp();
                        }
                    }
                );
            }

            function resumeApp() {
                if (persistence.get('noRequestCodeFor3Min')) {
                    pauseAppEnd = new Date();
                    if ((pauseAppEnd - pauseAppStart) >= appConfig.backgroundTimeout) {
                        showRequestWindow();
                    }
                } else {
                    showRequestWindow();
                }

                function showRequestWindow() {
                    var authMode = persistence.get('authMode');
                    if (!isShownRequestWindow || isShownRequestWindow.$$state.status) {
                        switch(authMode) {

                            /* При авторизации по логопасу показываем модальное окно только пароля */
                            case 'login':
                                isShownRequestWindow = authDialogs.showPasswordPrompt();
                                break;

                            /* При авторизации по КК/TouchId показываем соответствующее окно */
                            case 'shortCode':
                            case 'touchID':
                                isShownRequestWindow = authDialogs.showShortCodePrompt();
                                break;
                        }
                    }
                }
            }
        });
        // ------------------- Вывод приложения из состояния бездействия END ----------------------------------------------------------

        // При выполнении входа также требуется проверка новых сообщений
        $rootScope.$watch('isAuthorized', function(isAuthorized) {
            if (isAuthorized) {
                WebWorker.invoke('getNewChatMessages').then(function (result) {
                    checkForNewMessages(result.data);
                });
            }
        });

        $rootScope.openBase64Pdf = function(base64Pdf) {
            commonSrv.openPDF(base64Pdf);
        };

        $rootScope.goBack = function(pageCount){
            if (!pageCount) { pageCount = -1; }
            if (pageCount > 0) { pageCount *= -1; }

            $window.history.go(pageCount);
        };

        /**
        * Переопределение системного alert'а
        * @param message   текст сообщения
        * @param title     заголовок
        * @return          promise, разрешаемый при закрытии popup'а
        */
        $window.alert = function(message, title) {
            if (title === undefined) {
                title = 'Обратите внимание!';
            }
            //Для корректной работы при вызове из Worker'а
            var scope = $rootScope.$new(true);
            scope.$applyAsync();
            return $ionicPopup.alert({
                title: title,
                scope: scope,
                cssClass: 'alert',
                template: message,
                buttons: [{ text: 'ОК' }]
            });
        };
        $rootScope.alert = $window.alert;

        /**
         * Переопределение системного confirm'а
         * @param message   текст сообщения
         * @param title     заголовок
         * @param okText    текст для кнопки OK
         * @param cancelText текст для кнопки Отмена
         * @return          promise, разрешаемый при закрытии confirm'а
         */
        $window.confirm = function(message, title, okText, cancelText) {
            if (!angular.isString(title)) {
                title = 'Обратите внимание!';
            }

            //Для корректной работы при вызове из Worker'а
            var scope = $rootScope.$new(true);
            scope.$applyAsync();
            return $ionicPopup.confirm({
                title: title,
                scope: scope,
                cssClass: 'alert',
                template: message,
                okText: okText,
                okType: 'button-default',
                cancelText: angular.isDefined(cancelText) ? cancelText : sys.getPlatform() === 'ios' ? 'Отмена' : 'Отменить',
                okType: 'button-default'
            });
        };
        $rootScope.confirm = $window.confirm;

        /**
         * Переопределение системного prompt'а
         * @param message   текст сообщения
         * @param title     заголовок
         * @param okText    текст для кнопки OK
         * @param cancelText текст для кнопки Отмена
         * @return          promise, разрешаемый при закрытии prompt'а
         */
        $window.prompt = function(message, title, type, placeholder, okText, cancelText) {
            if (!angular.isString(title)) {
                title = 'Подтвердите действие';
            }

            if (!/^(text|password|number)$/i.test()) {
                type = 'text';
            }

            //Для корректной работы при вызове из Worker'а
            var scope = $rootScope.$new(true);
            scope.type = type;
            scope.placeholder = placeholder || '';
            scope.data = {};
            scope.$applyAsync();
            return $ionicPopup.show({
                title: title,
                scope: scope,
                cssClass: 'alert',
                template: (message ? '<div>' + message + '</div>' : '') + '<input input-clear-btn type="{{type}}" placeholder="{{placeholder}}" ng-model="data.input" />',
                buttons: [{
                    text: angular.isDefined(cancelText) ? cancelText : sys.getPlatform() === 'ios' ? 'Отмена' : 'Отменить'
                }, {
                    text: angular.isDefined(okText) ? okText : 'OK',
                    onTap: function(evt) {
                        //don't allow the user to close unless he enters the shortCode
                        return scope.data.input || evt.preventDefault();
                    }
                }]
            });
        };
        $rootScope.prompt = $window.prompt;

        // Для отладочных целей
        $rootScope.console = $window.console;

        $rootScope.openUrl = function(urlStr) {
            if (angular.isString(urlStr)) {
                $window.open(urlStr.trim(), '_blank', 'location=yes,fullscreen=yes');
            } else {
                $window.console.error('openUrl: urlStr provided is not a valid string', urlStr);
            }
        };

        $rootScope.goToState = function(stateName, stateParams) {
            $state.go(stateName, stateParams);
        };

        $rootScope.goToAuthStateOnInsecureSsl = function(fromStartScreen, stateParams) {
            $ionicLoading.hide();
            if (fromStartScreen || $state.current.name != 'start') {
                $state.go(/^(shortCode|touchID)$/.test(persistence.get('authMode')) ? 'login.shortCode' : 'login.password', stateParams);
            }
        };

        /**
         * Выполняет JSON.stringify, при этом циркулярные ссылки сбрасываются для предотвращения ошибки
         */
        $rootScope.safeStringify = function(input){
            var cache = [];
            return JSON.stringify(input, function(key, value) {
                if (angular.isObject(value) && value !== null) {
                    if (cache.indexOf(value) !== -1) {
                        // Circular reference found, discard key
                        return;
                    }
                    // Store value in our collection
                    cache.push(value);
                }
                return value;
            });
        };

        $rootScope.isRefillProductAvailable = function(product) {
            return product && product.canRefill;
        };

        $rootScope.refillProduct = function(product) {
            var template = {
                docKind: 'RetailTransfer'
            };
            if (product) {
                template.sourceProductToId = product.id;
            }
            var params = paymentSrv.getParamsToRedirectFromFavourites(template);
            $rootScope.goToState(params.link, params.linkParams);
        };

        $rootScope.renameProduct = function(product){
            $window.prompt(
                'Введите новое название',
                $rootScope.platform === 'ios' ? 'Переименовать' : 'Переименование',
                'text', product.name,
                $rootScope.platform === 'ios' ? 'Сохранить' : 'Применить'
            ).then(function(newName){
                if (newName) {
                    // Вызов метода изменения наименования
                    WebWorker.invoke('renameProduct', product, newName);
                    product.name = newName;
                }
            });
        };

        $rootScope.getCurrentStateName = function() {
            return $state.current.name;
        };

        $rootScope.callNumber = function(number) {
            if ($window.plugins && $window.plugins.CallNumber && angular.isFunction($window.plugins.CallNumber.callNumber)) {
                $window.plugins.CallNumber.callNumber(
                    function(status) {
                        console.log('Native dial', status);
                    }, function(status) {
                        console.warn('Native dial', status);
                    }, number
                );
            }
        };

        /**
         * Клонирование объекта - копирует все поля без изменения ссылки объекта
         * @param receiver  приёмник
         * @param source    источник
         */
        $rootScope.clone = function(receiver, source) {
            for (var field in source) {
                receiver[field] = source[field];
            }
        };

        /**
         * Инициализция и открытие окна подтверджения
         * @param confirmPanel  модальное окно
         * @param method        метод подтверждаемой операции
         * @param args          параметры операции
         * @param sms           признак подтверждения смс/кодовая дата
         * @param other:
         * codeDateHint         подсказка к кодовой дате (только для авторизации и восстановления доступа)
         * newMobileTelephone   новый мобильный телефон (при изменении мобильного телефона)
         */
        $rootScope.confirmationShow = function(method, args, sms, other) {
            /*
             * Т.к. для подтверждения операции требуется длина смс кода, убедимся,
             * что getGlobalSettings были запрошены.
             * (Если пользователь ранее нажимал отмену при незащищенном соединении, то вызовы getGlobalSettings пресекались)
             */
            $rootScope.initializeSettings().then(function(){
                $rootScope.confirmPanel.scope.params = {};
                $rootScope.confirmPanel.scope.params.method = method;
                $rootScope.confirmPanel.scope.params.args = args;
                $rootScope.confirmPanel.scope.params.actionStrId = args[0];
                $rootScope.confirmPanel.scope.params.sms = sms;
                $rootScope.confirmPanel.scope.params.confirmationCode = '';
                $rootScope.confirmPanel.scope.params.invalidConfirmationCode = false;
                if (other && (args[0] == 'RetailConfirmChangeMobileNumber')) {
                    $rootScope.confirmPanel.scope.params.newMobileTelephone = other;
                } else {
                    $rootScope.confirmPanel.scope.params.codeDateHint = other;
                }
                $rootScope.showStatusBar(false);
                if ($rootScope.platform == 'ios' && window.Keyboard) {
                    window.Keyboard.hideFormAccessoryBar(true);
                }

                var backdrop = $rootScope.confirmPanel.$el;
                if (!backdrop.hasClass('confirmation-code-modal')) {
                    backdrop.addClass('confirmation-code-modal');
                }
                $rootScope.confirmPanel.show().then(function() {
                    setTimeout(function() {
                        $('#confirmation-code-input')[0].focus();
                    }, 150);
                });
                angular.element('#rootpane').addClass('blur15px');
            }).catch(function(status){
                alert(angular.isString(status) ? status : angular.isObject(status) ? status.msg : 'Невозможно подтвердить операцию', 'Подтверждение операции');
            });
        };

        /**
         * Скрытие окна подтверждения
         * @param confirmPanel  модальное окно
         */
        $rootScope.confirmationHide = function() {
            if ($rootScope.confirmPanel && $rootScope.confirmPanel.isShown()) {
                $rootScope.confirmPanel.hide();
            }
            if ($state.current.name != 'login.shortCode') {
                $rootScope.showStatusBar(true);
            }
            if ($rootScope.platform == 'ios' && window.Keyboard) {
                if ($state.current.name != 'login.restoreAccessCard' && $state.current.name != 'login.restoreAccessAccount' && $state.current.name != 'login.restoreAccessPassport') {
                    window.Keyboard.hideFormAccessoryBar(false);
                }
            }
            angular.element('#rootpane').removeClass('blur15px');

        };

        /**
         * Ошибка подтверждения
         * @param confirmPanel  модальное окно
         * @param result        результат смс/кодовой даты
         */
        $rootScope.confirmationFalse = function(result) {
            $rootScope.confirmPanel.scope.params.confirmationCode = '';
            if (sys.getPlatform() != 'ios') {
                $rootScope.confirmPanel.scope.params.invalidConfirmationCode = true;
            } else {
                switch(result) {
                    case 'otpFalse':
                        $timeout(alert('Введен неверный код', 'Подтверждение операции'));
                        break;
                    case 'codeDateFalse':
                        $timeout(alert('Введена неверная дата', 'Подтверждение операции'));
                        break;
                }
            }
            $rootScope.confirmPanel.scope.$digest();
        };

        $rootScope.openPanel = function() {
            var fw7App = sys.getFramework7App();

            if ($('.panel.active').length == 0) {
                fw7App.allowPanelOpen = true;
                fw7App.openPanel($rootScope.platform == 'ios' ? 'right' : 'left');
            }
        };

        var nextScreenIdx = 0;

        $document.on('proximitychange', function(evt) {
            if (evt.originalEvent.proximityState) {
                tips.loadInfoMsg().then(function(data) {
                    //var randomScreen = data[Math.floor(Math.random() * data.length)];
                    var nextScreen = data[nextScreenIdx++ % data.length];
                    tips.showDialog(nextScreen);
                });
            } else {
                if (sys.getPlatform() !== 'ios') {
                    tips.hideDialog();
                }
            }
        });

        $rootScope.enableHandShaker = function() {
            if (!$rootScope.isHandShakerEnabled) {
                $rootScope.isHandShakerEnabled = true;

                var evt = new Event('handShakerEnabled');
                document.dispatchEvent(evt);
            }
        };

        $rootScope.disableHandShaker = function() {
            if ($rootScope.isHandShakerEnabled) {
                $rootScope.isHandShakerEnabled = false;

                var evt = new Event('handShakerDisabled');
                document.dispatchEvent(evt);
            }
        };

        $rootScope.initHandShaker = function() {
            if (persistence.get('isOpenTemplatesByHandshake')) {
                $rootScope.enableHandShaker();
            } else {
                $rootScope.disableHandShaker();
            }
        };

        $document.on('handshake', function(evt) {
            if ($rootScope.isAuthorized) {
                $state.go('favourites');
            }
        });

        sys.initFramework7();

        var $$ = Dom7;
        $$('.panel-right').on('open', function () {
            $('#tabbar-menu-div1').addClass('tabbar-menu-div1-step1');
            $('#tabbar-menu-div2').addClass('visibility-hidden');
            $('#tabbar-menu-div3').addClass('tabbar-menu-div3-step1');
            setTimeout(function(){
                $('#tabbar-menu-div1').addClass('tabbar-menu-div1-step2');
                $('#tabbar-menu-div3').addClass('tabbar-menu-div3-step2');
            }, 500);
        });
        $$('.panel-right').on('opened', function () {
            $('.panel-right').addClass('panel-opened');
        });
        $$('.panel-right').on('close', function () {
            $('.panel-right').removeClass('panel-opened');
            $('#tabbar-menu-div1').removeClass('tabbar-menu-div1-step2');
            $('#tabbar-menu-div3').removeClass('tabbar-menu-div3-step2');
            setTimeout(function(){
                $('#tabbar-menu-div1').removeClass('tabbar-menu-div1-step1');
                $('#tabbar-menu-div2').removeClass('visibility-hidden');
                $('#tabbar-menu-div3').removeClass('tabbar-menu-div3-step1');
            }, 500);
        });

        var unregister;

        $$('.panel-left').on('open', function () {
            $('#rootpane').append('<div id="modal-menu" class="modal-container opacity0" style="z-index: 40; transition: 0.5s;"></div>');
            setTimeout(function(){
                $('#modal-menu').removeClass('opacity0');
            }, 0);
            unregister = $ionicPlatform.registerBackButtonAction(function() {
                var fw7App = sys.getFramework7App();
                fw7App.closePanel("left");
            }, 405);
        });
        $$('.panel-left').on('close', function () {
            $('#modal-menu').addClass('opacity0');
            setTimeout(function(){
                $('#modal-menu').remove();
            }, 500);
            if (unregister) {
                unregister();
            }
        });

        /* Получение урла картинки: конкатенирует урл сервера с параметрами сервлета */
        $rootScope.getLogoUrl = function(url) {
            return $rootScope.url + url;
        };

        $rootScope.background = sys.getBackground();
        $rootScope.prefetchBackground = function() {
            $rootScope.backgroundCached = new Image();
            $rootScope.backgroundCached.src = 'img/background/bg-v-' + $rootScope.background + '.png';
        };

        $rootScope.messageForBanMobile = 'Вход невозможен. Смена мобильного телефона временно заблокирована';
        $rootScope.messageForChangeLogin = 'Новый логин будет действовать только для данной версии интернет-банка';
        $rootScope.messageForChangePassword = 'Новый пароль будет действовать только для данной версии интернет-банка';
        $rootScope.messageForChangeLoginPassword = 'Новый логин и пароль будут действовать только для данной версии интернет-банка';
        $rootScope.messageForMissingBranch = 'Информацию об офисе, обслуживающем ваш продукт, вы можете узнать в Службе поддержки клиентов';

        $rootScope.saveDataForSessionTimeout = function(data) {
            $rootScope.globals.tempDataObjectForSessionTimeout = data;
        };

        /**
         * Проверка авторизации в рамках протухания сессии (релогин)
         * @param login     логин пользователя (может не быть при авторизации по КК и Touch ID)
         */
        $rootScope.checkReloginSessionTimeout = function(login) {
            if (login && persistence.get('login') && persistence.get('login') != login) {
                $rootScope.resetCache();
            } else if ($rootScope.globals.sessionTimeout) {
                var now = new Date();
                if (now.getTime() > $rootScope.globals.lastTimeForReloginSessionTimeout.getTime()) {
                    $rootScope.resetCache();
                }
            } else {
                $rootScope.resetCache();
            }
        };

        /**
         * Метод сброса кэшей. Вызывать при полном осознании, что его надо выполнить
         */
        $rootScope.resetCache = function() {
            $rootScope.retailClient = null;
            $rootScope.disableHandShaker();
            cardSrv.reset();
            loanSrv.reset();
            accountSrv.reset();
            depositSrv.reset();
            paymentSrv.reset();
            commonSrv.reset();
            bankNews.reset();
            chat.reset();
            ideabank.reset();
            settingsSrv.reset();
        };

        $rootScope.exitFromMenuIos = function() {
            if (!jQuery('.panel-right').hasClass('panel-opened')) {
                if (event) {
                    event.stopPropagation();
                }
                return;
            }
            $rootScope.exit(false);
        };

        $rootScope.exit = function(sessionTimeout) {
            WebWorker.postMessage('logout', 'logout');
            $rootScope.globals.sessionTimeout = sessionTimeout;
            if (sessionTimeout) {

                /* сохранение введённых данных в реальный объект, из которого происходит подкладывание */
                $rootScope.globals.dataObjectForSessionTimeout = $rootScope.globals.tempDataObjectForSessionTimeout;
                delete($rootScope.globals.tempDataObjectForSessionTimeout);

                /* сохранение крайнего времени, в течение которого будет возврат на последнюю страницу */
                var lastTimeForReloginSessionTimeout = new Date();
                lastTimeForReloginSessionTimeout.setMinutes(lastTimeForReloginSessionTimeout.getMinutes() + $rootScope.globals.reloginTimeSessionTimeout);
                $rootScope.globals.lastTimeForReloginSessionTimeout = lastTimeForReloginSessionTimeout;

                $rootScope.confirmationHide();
                $ionicLoading.hide();
            }
            WebWorker.invoke('clearSession');
            WebWorker.resetSslCheck();
            $rootScope.isAuthorized = false;
            var authMode = persistence.get('authMode');
            if (authMode == 'shortCode' || authMode == 'touchID') {
                $state.go('login.shortCode', {isExit: true});
            } else {
                $state.go('login.password', {isExit: true});
            }
        };
    }]);
}(window.AppConfig));