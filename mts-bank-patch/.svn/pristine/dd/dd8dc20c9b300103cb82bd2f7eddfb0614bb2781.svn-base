var module = angular.module('app');

module.controller('LoanCtrl', ['$scope', '$stateParams', '$state', '$ionicPopover', '$ionicPopup', '$ionicActionSheet',
'$filter', 'sys', 'loanSrv', 'productSrv', 'commonSrv', 'WebWorker',
function($scope, $stateParams, $state, $ionicPopover, $ionicPopup, $ionicActionSheet, $filter, sys, loanSrv, productSrv, commonSrv, WebWorker) {

        /* ------- Top bar menu Popover ------- */
        $ionicPopover.fromTemplateUrl('templates/loan/popover.html', {
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

        $scope.operationState = 'loan.operation';
        $scope.activeTab = 'operations';
        $scope.loans = loanSrv.getLoanList();
        $scope.changeTab = function(tab) {
            $scope.activeTab = tab;
        };

        /* объект айдишников кредитов, для которых уже ушли запросы на получение данных для предотвращения повторных запросов при прокрутке карусели */
        var loanIdReq = {};

        $scope.onSlideChanged = function(idx) {
            sys.buffer(function() {
                $scope.loan = $scope.loans[idx];
                productSrv.setCurrentProduct($scope.loan);

                $scope.updateLoan();
                $scope.getOperationList();
                $scope.getLinkedProducts();

                /* выставляем признак отправки запросов для неповторения при прокрутке карусели */
                loanIdReq[$scope.loan.id] = true;
            });
        };

        $scope.getOperationList = function(refresh) {
            if ((!loanIdReq[$scope.loan.id] && angular.isUndefined($scope.loan.operationList)) || refresh) {
                $scope.resetOperationList();
                productSrv.getLastOperationsForProduct($scope.loan).then(
                    productSrv.resultGetLastOperationsForProduct($scope.loan)
                );
            } else {
                $scope.loan.operationsDisplay = $scope.loan.operationList ? $scope.loan.operationList.slice(0, 10) : [];
            }
        };

        $scope.resetOperationList = function() {
            $scope.loan.operationsDisplay = undefined;
            $scope.loan.visibleBtnExtract = null;
        };

        $scope.getLinkedProducts = function(refresh) {
            if ((!loanIdReq[$scope.loan.id] && angular.isUndefined($scope.loan.linkedProducts)) || refresh) {
                productSrv.getLinkedProductsForProduct($scope.loan)();
            }
        };

        $scope.updateLoan = function(refresh) {
            if ((!loanIdReq[$scope.loan.id] && !$scope.loan.isUpdatedABS) || refresh) {
                $scope.updateConcreteLoan($scope.loan)();
            }
        };

        $scope.updateConcreteLoan = function(product) {
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

        $scope.activeSlide = loanSrv.getLoanIdxById($stateParams.loanId);
        $scope.onSlideChanged($scope.activeSlide);
        $scope.loan = $scope.loans[$scope.activeSlide];

        $scope.showMoreOperations = function() {
            productSrv.showMoreOperations($scope.loan, $scope);
        };

        $scope.doEarlyRepayment = function(){};

        $scope.toggleFavourite = function(loan){
            WebWorker.invoke('setIsFavourite', loan);
        };

        //this.sendRequisitesBySMS = loanSrv.sendRequisitesBySMS;*/

        /* Обновление информации при оттягивании страницы. Pull to refresh. */
        $scope.doRefresh = function() {
            $scope.resetOperationList();
            $scope.updateLoan(true);
            $scope.getOperationList(true);
            $scope.getLinkedProducts(true);
            $scope.$applyAsync();
        };

        $scope.getProductSref = function(product) {
            return productSrv.getProductSref(product);
        };

        $scope.getLabelMonthlyPaymentAmount = function() {
            return 'Платеж до ' + $filter('defaultDate')($scope.loan.monthlyPaymentDate);
        };

        $scope.hideDebt = function(debt) {
            return debt.hiddenCodes.indexOf(debt.debtKindCode) >= 0;
        };

        $scope.getTermLoan = function() {
            var term = 'На ' + $scope.loan.term;
            if ($scope.loan.termEnd) {
                term += ' до ' + $filter('defaultDate')($scope.loan.termEnd);
            }
            return term;
        };
    }]);

module.controller('LoanRequisitesCtrl', ['$scope', '$state', '$ionicActionSheet', 'commonSrv', 'productSrv', 'loanSrv', 'WebWorker', '$ionicPopover', '$ionicPopup',
    function($scope, $state, $ionicActionSheet, commonSrv, productSrv, loanSrv, WebWorker, $ionicPopover, $ionicPopup) {

        $scope.loan = productSrv.getCurrentProduct();

        if (!$scope.loan.requisites) {
            WebWorker.invoke('getReplenishmentDetails', $scope.loan).then(
                function(result) {
                    $scope.loan.requisites = result.data;
                }
            );
        }

        function processingResults(data) {
            switch (data.cmdInfo) {
                case 'sendEmail':
                    alert('Реквизиты будут отправлены на ' + $scope.email + '.\nОтправка обычно занимает не более 5 минут.');
                    break;
            }
            $scope.$apply();
        }
        WebWorker.setFunction(processingResults);

        $scope.retailClientEmail = $scope.retailClient.email;
        $scope.sendSMS = function() {
            commonSrv.sendRequisitesBySMS($scope.loan.requisites);
        };

        $scope.sendEmail = function(email) {
            WebWorker.postMessage('sendEmail', 'sendEmail', [$scope.loan, email, 'REPLENISHMENT']);
        };

        /* Переход на страницу для отправки на почту (с вводом адреса) (для ios) */
        $scope.goSendEmail = function() {
            $state.go('loan.sendEmail', {formType: 'REPLENISHMENT'});
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
        $ionicPopover.fromTemplateUrl('templates/loan/popover.html', {
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
    }]);

module.controller('LoanScheduleCtrl', ['$scope', '$state', '$ionicActionSheet', 'commonSrv', 'productSrv', 'loanSrv', 'WebWorker', '$ionicPopover', '$ionicPopup', '$filter',
    function($scope, $state, $ionicActionSheet, commonSrv, productSrv, loanSrv, WebWorker, $ionicPopover, $ionicPopup, $filter) {

        $scope.loan = productSrv.getCurrentProduct();
        if (!$scope.loan.paymentSchedule || !$scope.loan.paymentSchedule.scheduleList) {
            WebWorker.invoke('getRetailLoanPaymentSchedule', $scope.loan).then(
                function(result) {
                    assignGetPaymentSchedule(result);
                }
            );
        }

        function assignGetPaymentSchedule(result) {
            $scope.loan.paymentSchedule = result.data;
            $scope.$broadcast('scroll.refreshComplete');
        }

        $scope.getPaymentTitle = function(payment, index) {
            payment.$_tmpIdx = index + 1;
            var title = $filter('defaultDate')(payment.paymentDate) + ', ';
            title += payment.$_tmpIdx + ' платеж';
            return title;
        };

        function processingResults(data) {
            if (data.result.code && data.result.code != 0) {
                alert(data.result.userMsg, 'Ошибка');
            } else {
                switch (data.cmdInfo) {
                    case 'sendEmail':
                        alert('График платежей будет отправлен на ' + $scope.email + '.\nОтправка обычно занимает не более 5 минут.');
                        break;
                }
                $scope.$apply();
            }
        }
        WebWorker.setFunction(processingResults);

        $scope.retailClientEmail = $scope.retailClient.email;

        $scope.sendEmail = function(email) {
            WebWorker.postMessage('sendEmail', 'sendEmail', [$scope.loan, email, 'SCHEDULE']);
        };

        /* Переход на страницу для отправки на почту (с вводом адреса) (для ios) */
        $scope.goSendEmail = function() {
            $state.go('loan.sendEmail', {formType: 'SCHEDULE'});
        };

        /* Открыть popup для отправки на почту (с вводом адреса) (для android) */
        $scope.openPopupInputEmail = function () {
            $scope.popupData = { email: $scope.retailClientEmail };
            $ionicPopup.show({
                template: '<input input-clear-btn autofocus type="text" ng-model="popupData.email">',
                title: 'Отправить на почту',
                subTitle: 'E-mail',
                cssClass: 'alert',
                scope: $scope,
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

        /* Показать ActionSheet для выбора способа отправки графика платежей (для ios) */
        $scope.showSend = function() {

            var buttons = [];
            if ($scope.retailClientEmail) { buttons.push({ text: $scope.retailClientEmail }); }
            buttons.push({ text: 'Отправить на e-mail' });

            $ionicActionSheet.show({
                buttons: buttons,
                buttonClicked: function(index) {
                    if ($scope.retailClientEmail) {
                        switch (index) {
                            case 0:
                                // Отправка на email пользователя
                                $scope.email = $scope.retailClientEmail;
                                $scope.sendEmail($scope.email);
                                return true;
                            case 1:
                                // Переход к экрану ввода email
                                $scope.goSendEmail();
                                return true;
                        }
                    } else {
                        switch (index) {
                            case 0:
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
        $ionicPopover.fromTemplateUrl('templates/loan/popover.html', {
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

        $scope.popoverSendEmailClient = function() {
            $scope.closePopover();
            $scope.email = $scope.retailClientEmail;
            $scope.sendEmail($scope.email);
        };

        $scope.popoverOpenInputEmail = function() {
            $scope.closePopover();
            $scope.openPopupInputEmail();
        };

        $scope.doRefresh = function() {
            WebWorker.invoke('getRetailLoanPaymentSchedule', $scope.loan).then(
                function(result) {
                    assignGetPaymentSchedule(result);
                }
            );
            $scope.$applyAsync();
        };
    }]);
