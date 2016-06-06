var app = angular.module('app');

/**
 * Основная страница карты
 */
app.controller('CardCtrl', ['$scope', '$state', '$stateParams', '$filter', '$ionicPopover', '$ionicPopup', '$ionicLoading', 'sys', 'utils', 'cardSrv', 'productSrv', 'WebWorker',
function ($scope, $state, $stateParams, $filter, $ionicPopover, $ionicPopup, $ionicLoading, sys, utils, cardSrv, productSrv, WebWorker) {

    $scope.operationState = 'card.operation';
    $scope.activeTab = 'operations'; // активная вкладка "операции"
    $scope.bankCardList = cardSrv.getCardList();
    $scope.changeTab = function(tab) {
        $scope.activeTab = tab;
    };

    /* объект айдишников карт, для которых уже ушли запросы на получение данных для предотвращения повторных запросов при прокрутке карусели */
    var cardIdReq = {};

    $scope.slideHasChanged = function (index) {
        sys.buffer(function() {
            $scope.bankCard = $scope.bankCardList[index];
            cardSrv.setCurrentBankCard($scope.bankCard);
            productSrv.setCurrentProduct($scope.bankCard);

            $scope.updateCard();
            $scope.getOperationList();
            $scope.getLinkedProducts();
            $scope.getServices();

            /* выставляем признак отправки запросов для неповторения при прокрутке карусели */
            cardIdReq[$scope.bankCard.id] = true;
            $scope.$applyAsync();
        });
    };

    $scope.getOperationList = function(refresh) {
        if ((!cardIdReq[$scope.bankCard.id] && angular.isUndefined($scope.bankCard.operationList)) || refresh) {
            $scope.resetOperationList();
            productSrv.getLastOperationsForProduct($scope.bankCard).then(
                productSrv.resultGetLastOperationsForProduct($scope.bankCard)
            );
        }
    };

    $scope.resetOperationList = function() {
        $scope.bankCard.operationsDisplay = undefined;
        $scope.bankCard.visibleBtnExtract = null;
    };

    $scope.getLinkedProducts = function(refresh) {
        if ((!cardIdReq[$scope.bankCard.id] && angular.isUndefined($scope.bankCard.linkedProducts)) || refresh) {
            productSrv.getLinkedProductsForProduct($scope.bankCard)();
        }
    };

    $scope.getServices = function(refresh) {
        if ((!cardIdReq[$scope.bankCard.id] && angular.isUndefined($scope.bankCard.productServices)) || refresh) {
            $scope.getProductServices($scope.bankCard)();
        }
    };

    $scope.getProductServices = function(bankCard) {
        return function() {
            WebWorker.invoke('getProductServices', bankCard).then(
                function(result) {
                    var productServices = result.data || null;
                    bankCard.productServices = productServices;
                }
            );
        }
    };

    $scope.updateCard = function(refresh) {
        if ((!cardIdReq[$scope.bankCard.id] && !$scope.bankCard.isUpdatedABS) || refresh) {
            $scope.updateConcreteCard($scope.bankCard)();
        }
    };

    $scope.updateConcreteCard = function(product) {
        return function() {
            WebWorker.invoke('updateProduct', product).then(
                function(result) {
                    result.data.isUpdatedABS = true;    // в рамках сессии обновляем из АБС один раз, либо при pull to refresh
                    $scope.clone(product, result.data);

                    // Выполняем в последнем запросе, чтобы скрыть вейтер обновления информации при Pull to refresh.
                    $scope.$broadcast('scroll.refreshComplete');
                }
            );
        }
    };

    $scope.slideHasChanged($scope.activeSlide = cardSrv.getCardIdxById($stateParams.cardId));

    // Блокировка / разблокировка карт
    $scope.setBlocked = cardSrv.setBlocked;

    /* ------- Отправка реквизитов виртуальной карты ------- */
    $scope.sendVirtualCardRequisites = function() {

        $ionicLoading.show({
            templateUrl: 'templates/' + sys.getPlatform() + '/loading.html'
        });

        WebWorker.invoke('sendVirtualCardRequisites', $scope.bankCard).then(
            function(result) {
                $scope.popupData = { isSent: result.data || false };
                $ionicLoading.hide();
                $ionicPopup.alert({
                    title: 'Отправка CVC и номера карты',
                    template: $scope.popupData.isSent ? 'CVC и номер карты отправлены по SMS.' : 'Не удалось отправить CVC и номер карты по SMS. Попробуйте повторить позже.',
                    buttons: [{ text: 'Ок' }]
                });
            }
        );
    };

    /* ------- Top bar menu Popover ------- */
    $ionicPopover.fromTemplateUrl('templates/card/popover.html', {
        scope: $scope
    }).then(function(popover) {
        $scope.openPopover = function($event) {
            popover.show($event);
        };
        $scope.closePopover = function() {
            popover.hide();
        };
        $scope.$on('$destroy', function() {
            popover.remove();
        });
    });
    /* ------------------------------------ */

    $scope.toggleDisabled = function(card) {
        WebWorker.invoke('setDisabled', card);
    };

    $scope.toggleFavourite = function(card) {
        WebWorker.invoke('setIsFavourite', card);
    };

    $scope.showMoreOperations = function () {
        productSrv.showMoreOperations($scope.bankCard, $scope);
    };

    this.transliterate = function (text, engToRus) {
        return ISO9Transliterator.transliterate(text, engToRus);
    };

    /* Обновление информации при оттягивании страницы. Pull to refresh. */
    $scope.doRefresh = function() {
        $scope.resetOperationList();
        $scope.updateCard(true);
        $scope.getOperationList(true);
        $scope.getLinkedProducts(true);
        $scope.getServices(true);
        $scope.$applyAsync();
    };

    $scope.getProductSref = function(product) {
        return productSrv.getProductSref(product);
    };
}]);

/**
 * Реквизиты карты
 */
