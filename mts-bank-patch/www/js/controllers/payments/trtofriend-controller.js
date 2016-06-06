var app = angular.module('app');

/**
 * Перевод между своими счетами и картами
 */
app.controller('TrToFriendCtrl', ['$scope', '$state', '$stateParams', '$ionicModal', 'sys', 'commonSrv', 'paymentSrv', 'WebWorker', 'settingsSrv',
    function ($scope, $state, $stateParams, $ionicModal, sys, commonSrv, paymentSrv, WebWorker, settingsSrv) {

        $scope.initPayment(init);

        function init() {
            if (!$scope.template) {
                $scope.payment.sum = null;
                $scope.payment.comment = '';
                $scope.payment.friendExtId = null;
                $scope.payment.payeeNameBase = undefined;
            }
        }

        // <для подтверждения одноразовым паролем>
        var args = [];
        var confirmActionStrId = paymentSrv.getPaymentConfirmActionStrId();
        // </для подтверждения одноразовым паролем>

        $scope.payment.friendsInBank = settingsSrv.getFriendsInBank();

        $scope.setSelectedFriend = function() {
            if ($stateParams.friendExtId) {
                $scope.selectedFriend = $scope.getElementById($scope.payment.friendsInBank, $stateParams.friendExtId);
                if ($scope.selectedFriend) {
                    $scope.payment.friendExtId = $scope.selectedFriend.id;
                }
            } else if ($scope.payment.friendExtId) {
                $scope.selectedFriend = $scope.getElementById($scope.payment.friendsInBank, $scope.payment.friendExtId);
            }
        };

        if ($scope.payment.friendsInBank) {
            $scope.setSelectedFriend();
        } else {
            $scope.saveDataForSessionTimeout($scope.payment);
            WebWorker.postMessage('getFriendsForPaymentParams', 'getFriendsForPaymentParams', []);
        }

        function processingResults(data) {
            switch (data.cmdInfo) {

                case 'getFriendsForPaymentParams':
                    if (data.result.data) {
                        settingsSrv.setFriendsInBank(data.result.data.friendsInBankList);
                        $scope.payment.friendsInBank = settingsSrv.getFriendsInBank();
                        settingsSrv.setOtherFriends(data.result.data.otherFriendsList);
                        $scope.payment.otherFriends = settingsSrv.getOtherFriends();
                        if (!($scope.payment.friendsInBank && $scope.payment.friendsInBank.length > 0)
                            && !($scope.payment.otherFriends && $scope.payment.otherFriends.length > 0)) {

                            $state.go('socialNetworks');
                        } else {
                            $scope.setSelectedFriend();
                        }
                    } else {
                        $state.go('socialNetworks');
                    }
                    break;

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

                case 'validateAndSaveRetailTrToFriend':
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
                            $scope.payment.payeeNameBase = data.result.data.payeeNameBase;
                        } else if (resultValue == 'otpConfirm' || resultValue == 'codeDateConfirm') {
                            $scope.payment.showConfirmButton = true;

                            $scope.confirmationShow(data.cmdInfo, args, resultValue == 'otpConfirm');
                            return;
                        } else if (resultValue == 'true') {
                            $scope.setViewMode();
                            $scope.payment.showConfirmButton = false;
                            $scope.confirmationHide();

                            // Действия после успешной отправки.
                            alert('Принято в обработку');
                            if ($scope.payment.paymentModeParams.actionStrId == 'saveTemplate') {
                                $scope.goBack();
                            } else {
                                $scope.redirectToOperationFromPayment(data.result.data.operation);
                            }
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
            WebWorker.postMessage('getSourcesListForPayment', 'getSourcesListForPayment', ['TRTOFRIEND']);
        }

        if (!paymentSrv.getCodifierListByStrId('RetailRegularPeriod')) {
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

        // <Панель для выбора кодификатора>
        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/card/select.codifier.html', function($ionicModal) {
            $scope.selectCodifierPanel = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.onSelectCodifierPanel = function(codifiers, codifierStrId) {
            $scope.codifiers = codifiers;
            $scope.codifierStrId = codifierStrId;
            if ($scope.codifierStrId === 'SocNetworkFriend') {
                $scope.selectedCodifier = $scope.selectedFriend;
            }

            $scope.selectCodifierPanel.show()
        };

        $scope.clickCodifier = function(codifier) {
            $scope.selectCodifierPanel.hide();
            if ($scope.codifierStrId === 'SocNetworkFriend') {
                $scope.selectedFriend = codifier;
                $scope.payment.friendExtId = $scope.selectedFriend.id;
            }

            $scope.codifiers = [];
            $scope.codifierStrId = "";
            $scope.selectedCodifier = null;
        };
        // </Панель для выбора кодификатора>

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
                validateTrToFriend();
            } catch(e) {
                alert(e.message, 'Обратите внимание!');
                return;
            }
            $scope.setViewMode();
            var paymentForSend = {};
            paymentForSend.sum = $scope.payment.sum;
            paymentForSend.friendExtId = $scope.payment.friendExtId;
            paymentForSend.comment = $scope.payment.comment;
            paymentForSend.absid = $scope.payment.absid;
            paymentForSend.requestId = $scope.payment.requestId;
            paymentForSend.totalSum = $scope.payment.totalSum;

            args = [action, $scope.payment.sourceProduct.id, JSON.stringify(paymentForSend),
                JSON.stringify($scope.payment.paymentModeParams), JSON.stringify($scope.payment.periodicalPayStruct)];

            $scope.saveDataForSessionTimeout($scope.payment);

            WebWorker.postMessage('validateAndSaveRetailTrToFriend', 'validateAndSaveRetailTrToFriend', args);
            if ($scope.payment.paymentModeParams.isVisibleTemplateFields || $scope.payment.paymentModeParams.isDeleteTemplate) {
                paymentSrv.setFavouritesList(undefined);
            }
        };

        function validateTrToFriend() {
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
    }
]);
