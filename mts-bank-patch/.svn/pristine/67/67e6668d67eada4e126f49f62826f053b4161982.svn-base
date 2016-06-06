var app = angular.module('app');

/**
 * Перевод между своими счетами и картами
 */
app.controller('PaymentToCardCtrl', ['$scope', '$state', '$stateParams', '$ionicModal', 'sys', 'commonSrv', 'paymentSrv', 'WebWorker',
    function ($scope, $state, $stateParams, $ionicModal, sys, commonSrv, paymentSrv, WebWorker) {

        $scope.initPayment(init);

        function init() {
            if (!$scope.template) {
                $scope.payment.sum = null;
                $scope.payment.comment = '';
                $scope.payment.searchNumber = null;
                $scope.payment.payeeNameBase = null;
            }
        }

        // <для подтверждения одноразовым паролем>
        var args = [];
        var confirmActionStrId = paymentSrv.getPaymentConfirmActionStrId();
        // </для подтверждения одноразовым паролем>

        function processingResults(data) {
            switch (data.cmdInfo) {

                case 'getSourcesListForPayment':
                    $scope.payment.paymentSourceList = data.result.data;
                    $scope.payment.payeeNameBase = '';
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

                case 'validateAndSaveRetailPayToCard':
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
            WebWorker.postMessage('getSourcesListForPayment', 'getSourcesListForPayment', ['PAYTOCARD']);
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

        $scope.sendPayment = function (action) {
            $scope.hideDatePickers();
            $scope.hideAndroidDatePickers();
            $scope.preparePeriodicalFields();
            try {
                validatePaymentToCard();
            } catch(e) {
                alert(e.message, 'Обратите внимание!');
                return;
            }
            $scope.setViewMode();
            var paymentForSend = {};
            paymentForSend.sum = $scope.payment.sum;
            paymentForSend.searchNumber = $scope.payment.fromTemplate ? $scope.payment.maskSearchNumber : $scope.payment.searchNumber;
            paymentForSend.hashNumber = $scope.payment.hashNumber;
            paymentForSend.payeeClientExtId = $scope.payment.payeeClientExtId;
            paymentForSend.payeeClientFName = $scope.payment.payeeClientFName;
            paymentForSend.payeeClientSName = $scope.payment.payeeClientSName;
            paymentForSend.payeeClientLName = $scope.payment.payeeClientLName;
            paymentForSend.payeeNameBase = $scope.payment.payeeNameBase;
            paymentForSend.comment = $scope.payment.comment;
            paymentForSend.absid = $scope.payment.absid;
            paymentForSend.requestId = $scope.payment.requestId;
            paymentForSend.totalSum = $scope.payment.totalSum;

            args = [action, $scope.payment.sourceProduct.id, JSON.stringify(paymentForSend),
                JSON.stringify($scope.payment.paymentModeParams), JSON.stringify($scope.payment.periodicalPayStruct)];

            $scope.saveDataForSessionTimeout($scope.payment);

            WebWorker.postMessage('validateAndSaveRetailPayToCard', 'validateAndSaveRetailPayToCard', args);
            if ($scope.payment.paymentModeParams.isVisibleTemplateFields || $scope.payment.paymentModeParams.isDeleteTemplate) {
                paymentSrv.setFavouritesList(undefined);
            }
        };

        function validatePaymentToCard() {
            $scope.validateSourceField($scope.payment.sourceProduct);
            if (($scope.payment.fromTemplate && $scope.isEmptyField($scope.payment.maskSearchNumber))
                    || $scope.isEmptyField($scope.payment.searchNumber)) {
                throw new Error('Поле "Номер карты" должно быть заполнено');
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

        /* Если выпали по сессии при поиске клиента нужно запросить заново */
        if ($scope.payment.searchNumber && !$scope.payment.payeeNameBase) {
            $scope.searchPayeeBaseName($scope.payment.payType, $scope.payment.searchNumber);
        }
    }
]);
