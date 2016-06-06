var app = angular.module('app');

app.controller('AccountCtrl', ['$scope', '$rootScope', '$stateParams', '$state', '$filter', '$ionicPopover', '$ionicPopup', 'sys',
'accountSrv', 'depositSrv', 'productSrv', 'WebWorker', 'commonSrv',
function($scope, $rootScope, $stateParams, $state, $filter, $ionicPopover, $ionicPopup, sys,
         accountSrv, depositSrv, productSrv, WebWorker, commonSrv) {

    /* выводим в карусель все счета и счета вкладов */
    var getProductList = function() {
        var openFavouriteDeposits = $filter('objectArrayFilter')(depositSrv.getAccountList(), [{'deposit.isFavourite': true, 'deposit.isClosed': false}]);
        var openNotFavouriteDeposits = $filter('objectArrayFilter')(depositSrv.getAccountList(), [{'deposit.isFavourite': false, 'deposit.isClosed': false}]);
        var closedDeposits = $filter('objectArrayFilter')(depositSrv.getAccountList(), [{'deposit.isClosed': true}]);
        var openFavouriteAccounts = $filter('objectArrayFilter')(accountSrv.getAccountList(), [{isFavourite: true, isClosed: false}]);
        var openNotFavouriteAccounts = $filter('objectArrayFilter')(accountSrv.getAccountList(), [{isFavourite: false, isClosed: false}]);
        var closedAccounts = $filter('objectArrayFilter')(accountSrv.getAccountList(), [{isClosed: true}]);
        var list = openFavouriteDeposits.concat(openNotFavouriteDeposits).concat(closedDeposits).
            concat(openFavouriteAccounts).concat(openNotFavouriteAccounts).concat(closedAccounts);

        /* #095884. Как оказалось продукты могут дублироваться в карусели, поэтому создаём уникальные идентификаторы */
        for (var i = 0; i < list.length; i++) {
            list[i].sliderId = i;
        }
        return list;
    };

    /* объект айдишников счетов, для которых уже ушли запросы на получение данных для предотвращения повторных запросов при прокрутке карусели */
    var accountIdReq = {};

    function getActiveSlideIndexById(array, id) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].deposit) {
                if (array[i].deposit.id === parseInt(id)) {
                    return i;
                }
            } else {
                if (array[i].id === parseInt(id)) {
                    return i;
                }
            }
        }
        return 0;
    }

    $scope.slideHasChanged = function(index) {
        sys.buffer(function() {
            $scope.currentProduct = $scope.productList[index];
            productSrv.setCurrentProduct($scope.currentProduct);
            accountSrv.setCurrentAccount($scope.currentProduct);

            $scope.resetOperationList();
            $scope.updateProduct();
            $scope.getOperationList();
            $scope.getLinkedProducts();
            $scope.getServices();

            /* выставляем признак отправки запросов для неповторения при прокрутке карусели */
            accountIdReq[$scope.currentProduct.id] = true;
        });
    };

    $scope.productList = getProductList();
    $scope.activeTab = 'operations'; // активная вкладка "операции" (android)
    $scope.operationState = 'account.operation';
    $scope.changeTab = function(tab) {
        $scope.activeTab = tab;
    };
    $scope.slideHasChanged($scope.activeSlide = getActiveSlideIndexById($scope.productList, $stateParams.productId));

    $scope.getOperationList = function(refresh) {
        if ((!accountIdReq[$scope.currentProduct.id] && angular.isUndefined($scope.currentProduct.operationList)) || refresh) {
            $scope.resetOperationList();
            productSrv.getLastOperationsForProduct($scope.currentProduct).then(
                productSrv.resultGetLastOperationsForProduct($scope.currentProduct)
            );
        } else {
            $scope.currentProduct.operationsDisplay = $scope.currentProduct.operationList ? $scope.currentProduct.operationList.slice(0, 10) : [];
        }
    };

    $scope.resetOperationList = function() {
        $scope.currentProduct.operationsDisplay = undefined;
        $scope.currentProduct.visibleBtnExtract = null;
    };

    $scope.getLinkedProducts = function(refresh) {
        if ($scope.currentProduct.deposit) {
            if ((!accountIdReq[$scope.currentProduct.id] && angular.isUndefined($scope.currentProduct.deposit.linkedProducts)) || refresh) {
                productSrv.getLinkedProductsForProduct($scope.currentProduct.deposit)();
            }
        } else {
            if ((!accountIdReq[$scope.currentProduct.id] && angular.isUndefined($scope.currentProduct.linkedProducts)) || refresh) {
                productSrv.getLinkedProductsForProduct($scope.currentProduct)();
            }
        }
    };

    $scope.getServices = function(refresh) {
        if ((!accountIdReq[$scope.currentProduct.id] && angular.isUndefined($scope.currentProduct.productServices)) || refresh) {
            if ($scope.currentProduct.deposit) {
                $scope.getServicesForProduct($scope.currentProduct.deposit, $scope.currentProduct)();
            } else {
                $scope.getServicesForProduct($scope.currentProduct)();
            }
        }
    };

    /**
     * Получение списка услуг и опций счета/вклада
     * @param product       счет / вклад
     * @param account       счет вклада, в случае вклада
     * @returns {Function}
     */
    $scope.getServicesForProduct = function(product, account) {
        return function() {
            if (account) {
                WebWorker.invoke('getProductServices', product, account.id).then(
                    function (result) {
                        account.productServices = result.data;
                    }
                );
            } else {
                WebWorker.invoke('getProductServices', product).then(
                    function (result) {
                        product.productServices = result.data;
                    }
                );
            }
        }
    };

    $scope.updateProduct = function(refresh) {
        if ($scope.currentProduct.deposit) {
            if ((!accountIdReq[$scope.currentProduct.id] && !$scope.currentProduct.deposit.isUpdatedABS) || refresh) {
                $scope.updateConcreteProduct($scope.currentProduct.deposit)();
            }
        } else {
            if ((!accountIdReq[$scope.currentProduct.id] && !$scope.currentProduct.isUpdatedABS) || refresh) {
                $scope.updateConcreteProduct($scope.currentProduct)();
            }
        }
    };

    $scope.updateConcreteProduct = function(product) {
        return function() {
            WebWorker.invoke('updateProduct', product).then(
                function(result) {
                    result.data.isUpdatedABS = true;    // в рамках сессии обновляем из АБС один раз, либо при pull to refresh

                    if (product.entityKind == 'RetailDeposit') {
                        depositSrv.updateDepositList(result.data);
                    } else {
                        $scope.clone(product, result.data);
                    }

                    // Выполняем в последнем запросе, чтобы скрыть вейтер обновления информации при Pull to refresh.
                    $scope.$broadcast('scroll.refreshComplete');
                }
            );
        }
    };

    $scope.showMoreOperations = function() {
        productSrv.showMoreOperations($scope.currentProduct, $scope);
    };

    /* ------- Top bar menu Popover ------- */
    $ionicPopover.fromTemplateUrl('templates/account/popover.html', {
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

    /*
     * Признак "Использовать для платежей"
     * disabled == true - продукт НЕ используется в платежах
     * disable == false - продукт используется в платежах
     */
    $scope.toggleDisabled = function(product) {
        WebWorker.invoke('setDisabled', product);
    };

    /*
     * Признак "Скрыть из списка продуктов"
     * isFavourite == true - тогглер выключен
     * isFavourite == false - тогглер включен
     */
    $scope.toggleFavourite = function(product) {
        WebWorker.invoke('setIsFavourite', product);
    };

    $scope.openServiceTermsPDF = function() {
        commonSrv.openPDF($scope.currentProduct.serviceTermsPDF);
    };

    /* Обновление информации при оттягивании страницы. Pull to refresh. */
    $scope.doRefresh = function() {
        $scope.resetOperationList();
        $scope.updateProduct(true);
        $scope.getOperationList(true);
        $scope.getLinkedProducts(true);
        $scope.getServices(true);
        $scope.$applyAsync();
    };

    $scope.getProductSref = function(product) {
        return productSrv.getProductSref(product);
    };

    $scope.getTermDeposit = function() {
        var term = $scope.currentProduct.deposit.term;
        if ($scope.currentProduct.deposit.endDate) {
            term += ' до ' + $filter('defaultDate')($scope.currentProduct.deposit.endDate);
        }
        return term;
    };

    $scope.getLabelForInterestAccountNumber = function() {
        if ($scope.equalsInterestAndTransferAccounts()) {
            return 'Счет для выплаты процентов и возврата вклада';
        }
        return 'Номер счета для выплаты процентов';
    };

    $scope.equalsInterestAndTransferAccounts = function() {
        return $scope.currentProduct.interestAccountNumber && $scope.currentProduct.transferAccountNumber
            && ($scope.currentProduct.interestAccountNumber == $scope.currentProduct.transferAccountNumber);
    };
}]);