app.controller('BankCardRequisitesCtrl', ['$scope', '$state', '$ionicActionSheet', 'commonSrv', 'cardSrv', 'WebWorker', 'productSrv', '$ionicPopover', '$ionicPopup',
    function ($scope, $state, $ionicActionSheet, commonSrv, cardSrv, WebWorker, productSrv, $ionicPopover, $ionicPopup) {

        $scope.bankCard = productSrv.getCurrentProduct();

        if (!$scope.bankCard.requisites) {
            WebWorker.invoke('getReplenishmentDetails', $scope.bankCard).then(
                function(result) {
                    $scope.bankCard.requisites = result.data;
                }
            );
        }

        $scope.getRequisitesTitle = function() {
            if ($scope.bankCard.isVirtual) {
                return $scope.bankCard.requisites.virtualCardDataLabel;
            }
            return $scope.bankCard.requisites.cardAccountDataLabel;
        };

        function processingResults(data) {
                switch (data.cmdInfo) {
                    case 'sendEmail':
                        alert('Реквизиты будут отправлены на ' + $scope.email + '.\nОтправка обычно занимает не более 5 минут.');
                        break;
                }
                $scope.$apply();
        }
        WebWorker.setFunction(processingResults);

        $scope.retailClientEmail = $scope.retailClient && $scope.retailClient.email;
        $scope.sendSMS = function() {
            commonSrv.sendRequisitesBySMS($scope.bankCard.requisites);
        };

        $scope.sendEmail = function(email) {
            WebWorker.postMessage('sendEmail', 'sendEmail', [$scope.bankCard, email, 'REPLENISHMENT']);
        };

        /* Переход на страницу для отправки на почту (с вводом адреса) (для ios) */
        $scope.goSendEmail = function() {
            $state.go('card.sendEmail', {formType: 'REPLENISHMENT'});
        };

        /* Открыть popup для отправки на почту (с вводом адреса) (для android) */
        $scope.openPopupInputEmail = function () {
            $scope.popupData = { email: $scope.retailClientEmail };
            $ionicPopup.show({
                template: '<input input-clear-btn autofocus type="text" ng-model="popupData.email">',
                title: 'Отправить на почту',
                subTitle: 'E-mail',
                scope: $scope,
                cssClass: 'alert',
                buttons: [
                    {text: 'Отменить'},
                    {
                        text: 'Отправить',
                        onTap: function (e) {
                            if (!$scope.popupData.email) {
                                //Не позволяет закрыть окно пока пользователь не введет значение
                                e.preventDefault();
                            } else {
                                return $scope.popupData.email;
                            }
                        }
                    }
                ]
            }).then(function (email) {
                if (email) {
                    $scope.email = email;
                    $scope.sendEmail($scope.email);
                }
            });
        };

        /* Показать ActionSheet для выбора способа отправки реквизитов (для ios) */
        $scope.showSend = function() {

            var buttons = [];
            buttons.push({ text: 'Отправить по СМС' });
            if ($scope.retailClientEmail) { buttons.push({ text: $scope.retailClientEmail }); }
            buttons.push({ text: 'Отправить на e-mail' });

            $ionicActionSheet.show({
                buttons: buttons,
                buttonClicked: function(index) {
                    if ($scope.retailClientEmail) {
                        switch (index) {
                            case 0:
                                // Отправка по СМС
                                $scope.sendSMS();
                                return true;
                            case 1:
                                // Отправка на email пользователя
                                $scope.email = $scope.retailClientEmail;
                                $scope.sendEmail($scope.email);
                                return true;
                            case 2:
                                // Переход к экрану ввода email
                                $scope.goSendEmail();
                                return true;
                        }
                    } else {
                        switch (index) {
                            case 0:
                                // Отправка по СМС
                                $scope.sendSMS();
                                return true;
                            case 1:
                                // Переход к экрану ввода email
                                $scope.goSendEmail();
                                return true;
                        }
                    }
                },
                cancelText: 'Отмена'
            });
        };

        /* Показать Popover для выбора способа отправки реквизитов (для android) */
        $ionicPopover.fromTemplateUrl('templates/card/popover.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.openPopover = function($event) {
                popover.show($event);
            };
            $scope.closePopover = function() {
                popover.hide();
            };
            $scope.$on('$destroy', function() {
                popover.remove();
            });
        });

        $scope.popoverSendSMS = function() {
            $scope.closePopover();
            $scope.sendSMS();
        };

        $scope.popoverSendEmailClient = function() {
            $scope.closePopover();
            $scope.email = $scope.retailClientEmail;
            $scope.sendEmail($scope.email);
        };

        $scope.popoverOpenInputEmail = function() {
            $scope.closePopover();
            $scope.openPopupInputEmail();
        };
    }
]);

/**
 * Перевыпуск карты
 */
