(function () {
    var module = angular.module('app');

    module.controller('LoginCtrl', ['$scope', '$rootScope', '$state', '$window', '$ionicModal', '$ionicPlatform', '$timeout', 'persistence', 'WebWorker', 'sys', 'commonSrv', '$ionicLoading', 'bankNews',
    function ($scope, $rootScope, $state, $window, $ionicModal, $ionicPlatform,  $timeout, persistence, WebWorker, sys, commonSrv, $ionicLoading, bankNews) {
        var loginPassAuth = 'auth-meth-name-and-pswd';  // авторизация по логопасу
        var shortCodeAuth = 'auth-meth-short-code';     // авторизация по кк
        var touchIdAuth = 'auth-meth-touch-id';         // авторизация по отпечатку пальца
        var restoreAccess = 'auth-meth-restore-access'; // авторизация по карте/счету/паспорту (восстановление доступа)
        var args = [];  // для подтверждения операций
        var changePasswordActionStrId = 'ChangePasswordAction';
        var changeMobilePhoneActionStrId = 'RetailConfirmChangeMobileNumber';
        $rootScope.isAuthorized = false;

        $rootScope.disableHandShaker();

        $rootScope.prefetchBackground();

        var checkTouchIdSupport = function() {
            if (authMode == 'touchID' && $window.fingerscanner) {
                $window.fingerscanner.checkSupportTouchID(function(touchIDSupported) {
                    if (touchIDSupported) {
                        $scope.hasTouchID = true;
                        // авторизация по Touch ID
                        $scope.checkTouchID();
                    }
                }, function(err) {
                    console.log(err);
                });
            }
        };

        $scope.user = {};
        $scope.user.login = persistence.get('login');
        // Переключатель "Задать код быстрого доступа" по умолчанию включен
        $scope.user.setShortCode = angular.isUndefined(persistence.get('setShortCode')) || !!persistence.get('setShortCode');
        $scope.user.shortCode1 = '';
        $scope.user.shortCode2 = '';
        $scope.user.idShortCode = persistence.get('idShortCode');
        var authMode = persistence.get('authMode');
        if (!authMode) {
            authMode = 'login';
            persistence.put('authMode', 'login');
        }
        if (authMode == 'shortCode' || authMode == 'touchID') {
            $scope.user.enterShortCode = true;
            $scope.user.firstCode = false;

            if (sys.getPlatform() === 'ios') {
                $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/auth/menu.html', function($ionicModal) {
                    $scope.menu = $ionicModal;
                }, {
                    scope: $scope
                });
            }
        }

        if ($state.params.isExit) {
            //Проверим доступность Touch ID
            checkTouchIdSupport();
        } else {
            setTimeout(function(){
                if (navigator && navigator.splashscreen) {
                    navigator.splashscreen.hide();
                }
                //Проверим доступность Touch ID
                checkTouchIdSupport();
            }, ($rootScope.platform == 'ios') ? 2000 : 5000);
        }

        if (authMode == 'login' && $scope.user.login) {
            $timeout(function() {
                var passwordField = angular.element('#password');
                passwordField.focus();
                if ($rootScope.platform == "android" && window.Keyboard) {
                    window.Keyboard.show();
                    passwordField.one('blur', function() {
                        window.Keyboard.hide();
                    });
                }
            }, 200);
        }

        $scope.saveSetShortCode = function() {
            persistence.put('setShortCode', $scope.user.setShortCode);
        };

        $scope.checkTouchID = function() {
            $timeout(function() {
                $window.fingerscanner.checkTouchID(
                    function(params) {
                        sys.clearWebViewCookies().then(function() {
                            $rootScope.checkReloginSessionTimeout();
                            args = [touchIdAuth, params.login, params.password, $window.deviceinfo];
                            connect('connectTouchID', args);
                        });
                    },
                    function(e) {
                        console.log('app.error: ' + e);
                    }
                );
            }, 300);
        };

        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/auth/useTouchID.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.touchID = modal;
        });

        var unregisterBackHandler = $ionicPlatform.registerBackButtonAction(function() {
            switch ($state.current.name) {
                case 'login.password':
                    $state.go('start');
                    break;
                case 'login.shortCode':
                    $scope.backShortCode();
                    $scope.$apply();
                    break;
                default:
                    $window.history.back();
            }
        }, 101);

        /* При закрытии всплывашки об использовании TouchId переходим на главную */
        var unregisterModalHandler = $scope.$on('modal.hidden', function(evt, modal) {
            if (modal == $scope.touchID) {
                auth();
            } else if (modal == $scope.confirmPanel) {
                if ($scope.user.setShortCode) {
                    $scope.user.shortCode1 = '';
                    $scope.user.shortCode2 = '';
                    $scope.user.firstCode = true;
                }
                /* Добавить ифчики для обработки закрытия формы подтверждения при необходимости */
            }
        });

        $scope.$on('$destroy', function () {
            unregisterBackHandler();
            unregisterModalHandler();
            if ($scope.touchID) {
                $scope.touchID.remove();
            }
            if ($scope.confirmPanel && $scope.confirmPanel.isShown()) {
                $scope.confirmationHide();
            }
        });

        var auth = function() {
            $ionicLoading.hide();
            if ($scope.globals.firstLaunch) {
                afterLogin();
                $state.go('socialNetworks');
            } else {
                $rootScope.isAuthorized = true;
                if ($rootScope.globals.sessionTimeout) {
                    resetSessionTimeout();
                    $scope.goBack();
                    bankNews.showImportant();
                } else {
                    afterLogin();
                    $state.go('home');
                }
            }
        };

        function processingResults(data) {
            switch (data.cmdInfo) {
                case 'connectLoginPassword':
                    if (data.result.code) {
                        $timeout(function() {
                            $ionicLoading.hide();
                        });

                        alert(data.result.msg, 'Авторизация').finally(function() {
                            setFocusToPswdField();
                        });
                        return;
                    }
                    if (data.result.otpConfirm || data.result.codeDateConfirm) {
                        $ionicLoading.hide();
                        $scope.confirmationShow('confirmLoginAction', args,
                            !angular.isUndefined(data.result.otpConfirm), data.result.codeDateHint);
                        return;
                    }
                    persistence.put('login', $scope.user.login);
                    $rootScope.userUuid = data.result.userUuid;
                    $scope.user.codeDateHint = data.result.codeDateHint;
                    if (data.result.changePassword) {
                        $scope.user.changePassword = data.result.changePassword;
                        $scope.user.changeLogin = data.result.changeLogin;
                        $scope.user.requireOldPassword = data.result.requireOldPassword;
                        $scope.user.hasMobileTelephone = data.result.hasMobileTelephone;
                        $ionicLoading.hide();
                        resetSessionTimeout();
                        $state.go('login.changeLoginPassword');
                        return;
                    } else if (data.result.changeMobileTelephone) {
                        $scope.user.changeMobileTelephone = data.result.changeMobileTelephone;
                        $scope.user.hasMobileTelephone = data.result.hasMobileTelephone;
                        $ionicLoading.hide();
                        resetSessionTimeout();
                        $state.go('login.changeLoginPassword');
                        return;
                    }
                    if ($scope.user.setShortCode) {
                        $scope.user.firstCode = true;
                        $scope.user.enterShortCode = false;
                        $ionicLoading.hide();
                        resetSessionTimeout();
                        $state.go('^.shortCode');
                        return;
                    }
                    auth();
                    break;
                case 'connectShortCode':
                    if (data.result.code) {
                        $timeout(function() {
                            $ionicLoading.hide();
                        });

                        alert(data.result.msg, 'Авторизация').finally(function() {
                            $scope.user.shortCode1 = '';
                            if (data.result.msg.indexOf('ввели неправильно короткий код') != -1) {
                                $scope.resetShortCode();
                            }
                        });
                        return;
                    }
                    $rootScope.userUuid = data.result.userUuid;
                    auth();
                    break;
                case 'connectTouchID':
                    if (data.result.code) {
                        $timeout(function() {
                            $ionicLoading.hide();
                        });

                        alert(data.result.msg, 'Авторизация');
                        $scope.resetShortCode();
                        return;
                    }
                    $rootScope.userUuid = data.result.userUuid;
                    auth();
                    break;
                case 'confirmLoginAction':
                    if (data.result.code) {
                        alert(data.result.msg, 'Авторизация').finally(function() {
                            $scope.confirmationHide();
                        });
                        return;
                    } else if (data.result.otpFalse) {
                        $scope.confirmationFalse('otpFalse');
                        return;
                    } else if (data.result.codeDateFalse) {
                        $scope.confirmationFalse('codeDateFalse');
                        return;
                    }
                    persistence.put('login', $scope.user.login);
                    $scope.confirmationHide();
                    $rootScope.userUuid = data.result.userUuid;
                    if ($scope.user.setShortCode) {
                        $scope.user.firstCode = true;
                        $scope.user.enterShortCode = false;
                        $scope.user.shortCode1 = '';
                        $scope.user.shortCode2 = '';
                        resetSessionTimeout();
                        $state.go('^.shortCode');
                        return;
                    }
                    auth();
                    break;
                case 'registerShortCode':
                    $ionicLoading.hide();
                    if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                        $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm', $scope.user.codeDateHint);
                        return;
                    }  else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                        $scope.confirmationFalse(data.result.data);
                        return;
                    } else if (data.result.data.length !== 42) {
                        $timeout(function() {
                            alert('Ошибка регистрации короткого кода\n' + data.result.data, 'Авторизация');
                        }, true);
                        $scope.user.shortCode1 = '';
                        $scope.user.shortCode2 = '';
                        $scope.user.firstCode = true;
                        $scope.user.enterShortCode = false;
                        $scope.$digest();
                        return;
                    }
                    $scope.user.idShortCode = data.result.data;
                    persistence.put('idShortCode', $scope.user.idShortCode);
                    persistence.put('authMode', 'shortCode');
                    $scope.confirmationHide();

                    // предложение регистрации Touch ID
                    if ($window.fingerscanner) {
                        $window.fingerscanner.checkSupportTouchID(function(touchIDSupported) {
                            if (touchIDSupported) {
                                $scope.touchID.show();
                            } else {
                                auth();
                                console.log('Устройство не поддерживает Touch ID');
                            }
                        }, function(err) {
                            auth();
                            console.log(err);
                        });
                    } else {
                        auth();
                    }
                    break;
                case 'registerTouchID':
                    $ionicLoading.hide();
                    if (data.result.data == 'false') {
                        alert('Регистрация Touch ID\nПроизошла ошибка', 'Авторизация');
                        return;
                    }
                    var params = {};
                    params.login = fn_b64_decode(data.result.data[0]);
                    params.password = fn_b64_decode(data.result.data[1]);
                    $window.fingerscanner.savePrivateData(
                        params,
                        function(info) {
                            persistence.put('authMode', 'touchID');
                            persistence.put('registeredTouchID', true);
                            $scope.touchID.hide();
                            auth();
                        },
                        function(e) {
                            console.log('app.error: ' + e);

                            // нажали крестик
                            if (e == 'STATUS_USER_CANCELLED') {
                                persistence.put('authMode', 'shortCode');
                                auth();
                            } else {
                                alert('Ошибка\n' + e, 'Авторизация');
                            }
                        }
                    );
                    break;
                case 'restoreAccess':
                    $ionicLoading.hide();
                    if (data.result.code) {
                        alert(data.result.msg);
                        return;
                    }
                    if (data.result.otpConfirm || data.result.codeDateConfirm) {
                        $scope.confirmationShow('confirmRestoreAccess', args,
                            !angular.isUndefined(data.result.otpConfirm), data.result.codeDateHint);
                        return;
                    }
                    $rootScope.userUuid = data.result.userUuid;
                    $state.go('login.createLoginPassword');
                    break;
                case 'confirmRestoreAccess':
                    $ionicLoading.hide();
                    if (data.result.code) {
                        alert(data.result.msg, 'Авторизация').finally(function() {
                            $scope.confirmationHide();
                        });
                        return;
                    } else if (data.result.otpFalse) {
                        $scope.confirmationFalse('otpFalse');
                        return;
                    } else if (data.result.codeDateFalse) {
                        $scope.confirmationFalse('codeDateFalse');
                        return;
                    }
                    $scope.confirmationHide();
                    $state.go('login.createLoginPassword');
                    break;
                case 'createLoginPassword':
                    $ionicLoading.hide();
                    if (data.result.data !== 'true') {
                        alert(data.result.data, 'Авторизация');
                        return;
                    }
                    if ($scope.user.setShortCode) {
                        $scope.user.firstCode = true;
                        $scope.user.enterShortCode = false;
                        $state.go('^.shortCode');
                        return;
                    }
                    persistence.put('login', $scope.user.newLogin);
                    auth();
                    break;
                case 'changeLoginPassword':
                    $ionicLoading.hide();
                    if (data.result.code) {
                        alert(data.result.msg, 'Авторизация').finally(function() {
                            $scope.confirmationHide();
                        });
                        return;
                    } else if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                        if ($scope.user.mobileTelephone) {
                            $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm', $scope.user.mobileTelephone);
                        } else {
                            $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm');
                        }
                        return;
                    }  else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                        $scope.confirmationFalse(data.result.data);
                        return;
                    } else if (data.result.data !== 'true') {
                        alert(data.result.data, 'Авторизация');
                        return;
                    }
                    $scope.confirmationHide();
                    if ($scope.user.setShortCode) {
                        $scope.user.firstCode = true;
                        $scope.user.enterShortCode = false;
                        $state.go('^.shortCode');
                        return;
                    }
                    persistence.put('login', $scope.user.newLogin);
                    auth();
                    break;
            }
            $scope.$apply();
        }
        WebWorker.setFunction(processingResults);

        function setFocusToPswdField() {
            $timeout(function () {
                angular.element('#password').focus();
            }, 150);
        }

        $scope.authorize = function() {
            if (!$scope.user.login && !$scope.user.password) {
                alert('Введите логин и пароль', 'Авторизация');
                return;
            } else if (!$scope.user.login) {
                alert('Введите логин', 'Авторизация');
                return;
            } else if (!$scope.user.password) {
                alert('Введите пароль', 'Авторизация');
                return;
            }

            $ionicLoading.show({
                templateUrl: 'templates/' + sys.getPlatform() + '/loading.html'
            });

            sys.clearWebViewCookies().then(function() {
                $rootScope.checkReloginSessionTimeout($scope.user.login);
                args = [loginPassAuth, $scope.user.login, ($scope.user.password || ''), $window.deviceinfo];
                connect('connectLoginPassword', args);
            });
        };

        $scope.addDigit = function(digit) {
            if ($scope.user.enterShortCode) {
                $scope.user.shortCode1 += digit;
                if ($scope.user.shortCode1.length === 4) {
                    sys.clearWebViewCookies().then(function() {
                        $ionicLoading.show({
                            templateUrl: 'templates/' + sys.getPlatform() + '/loading.html'
                        });
                        $rootScope.checkReloginSessionTimeout();
                        args = [shortCodeAuth, $scope.user.idShortCode, $scope.user.shortCode1, $window.deviceinfo];
                        connect('connectShortCode', args);
                    });
                }
            } else if ($scope.user.firstCode) {
                $scope.user.shortCode1 += digit;
                if ($scope.user.shortCode1.length === 4) {
                    $scope.user.firstCode = false;
                }
            } else {
                $scope.user.shortCode2 += digit;
                if ($scope.user.shortCode2.length === 4) {
                    if ($scope.user.shortCode1 !== $scope.user.shortCode2) {
                        $timeout(function() {
                            alert('Коды доступа не совпадают', 'Авторизация')
                        }, true);
                        $scope.user.shortCode1 = '';
                        $scope.user.shortCode2 = '';
                        $scope.user.firstCode = true;
                        $scope.$digest();
                        return;
                    }
                    args = ['RetailRegisterShortCode', JSON.stringify($scope.user)];
                    $ionicLoading.show({
                        templateUrl: 'templates/' + sys.getPlatform() + '/loading.html'
                    });
                    WebWorker.postMessage('registerShortCode', 'registerShortCode', args);
                }
            }
        };

        function connect(cmdInfo, args) {
            WebWorker.initSslCheck();
            WebWorker.invoke('logout').then(function() {
                $scope.initializeSettings(true).then(function() {
                    WebWorker.postMessage('connect', cmdInfo, args);
                }).catch(function() {
                    authCatch();
                });
            }).catch(function() {
                authCatch();
            });
        }

        function authCatch() {
            $ionicLoading.hide();
            if (authMode != 'login') {
                $scope.user.shortCode1 = '';
            }
        }

        $scope.backShortCode = function() {
            if ($scope.user.enterShortCode) {
                $state.go('^.password');
            } else if ($scope.user.firstCode) {
                resetSessionTimeout();
                $state.go('^.password');
            } else {
                $scope.user.firstCode = true;
            }
            $scope.user.shortCode1 = '';
            $scope.user.shortCode2 = '';
        };

        $scope.backspace = function() {
            if ($scope.user.firstCode || $scope.user.enterShortCode) {
                $scope.user.shortCode1 = $scope.user.shortCode1.slice(0, -1);
            } else {
                $scope.user.shortCode2 = $scope.user.shortCode2.slice(0, -1);
            }
        };

        // при отмене регистрации КК просто запрос клиента и редирект в home
        $scope.cancelShortCode = function() {
            auth();
        };

        $scope.resetShortCode = function() {
            authMode = 'login';
            persistence.put('authMode', authMode);
            persistence.remove('idShortCode');
            persistence.remove('registeredTouchID');
            $scope.hasTouchID = false;
            resetSessionTimeout();
            $state.go('^.password');
        };

        $scope.useTouchID = function(flag) {
            if (flag) {
                $ionicLoading.show({
                    templateUrl: 'templates/' + sys.getPlatform() + '/loading.html'
                });
                WebWorker.postMessage('registerTouchID', 'registerTouchID', [$scope.user.idShortCode]);
            } else {
                $scope.touchID.hide();
            }
        };

        $scope.restoreAccess = function() {
            switch($state.current.name) {
                case 'login.restoreAccessCard':
                    if (!$scope.user.cardNumber || $scope.user.cardNumber === '') {
                        alert('Введите номер карты', 'Авторизация');
                        return;
                    }
                    break;
                case 'login.restoreAccessAccount':
                    if (!$scope.user.accNumber || $scope.user.accNumber === '') {
                        alert('Введите номер счета', 'Авторизация');
                        return;
                    }
                    break;
                case 'login.restoreAccessPassport':
                    if (!$scope.user.passSeries || $scope.user.passSeries === '') {
                        alert('Введите серию паспорта', 'Авторизация');
                        return;
                    }
                    if (!$scope.user.passNumber || $scope.user.passNumber === '') {
                        alert('Введите номер паспорта', 'Авторизация');
                        return;
                    }
                    break;
            }
            $ionicLoading.show({
                templateUrl: 'templates/' + sys.getPlatform() + '/loading.html'
            });
            sys.clearWebViewCookies().then(function() {
                $rootScope.resetCache();
                args = [restoreAccess, JSON.stringify($scope.user), '', $window.deviceinfo];
                connect('restoreAccess', args);
            });
        };

        $scope.changePassSeries = function() {
            if ($scope.user.passSeries.length == 4) {
                angular.element('.passNumber').focus();
            }
        };

        $scope.changePassNumber = function() {
            if ($scope.user.passNumber.length == 0) {
                angular.element('.passSeries').focus();
            }
        };

        $scope.splitPassport = function() {
            var passport = angular.element('#passport').val().split(' ');
            $scope.user.passSeries = passport[0];
            $scope.user.passNumber = passport[1];
        };

        $scope.clearPassport = function() {
            $scope.user.passSeries = '';
            $scope.user.passNumber = '';
            setTimeout(function() {
                angular.element('.passSeries').focus();
            }, 10);
        };

        $scope.createLoginPassword = function() {
            if (!$scope.user.newLogin || $scope.user.newLogin === '') {
                alert('Введите логин', 'Авторизация');
                return;
            }
            if (!$scope.user.newPassword1 || $scope.user.newPassword1 === '') {
                alert('Введите пароль', 'Авторизация');
                return;
            }
            if (!$scope.user.newPassword2 || $scope.user.newPassword2 === '') {
                alert('Повторите пароль', 'Авторизация');
                return;
            }
            if ($scope.user.newPassword1 !== $scope.user.newPassword2) {
                alert('Пароли не совпадают', 'Авторизация');
                return;
            }
            $ionicLoading.show({
                templateUrl: 'templates/' + sys.getPlatform() + '/loading.html'
            });
            WebWorker.postMessage('createLoginPassword', 'createLoginPassword', [JSON.stringify($scope.user)]);
        };

        $scope.changeLoginPassword = function() {
            if ($scope.user.changePassword) {
                if ($scope.user.changeLogin && !$scope.user.newLogin) {
                    alert('Введите логин', 'Авторизация');
                    return;
                }
                if ($scope.user.requireOldPassword && !$scope.user.oldPassword) {
                    alert('Введите старый пароль', 'Авторизация');
                    return;
                }
                if (!$scope.user.newPassword1) {
                    alert('Введите новый пароль', 'Авторизация');
                    return;
                }
                if (!$scope.user.newPassword2) {
                    alert('Повторите новый пароль', 'Авторизация');
                    return;
                }
                if ($scope.user.newPassword1 !== $scope.user.newPassword2) {
                    alert('Новые пароли не совпадают', 'Авторизация');
                    return;
                }
            }
            if (!$scope.user.hasMobileTelephone && !$scope.user.mobileTelephone) {
                alert('Введите мобильный телефон', 'Авторизация');
                return;
            }
            $ionicLoading.show({
                templateUrl: 'templates/' + sys.getPlatform() + '/loading.html'
            });
            var actionStrId = $scope.user.hasMobileTelephone ? changePasswordActionStrId : changeMobilePhoneActionStrId;
            args = [actionStrId, JSON.stringify($scope.user)];
            WebWorker.postMessage('changeLoginPassword', 'changeLoginPassword', args);
        };

        function afterLogin() {
            WebWorker.invoke('invokeUserEntityMethodAsync', 'afterLogin').then(
                function(result) {
                    $rootScope.globals.successAfterLogin = true;
                    $rootScope.$broadcast('successAfterLogin');
                }
            );
        }

        /* переопределено действие назад, т.к. по кнопке "Выход" попадаем сюда и не должны возвращаться в приложение */
        $scope.back = function() {
            resetSessionTimeout();
            $state.go('start');
        };

        function resetSessionTimeout() {
            delete($scope.globals.sessionTimeout);
        }

        $scope.initChangeLoginPasswordPage = function() {
            if ($scope.user.changePassword && $scope.user.changeLogin) {
                $scope.user.title = 'Создайте новые логин и пароль';
                $scope.user.subTitle = $scope.messageForChangeLoginPassword;
            } else if ($scope.user.changePassword && !$scope.user.changeLogin) {
                $scope.user.title = 'Создайте новый пароль';
                $scope.user.subTitle = $scope.messageForChangePassword;
            } else if ($scope.user.changeMobileTelephone) {
                $scope.user.title = 'Задайте мобильный телефон';
                $scope.user.subTitle = undefined;
            }
        };
    }]);

}(window.AppConfig || {}));