/* Контроллер для WP */
app.controller('wpAccountCtrl', ['$scope', '$stateParams', 'utils', 'accountSrv', 'depositSrv', function($scope, $stateParams, utils, accountSrv, depositSrv) {
    var product = accountSrv.getAccountById($stateParams.productId) || depositSrv.getDepositById($stateParams.productId);

    /* выводим в карусель все счета и вклады */
    var productList = accountSrv.getAccountList(true).concat(accountSrv.getAccountList(false)).
        concat(depositSrv.getFavouriteDepositList()).concat(depositSrv.getNotFavouriteDepositList());
    $scope.productList = [];
    var list = [];

    /* Разделяем мультивалютные вклады по счетам в каждый объект, счета просто переписываются */
    for (var i = 0; i < productList.length; i++) {
        if (productList[i].entityKind && productList[i].entityKind == 'RetailDeposit') {
            for (var j = 0; j < productList[i].accountList.length; j++) {
                var account = productList[i].accountList[j];
                var deposit = angular.copy(productList[i]);
                deposit.depositId = deposit.id;
                deposit.id = account.id;         // перезаписываем id счета, а не вклада!!! для карусели
                deposit.account = account;
                list.push(deposit);
            }
        } else {
            list.push(productList[i]);
        }
    }
    $scope.productList = [];
    $scope.productList.push(list[0]);
    var operationLastMonth = {};
    // пока первый в списке
    $scope.currentProduct = $scope.productList[0];

    window.addEventListener('load', loadPivot, false);

    function loadPivot() {
        "use strict";

        var startPivot = WinJS.Application;

        startPivot.addEventListener("ready", function () {
            WinJS.UI.processAll().then(function () {

                var pivotControl2 = document.getElementById("appPivot1").winControl;

                pivotControl2.addEventListener("selectionchanged",  function selectionChanged(ev) {
                    var index = ev.target.winControl.selectedIndex;
                    var pivotControl1 = document.getElementById("appPivot1").winControl;
                    pivotControl1.selectedIndex = index;
                });

            });
        });
    }
}]);

