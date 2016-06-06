var app = angular.module('app');

/**
 * Платеж "Оплата услуг".
 */
app.controller('ServicePayCtrl', ['$scope', '$state', '$stateParams', '$ionicModal', 'sys', 'commonSrv', 'paymentSrv', 'WebWorker',
    function ($scope, $state, $stateParams, $ionicModal, sys, commonSrv, paymentSrv, WebWorker) {

        $scope.initPayment(init);

        function init() {
            if ($scope.template) {
                $scope.payment.additionalFields = $scope.template.additionalFields;
                convertMask($scope.payment.additionalFields);
            } else {
                $scope.payment.sum = null;
            }
            $scope.payment.tile = $stateParams.tile;
            $scope.payment.providerId = $stateParams.providerId;
            $scope.payment.serviceId = $stateParams.serviceId;
            $scope.payment.personalAccountId = $stateParams.personalAccountId;
        }

        /* преобразование формата ИК маски к нашему, приходит, например (___) ___-__-__ */
        function convertMask(additionalFields) {
            if (additionalFields && additionalFields.length) {
                for (var i = 0; i < additionalFields.length; i++) {
                    if (additionalFields[i].mask) additionalFields[i].mask = additionalFields[i].mask.replace(/_/g, '9');
                }
            }
        }

        // <для подтверждения одноразовым паролем>
        var args = [];
        var confirmActionStrId = paymentSrv.getPaymentConfirmActionStrId();
        // </для подтверждения одноразовым паролем>

        function processingResults(data) {
            switch (data.cmdInfo) {
                case 'getServicePaymentParams':
                    var additionalFields = data.result.data.additionalFields;
                    convertMask(additionalFields);
                    if ($scope.payment.additionalFields) {
                        for (var i = 0; i < additionalFields.length; ++i) {
                            for (var j = 0; j < $scope.payment.additionalFields.length; ++j) {
                                if ($scope.payment.additionalFields[j].strId == additionalFields[i].strId) {
                                    additionalFields[i].value = $scope.payment.additionalFields[j].value;
                                }
                            }
                        }
                    }
                    $scope.payment.additionalFields = additionalFields;
                    break;

                case 'RetailRegularPeriod':
                case 'DayOfWeek':
                case 'Month':
                case 'RegularPaySumType':
                case 'RegularPayDecision':
                    paymentSrv.setCodifierListByStrId(data.cmdInfo, data.result.data);
                    break;


                case 'getSourcesListForPayment':
                    $scope.payment.paymentSourceList = data.result.data;
                    $scope.payment.sourceProduct = $scope.getElementById($scope.payment.paymentSourceList, $scope.payment.sourceProductId);
                    $scope.payment.sourceProductId = undefined;
                    break;

                case 'validateAndSaveRetailServicePay':
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
                        } else if (resultValue == 'otpConfirm' || resultValue == 'codeDateConfirm') {
                            $scope.payment.showConfirmButton = true;

                            $scope.confirmationShow(data.cmdInfo, args, resultValue == 'otpConfirm');
                            return;
                        } else if (resultValue == 'true') {
                            $scope.setViewMode();
                            $scope.payment.showConfirmButton = false;
                            $scope.confirmationHide();

                            // Действия после успешной отправки.
                            alert('Платеж принят в обработку').finally(function() {
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
            $scope.$applyAsync();
        }

        WebWorker.setFunction(processingResults);
        if (!$scope.payment.paymentSourceList || $scope.payment.paymentSourceList.length == 0) {
            $scope.saveDataForSessionTimeout($scope.payment);
            WebWorker.postMessage('getSourcesListForPayment', 'getSourcesListForPayment', ['SERVICEPAY']);
        }

        /* при открытии шаблона доп. поля уже есть, незачем запрашивать справочник и затирать уже заполненные поля */
        if (!$scope.payment.additionalFields) {
            $scope.saveDataForSessionTimeout($scope.payment);
            WebWorker.postMessage('getServicePaymentParams', 'getServicePaymentParams', [$scope.payment.providerId, $scope.payment.serviceId, $scope.payment.personalAccountId]);
        } else {
            convertMask($scope.payment.additionalFields);
        }

        if (!paymentSrv.getCodifierListByStrId('RetailRegularPeriod')) {
            $scope.saveDataForSessionTimeout($scope.payment);
            WebWorker.postMessage('getEntitiesByCondition', 'RetailRegularPeriod', ['codifier', 'RetailRegularPeriod', 'id in \\dict.PeriodPayDepends[!\\fn.isNull(periodicity) && isActive].periodicity.id']);
            WebWorker.postMessage('getEntitiesByCondition', 'DayOfWeek', ['codifier', 'DayOfWeek', 'value != "ANY" && value != "0"']);
            WebWorker.postMessage('getEntitiesByCondition', 'Month', ['codifier', 'Month', 'true']);
            WebWorker.postMessage('getEntitiesByCondition', 'RegularPaySumType', ['codifier', 'RegularPaySumType', 'true && value in {"FIX", "PERCENT"}']);
            WebWorker.postMessage('getEntitiesByCondition', 'RegularPayDecision', ['codifier', 'RegularPayDecision', 'true']);
        }

        // <Панель для выбора кодификатора>
        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/card/select.codifier.html', function($ionicModal) {
            $scope.selectCodifierPanel = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.onSelectCodifierPanel = function (codifiers, codifierStrId, selected) {
            $scope.codifiers = codifiers;
            $scope.codifierStrId = codifierStrId;
            $scope.selectedCodifier = {value: selected};

            $scope.selectCodifierPanel.show()
        };

        $scope.clickCodifier = function(codifier) {
            for (var i = 0; i < $scope.payment.additionalFields.length; ++i) {
                if ($scope.payment.additionalFields[i].strId == $scope.codifierStrId) {
                    $scope.payment.additionalFields[i].value = codifier.value;
                    break;
                }
            }

            $scope.codifiers = [];
            $scope.codifierStrId = "";
            $scope.selectedCodifier = null;

            $scope.selectCodifierPanel.hide();
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
            $scope.payment[$scope.resultId] = product;
        };
        // </выбор продукта>

        $scope.$on('modal.hidden', function(evt, modal) {
            if (modal == $scope.confirmPanel) {
                $scope.payment.showConfirmButton = true;
                $scope.confirmationHide();
            }
        });

        $scope.prepareAdditionalFields = function() {
            for (var i = 0; i < $scope.payment.additionalFields.length; ++i) {
                if ($scope.payment.additionalFields[i].type == 'set') {
                    $scope.payment.additionalFields[i].value = [];
                    for (var j = 0; j < $scope.payment.additionalFields[i].possibleValues.length; ++j) {
                        if ($scope.payment.additionalFields[i].possibleValues[j].selected) {
                            $scope.payment.additionalFields[i].value.push($scope.payment.additionalFields[i].possibleValues[j].value);
                        }
                    }
                }
            }
        };

        $scope.sendPayment = function (action) {
            $scope.hideDatePickers();
            $scope.hideAndroidDatePickers();
            $scope.preparePeriodicalFields();
            $scope.prepareAdditionalFields();
            try {
                validateServicePay();
            } catch(e) {
                alert(e.message, 'Обратите внимание!');
                return;
            }
            $scope.setViewMode();
            var paymentForSend = {};
            paymentForSend.sum = $scope.payment.sum;
            paymentForSend.providerId = $scope.payment.providerId;
            paymentForSend.serviceId = $scope.payment.serviceId;
            paymentForSend.comment = $scope.payment.comment;
            paymentForSend.absid = $scope.payment.absid;
            paymentForSend.requestId = $scope.payment.requestId;
            paymentForSend.totalSum = $scope.payment.totalSum;

            args = [action, $scope.payment.sourceProduct.id, JSON.stringify(paymentForSend), JSON.stringify($scope.payment.additionalFields),
                JSON.stringify($scope.payment.paymentModeParams), JSON.stringify($scope.payment.periodicalPayStruct), $scope.payment.personalAccountId];

            $scope.saveDataForSessionTimeout($scope.payment);

            WebWorker.postMessage('validateAndSaveRetailServicePay', 'validateAndSaveRetailServicePay', args);
            if ($scope.payment.paymentModeParams.isVisibleTemplateFields || $scope.payment.paymentModeParams.isDeleteTemplate) {
                paymentSrv.setFavouritesList(undefined);
            }
        };

        function validateServicePay() {
            $scope.validateSourceField($scope.payment.sourceProduct);
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

        $scope.getValueByStrId = function(possibleValues, value) {
            for (var i = 0; i < possibleValues.length; ++i) {
                if (possibleValues[i].value == value) {
                    return possibleValues[i].name;
                }
            }
            return '';
        };
    }
]);