app.controller('ReissueCardCtrl', ['$scope', '$state', '$stateParams', '$ionicModal', '$timeout', 'sys', 'cardSrv', 'utils', 'WebWorker',
    function ($scope, $state, $stateParams, $ionicModal, $timeout, sys, cardSrv, utils, WebWorker) {
        $scope.form = {};

        // <для подтверждения одноразовым паролем>
        var args = [];
        var actionStrId = 'RetailConfirmRequestAction';
        // </для подтверждения одноразовым паролем>

        if ($scope.globals.dataObjectForSessionTimeout) {
            initBySessionTimeout();
        } else {
            init();
        }
        $scope.codifiers = [];
        $scope.codifierStrId = "";
        $scope.selectedCodifier = null;

        function initBySessionTimeout() {
            $scope.form = $scope.globals.dataObjectForSessionTimeout;
            delete($scope.globals.dataObjectForSessionTimeout);
            if ($scope.form.resultValue && $scope.form.resultValue == 'ConfirmBlock') {
                $scope.form.showConfirmBlockButton = true;
                $scope.form.requestAlreadySend = true;
            } else {
                $scope.form.requestAlreadySend = false;
            }
        }

        function init() {
            $scope.form.cardReissueReasons = [];
            $scope.form.selectedCardReissueReason = null;
            $scope.form.office = {};
            $scope.form.requestAlreadySend = false;
        }

        function processingResults(data) {
                    switch (data.cmdInfo) {
                        case 'sendRetailBankCardReissueRequest':
                            // <для подтверждения одноразовым паролем>
                            if (!data.result || data.result.code) {
                                $scope.confirmationHide();
                                $scope.form.requestAlreadySend = false;
                                alert('Не удалось выполнить операцию', 'Ошибка');
                            } else if (data.result.data == 'ConfirmBlock') {
                                $scope.form.resultValue = data.result.data;
                                $scope.form.showConfirmBlockButton = true;
                            } else if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                                $scope.form.resultValue = data.result.data;
                                $scope.form.requestAlreadySend = false;
                                $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm');
                            } else if (data.result.data == 'true') {
                                $scope.form.requestAlreadySend = true;
                                $scope.confirmationHide();

                                // Действия после успешной отправки.
                                alert('Заявка на перевыпуск карты принята в обработку').finally(function() {
                                    $scope.goBack();
                                });
                            } else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                                $scope.confirmationFalse(data.result.data);
                            } else if (data.result.data == 'rollback') {
                                $timeout(alert('Заявка отозвана'));
                                $scope.goBack();
                            } else if (data.result.data != 'true') {
                                $timeout(alert(data.result.data));
                                $scope.form.requestAlreadySend = false;
                            } else {
                                $scope.confirmationHide();
                                $scope.form.requestAlreadySend = false;
                            }
                            // </для подтверждения одноразовым паролем>
                            break;
                    }
                    $scope.$applyAsync();
        }

        WebWorker.setFunction(processingResults);
        $scope.saveDataForSessionTimeout($scope.form);
        WebWorker.invoke('getRetailCardReisRqData', cardSrv.getCurrentBankCard()).then(
            function(result) {
                $scope.form.requestData = result.data;
                $scope.form.showButton = $scope.form.requestData.isVirtual;

                /* перекладываем из мапа в список причины перевыпуска */
                $scope.form.cardReissueReasons = [];
                for (var key in $scope.form.requestData.reissueReasonMap) {
                    $scope.form.cardReissueReasons.push({value: key, desc: $scope.form.requestData.reissueReasonMap[key]});
                }
                $scope.form.selectedCardReissueReason = $scope.form.cardReissueReasons[0];

                /* перекладываем из мапа в список продукты для выбора */
                $scope.form.reissueProducts = [];
                for (var key in $scope.form.requestData.reissueProductMap) {
                    $scope.form.reissueProducts.push({
                        value: key,
                        desc: $scope.form.requestData.reissueProductMap[key].name,
                        commission: $scope.form.requestData.reissueProductMap[key].commission
                    });
                }
                $scope.form.selectedReissueProduct = $scope.form.reissueProducts[0];
            }
        );


        // <Панель для выбора кодификатора>
        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/card/select.codifier.html', function ($ionicModal) {
            $scope.selectCodifierPanel = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.onSelectCodifierPanel = function (codifiers, codifierStrId) {
            $scope.codifiers = codifiers;
            $scope.codifierStrId = codifierStrId;
            if ($scope.codifierStrId === 'CardReissueReason') {
                $scope.selectedCodifier = $scope.form.selectedCardReissueReason;
            } else if ($scope.codifierStrId === 'ReissueProduct') {
                $scope.selectedCodifier = $scope.form.selectedReissueProduct;
            }
            $scope.selectCodifierPanel.show();

        };

        $scope.clickCodifier = function (codifier) {
            $scope.selectCodifierPanel.hide();
            if ($scope.codifierStrId === 'CardReissueReason') {
                $scope.form.selectedCardReissueReason = codifier;
            } else if ($scope.codifierStrId === 'ReissueProduct') {
                $scope.form.selectedReissueProduct = codifier;
            }

            $scope.codifiers = [];
            $scope.codifierStrId = "";
            $scope.selectedCodifier = null;
            $scope.$applyAsync();
        };
        // </Панель для выбора кодификатора>

        $scope.showSendButton = function() {
            return $scope.form.requestData && $scope.form.requestData.embossedName && $scope.form.requestData.embossedLastName
                    && $scope.form.office.branch && !$scope.form.requestAlreadySend;
        };

        /* Отправка заявки на перевыпуск */
        $scope.reissueCard = function () {
            if ($scope.form.requestData.isVirtual) {
                args = [actionStrId, cardSrv.getCurrentBankCard(), JSON.stringify($scope.form.requestData), $scope.form.selectedCardReissueReason.value];
                $scope.saveDataForSessionTimeout($scope.form);
                WebWorker.postMessage('sendRetailBankCardReissueRequest', 'sendRetailBankCardReissueRequest', args);
            } else {
                var regexp = '^[A-Za-z]+[\.]?[A-Za-z]*$';
                if (!$scope.form.requestData.embossedLastName || !$scope.form.requestData.embossedName.match(regexp)) {
                    alert('Эмбоссированное имя клиента должно содержать только латинские буквы и символ "."');
                    return;
                }
                if (!$scope.form.requestData.embossedLastName || !$scope.form.requestData.embossedLastName.match(regexp)) {
                    alert('Эмбоссированная фамилия клиента должна содержать только латинские буквы и символ "-"');
                    return;
                }
                args = [actionStrId, cardSrv.getCurrentBankCard(), JSON.stringify($scope.form.requestData),
                    $scope.form.selectedCardReissueReason.value, $scope.form.selectedReissueProduct, $scope.form.office.branch.uuid];
                $scope.saveDataForSessionTimeout($scope.form);
                WebWorker.postMessage('sendRetailBankCardReissueRequest', 'sendRetailBankCardReissueRequest', args);
            }
            $scope.form.showButton = false;
            $scope.form.requestAlreadySend = true;
        };

        /* Подтверждение блокировки карты перед перевыпуском */
        $scope.confirmCardBlock = function () {
            args = ['ConfirmBlock', cardSrv.getCurrentBankCard(), JSON.stringify($scope.form.requestData),
                $scope.form.selectedCardReissueReason.value, $scope.form.selectedReissueProduct, $scope.form.office.branch.uuid];
            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage('sendRetailBankCardReissueRequest', 'sendRetailBankCardReissueRequest', args);
        };
}]);

/**
 * Подключение/отключение дополнительной опции
 */