app.controller('AccountOpenReqCtrl', ['$scope', 'WebWorker', '$ionicModal', 'sys', '$state', '$location',
function($scope, WebWorker, $ionicModal, sys, $state, $location) {
    $scope.form = {};

    var actionStrId = 'RetailConfirmRequestAction';   // идентификатор защищаемого действия
    var args = null;        // аргументы защищаемого действия для его выполнения из контроллера подтверджения

    if ($scope.globals.dataObjectForSessionTimeout) {
        initBySessionTimeout();
    } else {
        init();
    }

    function initBySessionTimeout() {
        $scope.form = $scope.globals.dataObjectForSessionTimeout;
        delete($scope.globals.dataObjectForSessionTimeout);
        if (!$scope.form.accountTypeList) {
            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage("getAccountProductList", "getAccountProductList");
        } else if (!$scope.form.tariffRate) {
            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage("getTariffAmountAndRateForNewAccount", "getTariffAmountAndRateForNewAccount",
                [$scope.form.businessProductUuid[$scope.form.selectedCurrency], $scope.form.selectedCurrency, 0]);
        }
    }

    function init() {
        $scope.form.fromTransfer = $state.params.fromTransfer;
        $scope.form.readOnly = $state.params.retailDoc != null;
        $scope.form.confirm = false;
        $scope.form.currencyList = undefined;
        $scope.form.businessProductUuid = {};
        $scope.form.conditionsFile = {};
        $scope.form.office = {};

        /* Режим просмотра заявки */
        if ($scope.form.readOnly) {
            $scope.form.retailDoc = $state.params.retailDoc;
            $scope.form.selectedType = $scope.form.retailDoc.businessProduct;
            $scope.form.tariffRate = $scope.form.retailDoc.tariffInfo.rate;
            $scope.form.selectedCurrency = $scope.form.retailDoc.currency;
            $scope.form.regionList = $scope.form.retailDoc.regionList;
            $scope.form.office.region = $scope.form.regionList[0];
            $scope.form.office.city = $scope.form.office.region.cityList[0];
            $scope.form.office.branch = $scope.form.office.city.branchList[0];

        /* Создание новой заявки */
        } else {
            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage("getAccountProductList", "getAccountProductList");
        }
    }

    function processingResults(data) {
            switch (data.cmdInfo) {
                case 'getAccountProductList':
                    $scope.form.accountTypeList = data.result.data || [];
                    $scope.form.selectedType = $scope.form.accountTypeList[0];
                    $scope.changeType();

                    $scope.form.tariffRate = undefined;
                    $scope.saveDataForSessionTimeout($scope.form);
                    WebWorker.postMessage("getTariffAmountAndRateForNewAccount", "getTariffAmountAndRateForNewAccount",
                            [$scope.form.businessProductUuid[$scope.form.selectedCurrency], $scope.form.selectedCurrency, 0]);
                    break;
                case 'getTariffAmountAndRateForNewAccount':
                    $scope.form.tariffRate = data.result.data.rate || null;
                    break;
                case 'sendNewAccountRequest':
                    // <для подтверждения одноразовым паролем>
                    if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                        $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm');
                        return;
                    } else if (data.result.data == 'true') {
                        $scope.form.showButton = false;
                        $scope.confirmationHide();

                        // Действия после успешной отправки.
                        alert('Заявка отправлена').finally(function() {
                            // при создании из платежа возвращаемся в платежи и переводы
                            if ($scope.form.fromTransfer) {
                                $scope.goBack(2);
                            } else {
                                $scope.goBack();
                            }
                        });
                    } else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                        $scope.confirmationFalse(data.result.data);
                    } else {
                        $scope.confirmationHide();
                        $scope.form.showButton = true;
                        alert(data.result.data);
                    }
                    // </для подтверждения одноразовым паролем>
                    break;
            }
            $scope.$apply();
    }
    WebWorker.setFunction(processingResults);

    $scope.changeType = function() {
        $scope.form.currencyList = [];
        for (var i = 0; i < $scope.form.selectedType.currencyList.length; i++) {
            var isoString = $scope.form.selectedType.currencyList[i].isoString;
            $scope.form.currencyList.push(isoString);
            $scope.form.businessProductUuid[isoString] = $scope.form.selectedType.currencyList[i].businessProductUuid;
            $scope.form.conditionsFile[isoString] = $scope.form.selectedType.currencyList[i].conditionsFile;
        }
        $scope.form.selectedCurrency = $scope.form.currencyList[0];
    };

    $scope.changeCurrency = function() {
        // костыль: при смене типа changeType вызывается и changeCurrency и $scope.accOpenCtrl.selectedCurrency == undefined
        if (!$scope.form.selectedCurrency) {
            $scope.form.selectedCurrency = $scope.form.currencyList[0];
        }
        $scope.form.tariffRate = undefined;
        $scope.saveDataForSessionTimeout($scope.form);
        WebWorker.postMessage("getTariffAmountAndRateForNewAccount", "getTariffAmountAndRateForNewAccount",
                [$scope.form.businessProductUuid[$scope.form.selectedCurrency], $scope.form.selectedCurrency, 0]);
    };

    $scope.sendNewAccountRequest = function() {
        if (!$scope.form.office.branch) {
            alert('Выберите офис обслуживания', 'Открытие счета');
            return;
        }
        if (!$scope.form.confirm) {
            alert('Вы должны согласиться с условием открытия счета', 'Открытие счета');
            return;
        }
        if (!$scope.form.selectedCurrency || !$scope.form.businessProductUuid[$scope.form.selectedCurrency]) {
            alert('Невозможно оформить заявку', 'Открытие счета');
            return;
        }
        args = [actionStrId, $scope.form.businessProductUuid[$scope.form.selectedCurrency], $scope.form.selectedCurrency, $scope.form.office.branch];
        $scope.saveDataForSessionTimeout($scope.form);
        WebWorker.postMessage("sendNewAccountRequest", "sendNewAccountRequest", args);
    };

    // <выбор>
    $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/select.html', function($ionicModal) {
        $scope.select = $ionicModal;
    }, {
        scope: $scope
    });

    $scope.selectShow = function(listForSelect, resultId, headerText, fieldId) {
        if (!$scope.form.readOnly) {
            $scope.listForSelect = listForSelect;
            $scope.resultId = resultId;
            $scope.headerText = headerText;
            $scope.fieldId = fieldId;
            $scope.select.show();
        }
    };

    $scope.selectHide = function() {
        $scope.select.hide();
    };

    $scope.clickItem = function(item) {
        $scope.select.hide();
        $scope.form[$scope.resultId] = item;
    };
    // </выбор>
}]);

