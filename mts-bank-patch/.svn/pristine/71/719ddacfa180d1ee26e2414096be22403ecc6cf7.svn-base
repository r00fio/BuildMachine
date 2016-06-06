var app = angular.module('app');

/**
 * Перевод между своими счетами и картами
 */
app.controller('TransferCtrl', ['$scope', '$state', '$stateParams', '$ionicModal', '$ionicPopup', 'sys', 'commonSrv', 'paymentSrv', 'WebWorker',
    function ($scope, $state, $stateParams, $ionicModal, $ionicPopup, sys, commonSrv, paymentSrv, WebWorker) {

        $scope.initPayment(init);

        function init() {
            if (!$scope.template) {
                $scope.payment.sum = null;
                $scope.payment.destSum = null;
                $scope.payment.comment = '';
                $scope.payment.conversionRate = null;
                $scope.payment.sourceProduct = null;
                $scope.payment.sourceProductTo = null;
            }
        }

        if ($stateParams.paymentParams) {
            $scope.payment.sum = $stateParams.paymentParams.sum ? $stateParams.paymentParams.sum : null;
            $scope.payment.sourceProduct = $stateParams.paymentParams.sourceProduct ? $stateParams.paymentParams.sourceProduct : null;
            $scope.payment.sourceProductTo = $stateParams.paymentParams.sourceProductTo ? $stateParams.paymentParams.sourceProductTo : null;
        }

        // <для подтверждения одноразовым паролем>
        var args = [];
        var confirmActionStrId = paymentSrv.getPaymentConfirmActionStrId();
        // </для подтверждения одноразовым паролем>

        $scope.isDifferentCurrencies = function() {
            return $scope.payment.sourceProduct && $scope.payment.sourceProductTo
                && ($scope.payment.sourceProduct.currency != $scope.payment.sourceProductTo.currency);
        };

        $scope.calculateSum = function() {
            if ($scope.payment.destSum && $scope.payment.conversionRate) {
                $scope.payment.sum = parseFloat(($scope.payment.destSum * $scope.payment.conversionRate.toRateValue / $scope.payment.conversionRate.fromRateValue).toFixed(2));
            } else {
                $scope.payment.sum = undefined;
            }
        };

        $scope.calculateDepositSum = function() {
            if ($scope.payment.sum && $scope.payment.conversionRate) {
                $scope.payment.destSum = parseFloat(($scope.payment.sum * $scope.payment.conversionRate.fromRateValue / $scope.payment.conversionRate.toRateValue).toFixed(2));
            } else {
                $scope.payment.destSum = undefined;
            }
        };

        /* инициализация открытия шаблона, сумму зачисления необходимо пересчитать по актуальному курсу */
        if ($scope.template) {
            $scope.sourceProductToId = $scope.template.sourceProductToId;
            $scope.calculateDepositSum();
        }

        function processingResults(data) {
            switch (data.cmdInfo) {

                case 'getSourcesListForPayment':
                    $scope.payment.paymentSourceList = data.result.data;
                    $scope.payment.sourceProduct = $scope.getElementById($scope.payment.paymentSourceList, $scope.payment.sourceProductId);
                    $scope.payment.sourceProductId = undefined;
                    break;

                case 'RetailRegularPeriod':
                case 'DayOfWeek':
                case 'Month':
                case 'RegularPaySumType':
                case 'RegularPayDecision':
                    paymentSrv.setCodifierListByStrId(data.cmdInfo, data.result.data);
                    break;


                case 'getSourcesToListForPayment':
                    $scope.payment.paymentSourceToList = data.result.data;
                    $scope.payment.sourceProductTo = $scope.getElementById($scope.payment.paymentSourceToList, $scope.payment.sourceProductToId);
                    $scope.payment.sourceProductToId = undefined;
                    if ($scope.isDifferentCurrencies()) {
                        $scope.saveDataForSessionTimeout($scope.payment);
                        WebWorker.postMessage('getConversionRateForTransfer', 'getConversionRateForTransfer', [$scope.payment.sourceProduct.id, $scope.payment.sourceProductTo.id]);
                    }
                    break;

                case 'getConversionRateForTransfer':
                    if (data.result.data.conversionRate) {
                        $scope.payment.conversionRate = data.result.data.conversionRate;
                        $scope.calculateDepositSum();
                    } else {
                        $scope.payment.conversionRate = null;
                    }
                    break;

                case 'validateAndSaveRetailTransfer':
                    delete($scope.payment.resultValue);
                    if (!data.result.data) {
                        $scope.setEditMode();
                        $scope.payment.showConfirmButton = false;
                        alert('При отправке заявки произошла ошибка');
                    } else if (data.result.data.hasErrors) {
                        $scope.setEditMode();
                        $scope.payment.showConfirmButton = false;
                        alert(data.result.data.error, 'Обратите внимание!');
                    } else {
                        // <для подтверждения одноразовым паролем>
                        var resultValue = data.result.data.result;
                        $scope.payment.resultValue = resultValue;
                        if (resultValue == confirmActionStrId) {
                            $scope.setViewMode();
                            $scope.payment.showConfirmButton = true;
                            $scope.payment.absid = data.result.data.absid;
                            $scope.payment.requestId = data.result.data.requestId;
                            $scope.payment.totalSum = data.result.data.totalSum;
                            $scope.payment.conversionRate = data.result.data.conversionRate;
                            $scope.calculateDepositSum();
                        } else if (resultValue == 'otpConfirm' || resultValue == 'codeDateConfirm') {
                            $scope.payment.showConfirmButton = true;

                            $scope.confirmationShow(data.cmdInfo, args, resultValue == 'otpConfirm');
                            return;
                        } else if (resultValue == 'true') {
                            $scope.setViewMode();
                            $scope.payment.showConfirmButton = false;
                            $scope.confirmationHide();

                            // Действия после успешной отправки.
                            alert('Принято в обработку').finally(function() {
                                if ($scope.payment.paymentModeParams.actionStrId == 'saveTemplate') {
                                    $scope.goBack();
                                } else {
                                    $scope.redirectToOperationFromPayment(data.result.data.operation);
                                }
                            });
                        } else if (resultValue == 'otpFalse' || resultValue == 'codeDateFalse') {
                            $scope.confirmationFalse(resultValue);
                            return;
                        } else {
                            $scope.confirmationHide();
                            $scope.payment.showConfirmButton = true;
                            alert(resultValue);
                        }
                        // </для подтверждения одноразовым паролем>
                    }
                    break;
            }
            $scope.$apply();
        }

        WebWorker.setFunction(processingResults);
        if (!$scope.payment.paymentSourceList || $scope.payment.paymentSourceList.length == 0) {
            $scope.saveDataForSessionTimeout($scope.payment);
            WebWorker.postMessage('getSourcesListForPayment', 'getSourcesListForPayment', ['TRANSFER_FROM', $scope.payment.sourceProduct ? $scope.payment.sourceProduct.id : null]);
        }
        if (!$scope.payment.paymentSourceToList || $scope.payment.paymentSourceToList.length == 0) {
            $scope.saveDataForSessionTimeout($scope.payment);
            WebWorker.postMessage('getSourcesListForPayment', 'getSourcesToListForPayment', ['TRANSFER_TO', $scope.payment.sourceProduct ? $scope.payment.sourceProduct.id : null]);
        }

        if (!paymentSrv.getCodifierListByStrId('RetailRegularPeriod')) {
            $scope.saveDataForSessionTimeout($scope.payment);
            WebWorker.postMessage('getEntitiesByCondition', 'RetailRegularPeriod', ['codifier', 'RetailRegularPeriod', 'id in \\dict.PeriodPayDepends[!\\fn.isNull(periodicity) && isActive].periodicity.id']);
            WebWorker.postMessage('getEntitiesByCondition', 'DayOfWeek', ['codifier', 'DayOfWeek', 'value != "ANY" && value != "0"']);
            WebWorker.postMessage('getEntitiesByCondition', 'Month', ['codifier', 'Month', 'true']);
            WebWorker.postMessage('getEntitiesByCondition', 'RegularPaySumType', ['codifier', 'RegularPaySumType', 'true && value in {"FIX", "PERCENT"}']);
            WebWorker.postMessage('getEntitiesByCondition', 'RegularPayDecision', ['codifier', 'RegularPayDecision', 'true']);
        }

        // <выбор продукта>
        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/selectproduct.html', function($ionicModal) {
            $scope.selectProduct = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.selectProductShow = function(productList, resultId) {
            $scope.resultId = resultId;
            var selectedId;
            if ($scope.resultId == 'sourceProduct') {

                /* Признак отображения пункта "Открытие счета для обмена валюты" только при выборе "Куда перевести" */
                $scope.isSelectProductTo = false;

                if ($scope.payment.sourceProductTo != null) {
                    selectedId = $scope.payment.sourceProductTo.id;
                }
            } else if ($scope.resultId == 'sourceProductTo') {

                /* Признак отображения пункта "Открытие счета для обмена валюты" только при выборе "Куда перевести" */
                $scope.isSelectProductTo = true;

                if ($scope.payment.sourceProduct != null) {
                    selectedId = $scope.payment.sourceProduct.id;
                }
            }

            $scope.cardList = [];
            $scope.loanList = [];
            $scope.accountList = [];
            $scope.depositList = [];
            for (var i = 0; i < productList.length; i++) {
                if (!selectedId || productList[i].id != selectedId) {
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
            }
            $scope.selectProduct.show();
        };

        $scope.clickProduct = function(product) {
            $scope.selectProduct.hide();
            var needUpdateConversionRate = !$scope[$scope.resultId] || $scope[$scope.resultId].currency != product.currency;
            $scope.payment[$scope.resultId] = product;
            if ($scope.resultId == 'sourceProduct') {
                $scope.payment.sourceProductTo = null;
                $scope.payment.paymentSourceToList = undefined;
                $scope.saveDataForSessionTimeout($scope.payment);
                WebWorker.postMessage('getSourcesListForPayment', 'getSourcesToListForPayment', ['TRANSFER_TO', $scope.payment.sourceProduct ? $scope.payment.sourceProduct.id : null]);
            }

            if (needUpdateConversionRate && $scope.isDifferentCurrencies()) {
                $scope.payment.conversionRate = undefined;
                $scope.payment.destSum = null;
                $scope.saveDataForSessionTimeout($scope.payment);
                WebWorker.postMessage('getConversionRateForTransfer', 'getConversionRateForTransfer', [$scope.payment.sourceProduct.id, $scope.payment.sourceProductTo.id]);
            }
        };
        // </выбор продукта>

        $scope.$on('modal.hidden', function(evt, modal) {
            if (modal == $scope.confirmPanel) {
                $scope.payment.showConfirmButton = true;
                $scope.confirmationHide();
            }
        });

        $scope.sendPayment = function (action) {
            $scope.hideDatePickers();
            $scope.hideAndroidDatePickers();
            $scope.preparePeriodicalFields();
            try {
                validateTransfer();
            } catch(e) {
                alert(e.message, 'Обратите внимание!');
                return;
            }
            $scope.setViewMode();
            var paymentForSend = {};
            paymentForSend.sum = $scope.payment.sum;
            paymentForSend.comment = $scope.payment.comment;
            paymentForSend.absid = $scope.payment.absid;
            paymentForSend.requestId = $scope.payment.requestId;
            paymentForSend.totalSum = $scope.payment.totalSum;

            args = [action, $scope.payment.sourceProduct.id, $scope.payment.sourceProductTo.id, JSON.stringify(paymentForSend),
                JSON.stringify($scope.payment.paymentModeParams), JSON.stringify($scope.payment.periodicalPayStruct)];

            $scope.saveDataForSessionTimeout($scope.payment);

            WebWorker.postMessage('validateAndSaveRetailTransfer', 'validateAndSaveRetailTransfer', args);
            if ($scope.payment.paymentModeParams.isVisibleTemplateFields || $scope.payment.paymentModeParams.isDeleteTemplate) {
                paymentSrv.setFavouritesList(undefined);
            }
        };

        function validateTransfer() {
            if (!$scope.payment.sourceProduct) {
                throw new Error('Поле "Откуда перевести" должно быть заполнено');
            } else if (!$scope.payment.sourceProductTo) {
                throw new Error('Поле "Куда перевести" должно быть заполнено');
            }
            $scope.validateSumField($scope.payment.sum);
        }

        $scope.validatePayment = function() {
            $scope.payment.paymentModeParams.actionStrId = $scope.isNotFromTemplateAndVisibleFields() ? 'executeAndSaveTemplate' : 'execute';
            $scope.sendPayment(confirmActionStrId);
        };

        $scope.validateAndSaveTemplate = function() {
            $scope.payment.paymentModeParams.actionStrId = 'saveTemplate';
            $scope.sendPayment(confirmActionStrId);
        };

        $scope.confirmAndSavePayment = function() {
            $scope.payment.showConfirmButton = false;
            $scope.sendPayment($scope.getActionStrId());
        };

        $scope.openAccountForCurrencyExchange = function() {

            /* Открыть popup уведомления */
            $ionicPopup.show({
                title: 'Для того, чтобы осуществить конверсионную операцию (перевод между счетами в разной валюте) необходимо открыть счет',
                scope: $scope,
                buttons: [
                    {
                        text: 'Отменить'
                    },
                    {
                        text: 'Приступить',
                        onTap: function() {
                            return true;
                        }
                    }
                ]
            }).then(function (result) {
                if (result) {
                    $scope.selectProduct.hide();
                    $state.go('accountopenreq', {fromTransfer: true});
                }
            });
        }
    }
]);