app.controller('CardAdditionalOptionsConnectionCtrl', ['$scope', '$filter', '$stateParams', '$state', '$ionicModal', 'sys', 'cardSrv', 'commonSrv', 'WebWorker',
        function ($scope, $filter, $stateParams, $state, $ionicModal, sys, cardSrv, commonSrv, WebWorker) {
            $scope.form = {};

            // <для подтверждения одноразовым паролем>
            var args = [];
            var activateActionStrId = 'ConnectingServiceAction';
            var deactivateActionStrId = 'DisablingServiceAction';
            // </для подтверждения одноразовым паролем>

            $scope.codifiers = [];
            $scope.codifierStrId = "";
            $scope.selectedCodifier = null;

            if ($scope.globals.dataObjectForSessionTimeout) {
                initBySessionTimeout();
            } else {
                init();
            }

            function initBySessionTimeout() {
                $scope.form = $scope.globals.dataObjectForSessionTimeout;
                delete($scope.globals.dataObjectForSessionTimeout);
                $scope.form.requestAlreadySend = false;
                $scope.form.showButton = true;
            }

            function init() {
                $scope.form.bankCard = cardSrv.getCurrentBankCard();
                $scope.form.bankCardAdditionalOptions = cardSrv.getCurrentBankCardOptions();
                $scope.form.bankCardCurrencyIsoString = cardSrv.getCurrentBankCard().currency;

                $scope.form.showButton = false;
                $scope.form.option = $stateParams.option;
                $scope.form.hasBonusProgram = $stateParams.hasBonusProgram;
                $scope.form.requestAlreadySend = false;
                $scope.form.payMethods = undefined;
                $scope.form.roundingMethods = undefined;
            }

            $scope.isMoneyRound = function () {
                return !$scope.form.option.isActive && $scope.form.option.strId.indexOf("MM_MONEYBOX") != -1;
            };

            $scope.getDefaultPayMethod = function() {
                if ($scope.form.payMethods) {
                    for (var i = 0; i < $scope.form.payMethods.length; ++i) {
                        if ($scope.form.payMethods[i].value === 'MONEY') {
                            return $scope.form.payMethods[i];
                        }
                    }
                }
                return null;
            };

            $scope.initialize = function () {
                if ($scope.form.selectedPayMethod == null) {
                    $scope.form.selectedPayMethod = $scope.getDefaultPayMethod();
                }
                if ($scope.isMoneyRound() && $scope.form.selectedRoundMethod == null) {
                    $scope.form.selectedRoundMethod = $scope.form.roundingMethods && $scope.form.roundingMethods.length > 0 ? $scope.form.roundingMethods[0] : null;
                } else {
                    $scope.form.selectedRoundMethod = null;
                }
                $scope.codifiers = [];
                $scope.codifierStrId = "";
                $scope.selectedCodifier = null;
            };

            $scope.initialize();

            /* обновление услуг и опций после действия с ними */
            var getProductServices = function(bankCard) {
                return function() {
                    WebWorker.invoke('getProductServices', bankCard).then(
                        function(result) {
                            bankCard.productServices = result.data;
                        }
                    );
                };
            };

            function processingResults(data) {
                var matchResult = data.cmdInfo ? data.cmdInfo.match(/^([^\(]*)\(([^\)]*)\).*$/) : null;
                var command = matchResult ? matchResult[1] : data.cmdInfo;
                var params = $scope.$eval(matchResult ? matchResult[2] : null);
                params = angular.isObject(params) ? params : {};

                        switch (command) {
                            case 'getRetailPayMethodCodifier':
                                if (data.result) {
                                    $scope.form.payMethods = data.result.data;
                                    if ($scope.isMoneyRound()) {
                                        $scope.saveDataForSessionTimeout($scope.form);
                                        WebWorker.postMessage(
                                            'getEntitiesByCondition',
                                            'getRetailMoneyRoundCodifier',
                                            ['codifier', 'RetailMoneyRound', true]);
                                    } else {
                                        $scope.initialize();
                                        $scope.form.showButton = true;
                                    }
                                }
                                break;

                            case 'getRetailMoneyRoundCodifier':
                                if (data.result) {
                                    $scope.form.roundingMethods = data.result.data;
                                    $scope.initialize();
                                    $scope.form.showButton = true;
                                }
                                break;

                            case 'sendRetailProdOptRequest':
                                // <для подтверждения одноразовым паролем>
                                if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                                    $scope.form.showButton = true;
                                    $scope.form.requestAlreadySend = false;
                                    $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm');
                                    return;
                                } else if (data.result.data == 'true') {
                                    $scope.form.showButton = false;
                                    $scope.form.requestAlreadySend = true;
                                    $scope.confirmationHide();

                                    // Действия после успешной отправки.
                                    alert('Заявление на ' + ($scope.form.option.isActive ? 'отключение ' : 'подключение ') +
                                            'опции ' + $scope.form.option.name + ' принято в обработку')
                                        .finally(function() {
                                            $scope.goBack();
                                        });
                                    getProductServices($scope.form.bankCard)();
                                } else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                                    $scope.confirmationFalse(data.result.data);
                                    return;
                                } else {
                                    $scope.confirmationHide();
                                    $scope.form.showButton = true;
                                    $scope.form.requestAlreadySend = false;
                                    alert(data.result.data);
                                }
                                // </для подтверждения одноразовым паролем>
                                break;
                        }
                        $scope.$apply();
            }

            WebWorker.setFunction(processingResults);
            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage(
                'getEntitiesByCondition',
                'getRetailPayMethodCodifier',
                ['codifier', 'RetailPayMethod', ($scope.form.option.canPayBonuses && $scope.form.hasBonusProgram ? true : 'value != "BONUS_POINTS"')]);

            // <Панель для выбора кодификатора>
            $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/card/select.codifier.html', function($ionicModal) {
                $scope.selectCodifierPanel = $ionicModal;
            }, {
                scope: $scope
            });

            $scope.onSelectCodifierPanel = function (codifiers, codifierStrId) {
                $scope.codifiers = codifiers;
                $scope.codifierStrId = codifierStrId;
                if ($scope.codifierStrId === 'RetailPayMethod') {
                    $scope.selectedCodifier = $scope.form.selectedPayMethod;
                } else if ($scope.codifierStrId === 'RetailMoneyRound') {
                    $scope.selectedCodifier = $scope.form.selectedRoundMethod;
                }
                $scope.selectCodifierPanel.show()
            };

            // </Панель для выбора кодификатора>

            $scope.clickCodifier = function(codifier) {
                $scope.selectCodifierPanel.hide();
                if ($scope.codifierStrId === 'RetailPayMethod') {
                    $scope.form.selectedPayMethod = codifier;
                } else if ($scope.codifierStrId === 'RetailMoneyRound') {
                    $scope.form.selectedRoundMethod = codifier;
                }

                $scope.codifiers = [];
                $scope.codifierStrId = "";
                $scope.selectedCodifier = null;
            };

            $scope.showPhoneInput = function () {
                return !$scope.form.option.isActive && $scope.form.option.strId.indexOf("MM_MOBILE") != -1 || $scope.form.option.strId.indexOf("MM_PIGGYPLUS") != -1;
            };

            $scope.validate = function() {
                if ($scope.form.selectedPayMethod == null) {
                    alert('Укажите способ оплаты');
                    return false;
                }
                if ($scope.showPhoneInput()
                    && !($scope.form.phoneNumber && $scope.form.phoneNumber.match(/^\d{10}$/ig))) {
                    alert('Неправильно введён номер');
                    return false;
                }
                if ($scope.isMoneyRound() && $scope.form.selectedRoundMethod == null) {
                    alert('Укажите округление');
                    return false;
                }
                return true;
            };

            $scope.sendRetailProdOptRequest = function () {
                if ($scope.form.option.isActive) {
                    $scope.form.requestAlreadySend = true;
                    $scope.form.showButton = false;
                    args = [deactivateActionStrId, cardSrv.getCurrentBankCard(), $scope.form.option.strId, 'DEACTIVATE'];
                    $scope.saveDataForSessionTimeout($scope.form);
                    WebWorker.postMessage("sendRetailProdOptRequest", "sendRetailProdOptRequest", args);
                } else {
                    if ($scope.validate()) {
                        $scope.form.requestAlreadySend = true;
                        $scope.form.showButton = false;
                        args = [activateActionStrId, cardSrv.getCurrentBankCard(), $scope.form.option.strId, 'ACTIVATE', $scope.form.selectedPayMethod.value,
                            $scope.isMoneyRound() ? $scope.form.selectedRoundMethod.value : null,
                            $scope.showPhoneInput() ? $scope.form.phoneNumber : null,
                            $scope.form.option.amount
                        ];
                        $scope.saveDataForSessionTimeout($scope.form);
                        WebWorker.postMessage("sendRetailProdOptRequest", "sendRetailProdOptRequest", args);
                    }
                }
            };

        }
]);


/**
 * Страхование
 */