app.controller('AccountRequisitesCtrl', ['$scope', '$state', '$filter', '$ionicActionSheet', 'commonSrv', 'productSrv', 'accountSrv', 'WebWorker', '$ionicPopover', '$ionicPopup',
    function($scope, $state, $filter, $ionicActionSheet, commonSrv, productSrv, accountSrv, WebWorker, $ionicPopover, $ionicPopup) {

        $scope.account = productSrv.getCurrentProduct();

        if (!$scope.account.requisites) {
            if ($scope.account.deposit) {
                WebWorker.invoke('getReplenishmentDetails', $scope.account.deposit, $scope.account.id).then(
                    function(result) {
                        $scope.account.requisites = result.data;
                    }
                );
            } else {
                WebWorker.invoke('getReplenishmentDetails', $scope.account).then(
                    function(result) {
                        $scope.account.requisites = result.data;
                    }
                );
            }
        }

        $scope.getRequisitesTitle = function() {
            if ($scope.account.deposit) {
                return $scope.account.requisites.depositAccountDataLabel;
            }
            return $scope.account.requisites.accountDataLabel;
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

        $scope.retailClientEmail = $scope.retailClient.email;
        $scope.sendSMS = function() {
            commonSrv.sendRequisitesBySMS($scope.account.requisites);
        };

        $scope.sendEmail = function(email) {
            WebWorker.postMessage('sendEmail', 'sendEmail', [$scope.account, email, 'REPLENISHMENT']);
        };

        /* Переход на страницу для отправки на почту (с вводом адреса) (для ios) */
        $scope.goSendEmail = function() {
            $state.go('account.sendEmail', {formType: 'REPLENISHMENT'});
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
        $ionicPopover.fromTemplateUrl('templates/account/popover.html', {
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

app.controller('AccountRateInfoCtrl', ['$scope', 'productSrv', 'commonSrv', 'WebWorker', function($scope, productSrv, commonSrv, WebWorker) {
    $scope.account = productSrv.getCurrentProduct();

    if ($scope.account.deposit && !$scope.account.ratesTable) {
        WebWorker.invoke('getDepositRatesTable', $scope.account.deposit, $scope.account).then(
            function(result) {
                $scope.account.rateList = [];
                var ratesTable = result.data;
                for (var row in ratesTable) {
                    var rateInfo = {};
                    var rateList = [];
                    for (var col in ratesTable[row]) {
                        var rate = {};
                        rate.periodRange = ratesTable[row][col].periodRange;
                        rate.rate = ratesTable[row][col].rate;
                        rateList.push(rate);
                    }
                    rateInfo.amountRange = ratesTable[row][0].amountRange;
                    rateInfo.rateList = rateList;
                    $scope.account.rateList.push(rateInfo);
                }
            }
        );
    } else if (!$scope.account.rateList) {
        WebWorker.invoke('getRateInfo', $scope.account).then(
            function (result) {
                $scope.account.rateList = result.data;
            }
        );
    }

    $scope.getFormattedPeriodRange = function(periodRange) {
        return periodRange.min == periodRange.max
            ? periodRange.min + commonSrv.getDaysInDecline(periodRange.min)
            : periodRange.min + ' - ' + periodRange.max + commonSrv.getDaysInDecline(periodRange.max);
    };

    $scope.getFormattedAmountRange = function(amountRange) {
        return amountRange.max
            ? 'Сумма от ' + amountRange.min + ' до ' + amountRange.max
            : 'Сумма от ' + amountRange.min;
    };
}]);