/**
 * Открытие продукта
 */
var app = angular.module('app');


/**
 * Выпуск виртуальной предоплаченной карты
 */
app.controller('IssueVirtualCardCtrl', ['$scope', '$stateParams', '$ionicModal', '$timeout', 'sys', 'WebWorker',
    function ($scope, $stateParams, $ionicModal, $timeout, sys, WebWorker) {
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

        function initBySessionTimeout() {
            $scope.form = $scope.globals.dataObjectForSessionTimeout;
            delete($scope.globals.dataObjectForSessionTimeout);
            $scope.form.requestAlreadySend = false;
            $scope.form.showButton = true;
            if (!$scope.form.paymentSourceList) {
                requestData();
            }
        }

        function init() {
            $scope.form.readOnly = $stateParams.retailDoc != null;
            $scope.form.needCommisionRequest = true;
            $scope.form.requestAlreadySend = false;
            $scope.form.showButton = false;
            $scope.form.commissionAmount = null;

            /* Режим просмотра заявки */
            if ($scope.form.readOnly) {
                $scope.form.retailDoc = $stateParams.retailDoc;
                $scope.form.claim = $scope.form.retailDoc.claim;
                $scope.form.initialAmount = $scope.form.retailDoc.initialAmount;
                $scope.form.commissionAmount = $scope.form.retailDoc.commissionAmount;
                $scope.form.selectedSource = $scope.form.retailDoc.sourceProduct;
                $scope.form.requestAlreadySend = true;
                $scope.form.showButton = false;

                /* Создание новой заявки */
            } else {
                requestData();
            }
        }

        function requestData() {
            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage("getPaymentSourceList", "getPaymentSourceList", []);
        }

        function processingResults(data) {
            switch (data.cmdInfo) {
                case 'getPaymentSourceList':
                    $scope.form.paymentSourceList = data.result.data;
                    $scope.form.selectedSource = $scope.form.paymentSourceList[0];

                    $scope.getIssueRetailVirtCardParams();
                    break;

                case 'getIssueRetailVirtCardParams':
                    $scope.form.claim = JSON.parse(data.result.data);
                    $scope.getCommissionReplenishment();
                    break;

                case 'getComissionReplenishment':
                    $scope.form.commissionAmount = data.result.data;
                    $scope.form.showButton = true;
                    break;

                case 'sendRetailVirtCardRequest':
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
                        alert('Заявление на выпуск виртуальной предоплаченной карты принято в обработку')
                            .finally(function() {
                                $scope.goBack();
                            });
                    } else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                        $scope.confirmationFalse(data.result.data);
                        return;
                    } else if (data.result.data == 'rollback') {
                        alert('Заявка отозвана');
                        $scope.goBack();
                        return;
                    } else if (data.result.data && data.result.data.length > 0) {
                        $scope.confirmationHide();
                        $scope.form.showButton = true;
                        $scope.form.requestAlreadySend = false;
                        alert('При обработке заявления произошла ошибка: ' + data.result.data);
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

        // <выбор продукта>
        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/selectproduct.html', function($ionicModal) {
            $scope.selectProduct = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.selectProductShow = function(productList, resultId) {
            if (!$scope.form.readOnly) {
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
            }
        };

        $scope.clickProduct = function(product) {
            $scope.selectProduct.hide();
            $scope.form[$scope.resultId] = product;
            $scope.getIssueRetailVirtCardParams();
        };
        // </выбор продукта>

        $scope.getCommissionReplenishment = function () {
            WebWorker.postMessage('invokeEntityMethod','getComissionReplenishment',
                ['system', $scope.selectedSource.entityKind, 'getComissionReplenishment', $scope.selectedSource.uuid, []]);
        };

        $scope.getIssueRetailVirtCardParams = function () {
            $scope.form.showButton = false;
            $scope.form.commissionAmount = null;
            //delete $scope.form.claim;

            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage('invokeEntityMethod','getIssueRetailVirtCardParams',
                ['system', $scope.selectedSource.entityKind, 'getIssueRetailVirtCardParams', $scope.selectedSource.uuid, []]);
        };

        $scope.sendRetailVirtCardRequest = function () {
            // регулярка не разрешает вводить больше 2 разрядов для копеек, об остальном позаботится <input type="number"/>
            if (!(/^\d*\.?\d{0,2}$/).test($scope.form.initialAmount)
                || parseFloat($scope.form.initialAmount) > parseFloat(100000)) {

                alert('Сумма пополнения введена неправильно или превышает 100000. Пример 100.00');
                return;
            }
            $scope.saveDataForSessionTimeout($scope.form);
            args = [actionStrId, $scope.form.selectedSource, $scope.form.initialAmount];
            WebWorker.postMessage("sendRetailVirtCardRequest", "sendRetailVirtCardRequest", args);
            $scope.form.requestAlreadySend = true;
            $scope.form.showButton = false;
        };
    }
]);