app.controller('CardInsuranceCtrl', ['$scope', '$state', '$ionicModal', 'cardSrv', 'commonSrv', 'WebWorker', 'sys',
    function ($scope, $state, $ionicModal, cardSrv, commonSrv, WebWorker, sys) {
        $scope.form = {};

        // <для подтверждения одноразовым паролем>
        var args = [];
        var actionStrId = 'ConnectingServiceAction';
        // </для подтверждения одноразовым паролем>

        if ($scope.globals.dataObjectForSessionTimeout) {
            initBySessionTimeout();
        } else {
            init();
        }

        function initBySessionTimeout() {
            $scope.form = $scope.globals.dataObjectForSessionTimeout;
            delete($scope.globals.dataObjectForSessionTimeout);
            $scope.form.requestAlreadySend = false;
            $scope.form.showButton = true;
        }

        function init() {
            $scope.form.bankCard = cardSrv.getCurrentBankCard();
            $scope.form.option = cardSrv.getCurrentBankCard().productServices.insurance;
            $scope.form.cardInsuranceParams = [];
            $scope.form.cardInsuranceCompanies = [];
            $scope.form.requestAlreadySend = false;
            $scope.form.selectedCardInsurance = null;
            $scope.form.selectedInsuranceCompany = null;
            $scope.form.showButton = false;
        }

        $scope.initializeInsurance = function () {
            if ($scope.form.selectedCardInsurance == null && $scope.form.cardInsuranceParams.length > 0) {
                $scope.form.selectedCardInsurance = $scope.form.cardInsuranceParams[0];
            }

            if ($scope.form.selectedCardInsurance != null) {
                $scope.form.cardInsuranceCompanies = $scope.form.selectedCardInsurance.insuranceCompanyList;
                if ($scope.form.selectedInsuranceCompany == null && $scope.form.cardInsuranceCompanies != null && $scope.form.cardInsuranceCompanies.length > 0) {
                    $scope.form.selectedInsuranceCompany = $scope.form.cardInsuranceCompanies[0];
                }
            }

            $scope.codifiers = [];
            $scope.codifierStrId = "";
            $scope.selectedCodifier = null;
        };

        $scope.initializeInsurance();

        function processingResults(data) {
            var matchResult = data.cmdInfo ? data.cmdInfo.match(/^([^\(]*)\(([^\)]*)\).*$/) : null;
            var command = matchResult ? matchResult[1] : data.cmdInfo;
            var params = $scope.$eval(matchResult ? matchResult[2] : null);
            params = angular.isObject(params) ? params : {};

            switch (command) {
                        case 'isActiveCardInsurance':
                            var card = cardSrv.getCardById(params.cardId);
                            if (card) {
                                var insuranceData = $scope.$eval(data.result ? data.result.data : null);
                                card.isActiveInsurance = insuranceData.isActiveInsurance;
                            }
                            break;

                        case 'getRetailCardInsuranceParams':
                            if (data.result) {
                                $scope.form.cardInsuranceParams = data.result.data;
                                $scope.initializeInsurance();
                                $scope.form.showButton = true;
                            }
                            break;

                        case 'sendRetailCardInsuranceRequest':
                            // <для подтверждения одноразовым паролем>
                            if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                                $scope.form.showButton = true;
                                $scope.form.requestAlreadySend = false;
                                $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm');
                                return;
                            } else if (data.result.data == 'true') {
                                $scope.form.showButton = false;
                                $scope.form.requestAlreadySend = true;
                                $scope.confirmationHide();

                                // Действия после успешной отправки.
                                alert('Заявление на подключение услуги страхования принято в обработку.')
                                    .finally(function() {
                                        $scope.goBack();
                                    });
                                delete $scope.form.bankCard.isActiveInsurance;
                                WebWorker.postMessage('isActiveCardInsurance', 'isActiveCardInsurance({cardId: ' + $scope.form.bankCard.id + '})', [$scope.form.bankCard.uuid]);
                            } else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                                $scope.confirmationFalse(data.result.data);
                                return;
                            } else {
                                $scope.confirmationHide();
                                $scope.form.showButton = true;
                                $scope.form.requestAlreadySend = false;
                                alert(data.result.data);
                            }
                            // </для подтверждения одноразовым паролем>
                            break;
                    }
                    $scope.$apply();
        }

        WebWorker.setFunction(processingResults);
        $scope.saveDataForSessionTimeout($scope.form);
        WebWorker.postMessage('getRetailCardInsuranceParams', 'getRetailCardInsuranceParams', [cardSrv.getCurrentBankCard().uuid]);

        // <Панель для выбора кодификатора>
        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/card/select.codifier.html', function ($ionicModal) {
            $scope.selectCodifierPanel = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.onSelectCodifierPanel = function (codifiers, codifierStrId) {
            $scope.codifiers = codifiers;
            $scope.codifierStrId = codifierStrId;
            if ($scope.codifierStrId === 'CardInsuranceParams') {
                $scope.selectedCodifier = $scope.form.selectedCardInsurance;
            } else if ($scope.codifierStrId === 'CardInsuranceCompanies') {
                $scope.selectedCodifier = $scope.form.selectedInsuranceCompany;
            }
            $scope.selectCodifierPanel.show()
        };

        $scope.clickCodifier = function (codifier) {
            $scope.selectCodifierPanel.hide();
            if ($scope.codifierStrId === 'CardInsuranceParams') {
                if ($scope.form.selectedCardInsurance.value != codifier.value) {
                    $scope.form.selectedCardInsurance = codifier;
                    $scope.form.cardInsuranceCompanies = $scope.form.selectedCardInsurance.insuranceCompanyList;
                    $scope.form.selectedInsuranceCompany = $scope.form.cardInsuranceCompanies[0];
                }
            } else if ($scope.codifierStrId === 'CardInsuranceCompanies') {
                $scope.form.selectedInsuranceCompany = codifier;
            }

            $scope.codifiers = [];
            $scope.codifierStrId = "";
            $scope.selectedCodifier = null;
        };
        // </Панель для выбора кодификатора>

        $scope.sendRetailCardInsuranceRequest = function () {
            args = [actionStrId, cardSrv.getCurrentBankCard(), $scope.form.selectedInsuranceCompany.insOptionStrId, $scope.form.selectedInsuranceCompany.amount];
            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage("sendRetailCardInsuranceRequest", "sendRetailCardInsuranceRequest", args);
            $scope.form.requestAlreadySend = true;
            $scope.form.showButton = false;
        };

}]);


/**
 * Список автоплатежей
 */
app.controller('CardAutoPayListCtrl', ['$scope', '$filter', '$stateParams', '$state', '$ionicModal', 'sys', 'cardSrv', 'commonSrv', 'WebWorker',
    function ($scope, $filter, $stateParams, $state, $ionicModal, sys, cardSrv, commonSrv, WebWorker) {

        $scope.bankCard = $stateParams.bankCard || cardSrv.getCurrentBankCard();

        function processingResults(data) {
            switch (data.cmdInfo) {
                case 'getAutoPayBalanceParams':
                    $scope.autoPayList = data.result.data.autoPayList;
                    $scope.description = data.result.data.description;
                    break;
            }
            $scope.$apply();
        }

        WebWorker.setFunction(processingResults);
        WebWorker.postMessage('getAutoPayBalanceParams', 'getAutoPayBalanceParams', [$scope.bankCard]);


        $scope.redirectToAutoPay = function(autoPay) {
            var params;
            if (autoPay) {
                var phone;
                if (autoPay.phone) {
                    // 094490: MTS: ФТбанк. Платежи: Не открывается форма редактирования автоплатежа.
                    // На длину специально не проверяется, чтобы вместо умалчивания о проблеме в случае повторения ошибки разбирались на сервере,
                    // откуда такой кривой телефон в автоплатеже появился.
                    // По-хорошему и на null проверять не стоило бы, но на стенде банка уже есть такие записи.
                    // Тем более, в текущем случае мы клиентские данные никак не модифицируем, но всё же при этом получаем открываемость панели.
                    phone = autoPay.phone.substring(2);
                }
                params = {bankCard: $scope.bankCard, description: $scope.description, optionId: autoPay.id, phone: phone, sum: autoPay.sum, threshold: autoPay.threshold};
            } else {
                params =  {bankCard: $scope.bankCard, description: $scope.description};
            }
            $state.go(
                'autopay',
                params,
                {location: 'replace'}
            );
        }
    }
]);


/**
 * Подключение/изменение/отключение автоплатежа
 */
app.controller('CardAutoPayCtrl', ['$scope', '$filter', '$stateParams', '$state', '$ionicModal', 'sys', 'cardSrv', 'commonSrv', 'WebWorker',
    function ($scope, $filter, $stateParams, $state, $ionicModal, sys, cardSrv, commonSrv, WebWorker) {
        $scope.form = {};

        // <для подтверждения одноразовым паролем>
        var args = [];
        var activateActionStrId = 'ConnectingServiceAction';
        var deactivateActionStrId = 'DisablingServiceAction';
        // </для подтверждения одноразовым паролем>

        if ($scope.globals.dataObjectForSessionTimeout) {
            initBySessionTimeout();
        } else {
            init();
        }

        function initBySessionTimeout() {
            $scope.form = $scope.globals.dataObjectForSessionTimeout;
            delete($scope.globals.dataObjectForSessionTimeout);
            $scope.form.showButton = true;
            $scope.form.requestAlreadySend = false;
        }

        function init() {
            $scope.form.bankCard = $stateParams.bankCard;
            $scope.form.description = $stateParams.description;
            $scope.form.autoPay = {};
            initAutoPay();
        }

        function initAutoPay() {
            $scope.form.autoPay.optionId = $stateParams.optionId;
            $scope.form.autoPay.phone = $stateParams.phone;
            $scope.form.autoPay.sum = $stateParams.sum;
            $scope.form.autoPay.threshold = $stateParams.threshold;
        }

        $scope.form.showButton = true;
        $scope.form.requestAlreadySend = false;

        function processingResults(data) {
            switch (data.cmdInfo) {
                case 'sendRetailAutoPayRequest':
                    // <для подтверждения одноразовым паролем>
                    if (data.result && data.result.data.hasErrors) {
                        $scope.form.showButton = true;
                        $scope.form.requestAlreadySend = false;
                        alert(data.result.data.error, 'Обратите внимание!');
                    } else if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                        $scope.form.showButton = true;
                        $scope.form.requestAlreadySend = false;
                        $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm');
                        return;
                    } else if (data.result.data === true || data.result.data == 'true') {
                        $scope.form.showButton = false;
                        $scope.form.requestAlreadySend = true;
                        $scope.confirmationHide();

                        // Действия после успешной отправки.
                        alert('Принято в обработку').finally(function() {
                            $scope.goBack();
                        });
                    } else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                        $scope.confirmationFalse(data.result.data);
                        return;
                    } else {
                        $scope.confirmationHide();
                        $scope.form.showButton = true;
                        $scope.form.requestAlreadySend = false;
                        alert(data.result.data);
                    }
                    // </для подтверждения одноразовым паролем>
                    break;
            }
            $scope.$apply();
        }
        WebWorker.setFunction(processingResults);

        $scope.validate = function() {
            if (!($scope.form.autoPay.phone && $scope.form.autoPay.phone.match(/^\d{10}$/ig))) {
                alert('Неправильно введён номер');
                return false;
            }
            return true;
        };

        $scope.sendAutoBalancePayReq = function(action) {
            if ('DEACTIVATE' == action || $scope.validate()) {
                args = [getActionStrId(action), $scope.form.bankCard, $scope.form.autoPay.optionId, $scope.form.autoPay.phone, $scope.form.autoPay.sum, $scope.form.autoPay.threshold, action];
                $scope.form.requestAlreadySend = true;
                $scope.form.showButton = false;
                $scope.saveDataForSessionTimeout($scope.form);
                WebWorker.postMessage("sendRetailAutoPayRequest", "sendRetailAutoPayRequest", args);
            }
        };

        function getActionStrId(action) {
            switch (action) {
                case 'ACTIVATE' :
                    return activateActionStrId;
                case 'DEACTIVATE' :
                    return deactivateActionStrId;
                default :
                    return "CHANGE";
            }
        }

        $scope.showConnectButton = function() {
            return !$scope.form.autoPay.optionId;
        };

        $scope.showEditOrDeleteButton = function() {
            return $scope.form.autoPay.optionId;
        };

        $scope.connectAutoPay = function() {
            $scope.sendAutoBalancePayReq('ACTIVATE');
        };

        $scope.editAutoPay = function() {
            $scope.sendAutoBalancePayReq('CHANGE');
        };

        $scope.deleteAutoPay = function() {
            initAutoPay();
            $scope.sendAutoBalancePayReq('DEACTIVATE');
        };

    }
]);

/**
 * Подключение/отключение дополнительной опции
 */
app.controller('ConnectOptionCtrl', ['$scope', '$filter', '$stateParams', '$state', '$ionicModal', 'sys', 'cardSrv', 'commonSrv', 'WebWorker',
    function ($scope, $filter, $stateParams, $state, $ionicModal, sys, cardSrv, commonSrv, WebWorker) {
        $scope.form = {};

        // <для подтверждения одноразовым паролем>
        var args = [];
        var activateActionStrId = 'ConnectingServiceAction';
        var deactivateActionStrId = 'DisablingServiceAction';
        // </для подтверждения одноразовым паролем>

        if ($scope.globals.dataObjectForSessionTimeout) {
            initBySessionTimeout();
        } else {
            init();
        }

        function initBySessionTimeout() {
            $scope.form = $scope.globals.dataObjectForSessionTimeout;
            delete($scope.globals.dataObjectForSessionTimeout);
            $scope.form.showButton = true;
            $scope.form.requestAlreadySend = false;
        }

        function init() {
            $scope.form.bonus = $stateParams.bonus;
            $scope.form.requestAlreadySend = false;
            $scope.form.payMethods = undefined;
            $scope.form.roundingMethods = undefined;
            $scope.form.paymentSourceList = undefined;

            if ($stateParams.product) {
                $scope.form.sourceProduct = $stateParams.product;
                $scope.form.isDeactivate = $stateParams.isDeactivate ? $stateParams.isDeactivate : false;
                $scope.form.showButton = true;
            } else {
                $scope.form.isDeactivate = false;
                $scope.form.showButton = false;
            }
        }

        $scope.isMoneyRound = function () {
            return $scope.form.bonus.optionStrId.indexOf("MM_MONEYBOX") != -1;
        };

        $scope.getDefaultPayMethod = function() {
            if ($scope.form.payMethods) {
                for (var i = 0; i < $scope.form.payMethods.length; ++i) {
                    if ($scope.form.payMethods[i].value === 'MONEY') {
                        return $scope.form.payMethods[i];
                    }
                }
            }
            return null;
        };

        $scope.initialize = function () {
            if ($scope.form.selectedPayMethod == null) {
                $scope.form.selectedPayMethod = $scope.getDefaultPayMethod();
            }

            if ($scope.isMoneyRound() && $scope.form.selectedRoundMethod == null) {
                $scope.form.selectedRoundMethod = $scope.form.roundingMethods && $scope.form.roundingMethods.length > 0 ? $scope.form.roundingMethods[0] : null;
            } else {
                $scope.form.selectedRoundMethod = null;
            }

            $scope.codifiers = [];
            $scope.codifierStrId = "";
            $scope.selectedCodifier = null;
        };

        $scope.initialize();

        /* обновление услуг и опций после действия с ними */
        var getProductServices = function(product) {
            return function() {
                WebWorker.invoke('getProductServices', product).then(
                    function(result) {
                        product.productServices = result.data;
                    }
                );
            }
        };

        function processingResults(data) {
            var matchResult = data.cmdInfo ? data.cmdInfo.match(/^([^\(]*)\(([^\)]*)\).*$/) : null;
            var command = matchResult ? matchResult[1] : data.cmdInfo;
            var params = $scope.$eval(matchResult ? matchResult[2] : null);
            params = angular.isObject(params) ? params : {};

            switch (command) {
                case 'getRetailPayMethodCodifier':
                    if (data.result) {
                        $scope.form.payMethods = data.result.data;
                        if ($scope.isMoneyRound()) {
                            $scope.saveDataForSessionTimeout($scope.form);
                            WebWorker.postMessage(
                                'getEntitiesByCondition',
                                'getRetailMoneyRoundCodifier',
                                ['codifier', 'RetailMoneyRound', true]);
                        } else {
                            $scope.initialize();
                            $scope.form.showButton = true;
                        }
                    }
                    break;

                case 'getRetailMoneyRoundCodifier':
                    if (data.result) {
                        $scope.form.roundingMethods = data.result.data;
                        $scope.initialize();
                        $scope.form.showButton = true;
                    }
                    break;

                case 'sendRetailProdOptRequest':
                    // <для подтверждения одноразовым паролем>
                    if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                        $scope.form.showButton = true;
                        $scope.form.requestAlreadySend = false;
                        $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm');
                        return;
                    } else if (data.result.data == 'true') {
                        $scope.form.showButton = false;
                        $scope.form.requestAlreadySend = true;
                        $scope.confirmationHide();

                        // Действия после успешной отправки.
                        alert('Заявка принята в обработку').finally(function() {
                            $scope.goBack();
                        });

                        getProductServices($scope.form.sourceProduct)();
                    } else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                        $scope.confirmationFalse(data.result.data);
                        return;
                    } else {
                        $scope.confirmationHide();
                        $scope.form.showButton = true;
                        $scope.form.requestAlreadySend = false;
                        alert(data.result.data);
                    }
                    // </для подтверждения одноразовым паролем>
                    break;
            }
            $scope.$apply();
        }

        WebWorker.setFunction(processingResults);

        if (!$scope.form.isDeactivate) {
            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage(
                'getEntitiesByCondition',
                'getRetailPayMethodCodifier',
                ['codifier', 'RetailPayMethod', true]);
        }

        if (!$scope.form.sourceProduct) {
            WebWorker.invoke('getSourceListForOption', $scope.form.bonus.optionStrId).then(function(result){
                $scope.form.paymentSourceList = result.data;
            });
        }

        // <Панель для выбора кодификатора>
        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/card/select.codifier.html', function($ionicModal) {
            $scope.selectCodifierPanel = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.onSelectCodifierPanel = function (codifiers, codifierStrId) {
            $scope.codifiers = codifiers;
            $scope.codifierStrId = codifierStrId;
            if ($scope.codifierStrId === 'RetailPayMethod') {
                //($scope.bonus.canPayBonuses && $scope.bonus.hasBonusProgram ? true : 'value != "BONUS_POINTS"')
                if ($scope.form.bonus.canPayBonuses && $scope.form.sourceProduct.hasBonusProgram) {
                    $scope.codifiers = $filter('filter')(codifiers, {value : "!BONUS_POINTS"});
                }
                $scope.selectedCodifier = $scope.form.selectedPayMethod;
            } else if ($scope.codifierStrId === 'RetailMoneyRound') {
                $scope.selectedCodifier = $scope.form.selectedRoundMethod;
            }
            $scope.selectCodifierPanel.show()
        };

        $scope.clickCodifier = function(codifier) {
            $scope.selectCodifierPanel.hide();
            if ($scope.codifierStrId === 'RetailPayMethod') {
                $scope.form.selectedPayMethod = codifier;
            } else if ($scope.codifierStrId === 'RetailMoneyRound') {
                $scope.form.selectedRoundMethod = codifier;
            }

            $scope.codifiers = [];
            $scope.codifierStrId = "";
            $scope.selectedCodifier = null;
        };
        // </Панель для выбора кодификатора>

        // <выбор продукта>
        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/selectproduct.html', function($ionicModal) {
            $scope.selectProduct = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.selectProductShow = function(productList, resultId) {
            $scope.resultId = resultId;
            $scope.cardList = [];
            $scope.loanList = [];
            $scope.accountList = [];
            $scope.depositList = [];
            for (var i = 0; i < productList.length; i++) {
                if (productList[i].entityKind == 'BankCard') {
                    $scope.cardList.push(productList[i]);
                } else if (productList[i].entityKind == 'RetailLoan') {
                    $scope.loanList.push(productList[i]);
                } else if (productList[i].entityKind == 'RetailAccount') {
                    $scope.accountList.push(productList[i]);
                } else if (productList[i].entityKind == 'RetailDeposit') {
                    $scope.depositList.push(productList[i]);
                }
            }
            $scope.selectProduct.show();
        };

        $scope.clickProduct = function(product) {
            $scope.selectProduct.hide();
            $scope.form[$scope.resultId] = product;
            $scope.form.selectedPayMethod = $scope.getDefaultPayMethod();
        };
        // </выбор продукта>

        $scope.showPhoneInput = function () {
            return $scope.form.bonus.optionStrId.indexOf("MM_MOBILE") != -1 || $scope.form.bonus.optionStrId.indexOf("MM_PIGGYPLUS") != -1;
        };

        $scope.validate = function() {
            if ($scope.form.selectedPayMethod == null) {
                alert('Укажите способ оплаты');
                return false;
            }
            if ($scope.showPhoneInput()
                && !($scope.form.phoneNumber && $scope.form.phoneNumber.match(/^\d{10}$/ig))) {
                alert('Неправильно введён номер');
                return false;
            }
            if ($scope.isMoneyRound() && $scope.form.selectedRoundMethod == null) {
                alert('Укажите округление');
                return false;
            }
            return true;
        };

        $scope.sendRetailProdOptRequest = function (isActivate) {
            $scope.form.requestAlreadySend = true;
            $scope.form.showButton = false;
            args = isActivate
                ? [activateActionStrId, $scope.form.sourceProduct, $scope.form.bonus.optionStrId, "ACTIVATE",
                    $scope.form.selectedPayMethod.value,
                    $scope.isMoneyRound() ? $scope.form.selectedRoundMethod.value : null,
                    $scope.showPhoneInput() ? $scope.form.phoneNumber : null,
                    $scope.form.selectedPayMethod.value == 'MONEY' ? $scope.form.bonus.serviceCost : $scope.form.bonus.serviceCostBonus
            ]
                : [deactivateActionStrId, $scope.form.sourceProduct, $scope.form.bonus.optionStrId, "DEACTIVATE"]
            ;
            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage("sendRetailProdOptRequest", "sendRetailProdOptRequest", args);
        };

        $scope.activateProductOption = function() {
            if ($scope.validate()) {
                $scope.sendRetailProdOptRequest(true);
            }
        };

        $scope.deactivateProductOption = function() {
            $scope.sendRetailProdOptRequest(false);
        };

    }
]);

/**
 * Бонусы
 */
app.controller('CardBonusesCtrl', ['$scope', '$state', 'commonSrv', 'cardSrv', 'WebWorker', 'productSrv',
    function ($scope, $state, commonSrv, cardSrv, WebWorker, productSrv) {

        $scope.currentProduct = productSrv.getCurrentProduct();

        var processingResults = function (data) {
            switch (data.cmdInfo) {
                case 'getCardBonusInfo':
                    $scope.availableBonuses = null;
                    $scope.interestingBonuses = null;
                    $scope.myBonuses = null;
                    if (data && data.result) {
                        $scope.availableBonuses = data.result.data.availableBonuses;
                        $scope.interestingBonuses = data.result.data.interestingBonuses;
                        $scope.myBonuses = data.result.data.myBonuses;
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                    break;
            }
            $scope.$applyAsync();
        };
        WebWorker.setFunction(processingResults);

        WebWorker.postMessage('getCardBonusInfo', 'getCardBonusInfo', [$scope.currentProduct]);

        $scope.doRefresh = function(){
            WebWorker.postMessage('getCardBonusInfo', 'getCardBonusInfo', [$scope.currentProduct, true]);
        };

    }
]);

/**
 * Выписка по бонусам
 * Не реализована
 */
app.controller('CardExtractBonusesCtrl', ['$scope', '$state', '$stateParams', '$filter', 'WebWorker', 'paymentSrv', 'productSrv', 'sys',
    function ($scope, $state, $stateParams, $filter, WebWorker, paymentSrv, productSrv, sys) {

        $scope.currentProduct = productSrv.getCurrentProduct();
        $scope.bonus = $stateParams.bonus;

        $scope.setOperationType = function(type) {
            $scope.operationType = type;
        };

        $scope.showSettings = false;
        $scope.operationState = 'card.bonusextract.operation';

        function processingResults(data) {
            switch (data.cmdInfo) {
                case 'getExtractForBonuses':
                    $scope.operationList = data.result.data && data.result.data.operationList || [];

                    $scope.totalSaved = (
                        data.result.data
                        && data.result.data.totalBonusDebit
                        && data.result.data.totalBonusDebit[$scope.bonus.optionStrId]
                        || 0
                    ) + ' баллов';

                    $scope.totalSpent = (
                        data.result.data
                        && data.result.data.totalBonusCredit
                        && data.result.data.totalBonusCredit[$scope.bonus.optionStrId]
                        || 0
                    ) + ' баллов';

                    break;
            }
            $scope.$apply();
        }
        WebWorker.setFunction(processingResults);

        WebWorker.postMessage('getExtractForBonuses', 'getExtractForBonuses', [$scope.currentProduct, $scope.bonus.optionStrId]);

        $scope.redirectToDeactivateOption = function(bonus) {
            $state.go('addoption', {bonus: $scope.bonus, product: $scope.currentProduct, isDeactivate: true}, {location: 'replace'});
        };
    }
]);

app.controller('CardExtractBonusesFilterCtrl', ['$scope', '$state', '$stateParams', '$document', '$filter', 'WebWorker', 'paymentSrv', 'productSrv', 'sys',
    function ($scope, $state, $stateParams, $document, $filter, WebWorker, paymentSrv, productSrv, sys) {

        // defaults
        var defaultParams = {
            operationType: 'any',
            fromDate: new Date(),
            toDate: new Date()
        };
        // Создаем deep copy вместо копирования ссылок
        angular.extend(defaultParams, {products: angular.copy($scope.bonus.products)});
        // По умолчанию все продукты должны быть выбраны
        for (var i = 0; i < defaultParams.products.length; i++) {
            defaultParams.products[i].selected = true;
        }

        $scope.filterForm = $state.params.filterParams = ($scope.filterParams ? angular.extend({}, $scope.filterParams) : defaultParams);

        var processingResults = function(data) {
            var matchResult = data.cmdInfo ? data.cmdInfo.match(/^([^\(]*)\(([^\)]*)\).*$/) : null;
            var command = matchResult ? matchResult[1] : data.cmdInfo;
            var params = $scope.$eval(matchResult ? matchResult[2] : null);
            params = angular.isObject(params) ? params : {};

            switch (command) {
                case 'getExtractForBonuses':
                    $scope.filteredOperationList = data.result.data && data.result.data.operationList || [];
                    break;
                case 'sendExtractToEmail':
                    alert('Выписка будет отправлена на ' + params.email
                    + '\nОтправка обычно занимает не более 5 минут' );
                    break;
            }
            $scope.$applyAsync();
        };
        WebWorker.setFunction(processingResults);

        $scope.getExtractForBonuses = function(){
            var params = $scope.filterForm;
            var selectedProducts = $filter('filter')(params.products, {selected: true});
            if (!selectedProducts.length) {
                alert('Выберите продукты!');
                return false;
            }

            delete $scope.filteredOperationList;
            WebWorker.postMessage('getExtractForBonuses', 'getExtractForBonuses', [
                $scope.currentProduct, $scope.bonus.optionStrId, params.fromDate, params.toDate, params.operationType
            ]);
            $scope.$applyAsync();

            return true;
        };

        $scope.sendExtract = function() {
            var errors = '';

            var params = $scope.filterForm;
            var selectedProducts = $filter('filter')(params.products, {selected: true});
            if (!selectedProducts.length) {
                errors += 'Выберите продукты\n';
            }

            if (!$scope.filterForm.email || !$scope.filterForm.email.match(/.+\@.+\..+/ig)) {
                errors += 'Заполните E-mail\n';
            }

            if (errors.length > 0) {
                alert(errors);
                return;
            }

            WebWorker.postMessage(
                'sendEmail',
                'sendExtractToEmail({email: \"' + $scope.filterForm.email.replace(/"/g, '\\"').replace(/\\/g, '\\\\') + '\"})',
                [
                    $scope.currentProduct, $scope.filterForm.email, 'EXTRACT',
                    $scope.filterForm.fromDate, $scope.filterForm.toDate
                ]
            );
        };

        var deregister = $scope.$on('bonusExtractRightBtnClick', function(){
            if ($scope.getExtractForBonuses()) {
                deregister();
                $scope.bonusExtractHeaderBtns.rbtn = 'icon-send';
                $scope.showFilterBtn = true;
                deregister = $scope.$on('bonusExtractRightBtnClick', function(){
                    deregister();
                    $scope.bonusExtractHeaderBtns.rbtn = '';
                    $scope.showFilterBtn = false;
                    $scope.showSendBtn = true;
                });
            }
        });
    }
]);