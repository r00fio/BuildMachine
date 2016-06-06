var app = angular.module('app');

app.controller('DepositNewCtrl', ['$scope', '$state', '$filter', 'WebWorker', 'openDepositSrv', function($scope, $state, $filter, WebWorker, openDepositSrv) {
    $scope.form = {};
    $scope.form.searchParams = {};

    $scope.setActiveTarget = function(activeTarget){
        sendRequest({target: activeTarget});
    };

    /* инициализировать только в случае возврата в текущее depositselect состояние (есть дочерние и этот контроллер также отрабатывает) */
    if ($state.current.name == 'depositselect' && $scope.globals.dataObjectForSessionTimeout) {
        initBySessionTimeout();
    } else {
        init();
    }

    function initBySessionTimeout() {
        $scope.form = $scope.globals.dataObjectForSessionTimeout;
        delete($scope.globals.dataObjectForSessionTimeout);
        if (!$scope.form.suitableDeposits) {
            if ($scope.form.activeTarget) {
                $scope.setActiveTarget($scope.form.activeTarget);
            } else if ($scope.form.searchParams) {
                sendRequest($scope.form.searchParams);
            }
        }
    }

    function init() {
        $scope.setActiveTarget('SAVE');
    }

    function getResultHandler(activeTarget){
        return function(result){
            if (activeTarget == $scope.form.activeTarget) {
                $scope.form.suitableDeposits = result.data;
            }
        };
    }

    function sendRequest(requestParams){
        $scope.form.suitableDeposits = undefined;
        $scope.form.selectionCount = null;
        if (angular.isObject(requestParams) && ('target' in requestParams)) {
            $scope.form.activeTarget = requestParams.target;
        } else {
            delete $scope.form.activeTarget;
        }
        $scope.saveDataForSessionTimeout($scope.form);
        WebWorker.invoke('getDepositsToCompare', requestParams).then(getResultHandler($scope.form.activeTarget));
    }

    $scope.setSearchParams = function(newParams){
        $scope.form.searchParams = angular.isObject(newParams) ? newParams : {};
        $scope.form.paramStr = openDepositSrv.buildDepositParamsStr($scope.form.searchParams);

        var searchParams = angular.copy($scope.form.searchParams);
        if (searchParams.currency) { searchParams.currency = searchParams.currency.value; }
        if (searchParams.interestPayOut) { searchParams.interestPayOut = searchParams.interestPayOut.value; }
        if (searchParams.intCreditSep) { searchParams.intCreditSep = searchParams.intCreditSep.value; }

        // Если валюта не задана, то сумма вклада и сумма пополнения не участвуют в фильтрации
        if (!searchParams.currency) {
            delete searchParams.amount;
            delete searchParams.refillAmount;
        }

        sendRequest(searchParams);
    };

    $scope.getSearchParams = function(){ return $scope.form.searchParams; };

    $scope.onDepositSelChange = function() {
        $scope.form.selectionCount = $filter('filter')($scope.form.suitableDeposits, {isSelected: true}).length;
    };

    // сравнить вклады
    $scope.compareDeposits = function() {
        var depositCompareList = $filter('filter')($scope.form.suitableDeposits, {isSelected: true}) || [];
        openDepositSrv.setDepositCompareList(depositCompareList);
        $state.go('depositselect.depositcompare');
    };
}]);

app.controller('DepositParamsCtrl', ['$scope', 'WebWorker', 'openDepositSrv', function($scope, WebWorker, openDepositSrv) {
    $scope.formParams = {};
    $scope.currencyList = openDepositSrv.createCurrencyObjects(['RUB', 'USD', 'EUR']);
    $scope.creditSepList = openDepositSrv.getIntCreditSepList();
    $scope.interestPayOutList = openDepositSrv.getInterestPayOutList();

    if ($scope.globals.dataObjectForSessionTimeout) {
        initBySessionTimeout();
    } else {
        init();
    }

    function initBySessionTimeout() {
        $scope.formParams = $scope.globals.dataObjectForSessionTimeout;
        delete($scope.globals.dataObjectForSessionTimeout);
        if (!$scope.formParams.termOptionList) {
            requestData();
        }
    }

    function init() {
        $scope.formParams.searchParams = angular.copy($scope.$parent.getSearchParams());
        requestData();
    }

    function requestData() {
        $scope.saveDataForSessionTimeout($scope.formParams);
        WebWorker.invoke('getDepositTerms').then(function(result){
            $scope.formParams.termOptionList = result.data;
            if (!$scope.formParams.searchParams.termPeriod) {
                $scope.formParams.searchParams.termPeriod = $scope.formParams.termOptionList[0];
            }
        });
    }

    $scope.$watch('searchParams.termPeriod', function(newVal){
        if (newVal && newVal.termStart) {
            $scope.formParams.searchParams.term = newVal.termStart;
        }
    });

    $scope.onTermChange = function(){
        // Если количество дней вводится пользователем, то срок сбрасываем на индивидуальный
        if ($scope.formParams.searchParams.termPeriod && $scope.formParams.searchParams.termPeriod.termStart) {
            $scope.formParams.searchParams.termPeriod = $scope.formParams.termOptionList[$scope.formParams.termOptionList.length - 1]; // Индивидуальный срок - последний в списке
        }
    };

    $scope.ok = function() {
        $scope.$parent.setSearchParams($scope.formParams.searchParams);
        $scope.goBack();
    };
}]);

app.controller('DepositCompareCtrl', ['$scope', '$state', '$window', 'openDepositSrv', function($scope, $state, $window, openDepositSrv) {
    /* Если плагин подключен пытаемся повернуть экран при заходе на страницу и вернуть обратно при выходе со страницы */
    if (angular.isFunction($window.screen.lockOrientation)) {
        $window.screen.lockOrientation('landscape');
        $scope.$on('$destroy', function () {
            if ($state.current.name != 'depositselect.depositcompareparams') {
                $window.screen.lockOrientation('portrait');
            }
        });
    }

    $scope.depositList = openDepositSrv.getDepositCompareList();
    $scope.compareParams = openDepositSrv.getDepositCompareParams();
}]);

app.controller('DepositCompareParamsCtrl', ['$scope', '$state', 'openDepositSrv', function($scope, $state, openDepositSrv) {
    $scope.depositList = openDepositSrv.getDepositCompareList();
    $scope.compareParams = angular.copy(openDepositSrv.getDepositCompareParams());

    var getParamByStrId = function(strId){
        for (var i = 0; i < $scope.compareParams.length; i++) {
            if ($scope.compareParams[i].strId == strId) {
                return $scope.compareParams[i];
            }
        }
        return null;
    };

    $scope.diffParams = [];
    angular.forEach($scope.depositList, function (deposit, idx) {
        if (idx > 0) {
            for (var prop in deposit) {
                if (!angular.equals(deposit[prop], $scope.depositList[idx - 1][prop])) {
                    var param = getParamByStrId(prop);
                    if (param) {
                        $scope.diffParams.push(param);
                    }
                }
            }
        }
    });

    $scope.onlyDiff = {};
    var prevParamSelection;
    $scope.$watch('onlyDiff.value', function(newValue){
        if (newValue) {
            prevParamSelection = [];
            angular.forEach($scope.compareParams, function (param, idx) {
                if (param.value) {
                    prevParamSelection.push(idx);
                }
                param.value = false;
            });
            angular.forEach($scope.diffParams, function (param, idx) {
                param.value = true;
            });
        } else {
            if (prevParamSelection) {
                angular.forEach($scope.diffParams, function (param, idx) {
                    param.value = false;
                });
                angular.forEach($scope.compareParams, function (param, idx) {
                    if (prevParamSelection.indexOf(idx) > -1) {
                        param.value = true;
                    }
                });
            }
        }
    });

    $scope.toggleParamValue = function(param) {
        param.value = !param.value;
        prevParamSelection = null;
        $scope.onlyDiff.value = false;
    };

    $scope.removeFromComparison = function(deposit){
        var depositIdx = $scope.depositList.indexOf(deposit);
        $scope.depositList.splice(depositIdx, 1);
    };

    $scope.ok = function() {
        openDepositSrv.setDepositCompareParams($scope.compareParams);
        $scope.goBack();
    };
}]);

app.controller('DepositDetailsCtrl', ['$scope', '$state', '$sce', function($scope, $state, $sce) {
    $scope.formDetails = {};

    /* инициализировать только в случае возврата в текущее depositselect.depositdetails состояние (есть дочернее и этот контроллер также отрабатывает) */
    if ($state.current.name == 'depositselect.depositdetails') {
        if ($scope.globals.dataObjectForSessionTimeout) {
            initBySessionTimeout();
        } else {
            init();
        }
    }

    function initBySessionTimeout() {
        $scope.formDetails = $scope.globals.dataObjectForSessionTimeout;
        delete($scope.globals.dataObjectForSessionTimeout);
    }

    function init() {
        $scope.formDetails.deposit = $state.params.deposit;
        $scope.formDetails.logoUrl = $scope.getLogoUrl($scope.formDetails.deposit.logo.url);

        var currencyNames = [];
        if ($scope.formDetails.deposit.amounts.RUB) {
            currencyNames.push('рубли');
        }
        if ($scope.formDetails.deposit.amounts.USD) {
            currencyNames.push('доллары США');
        }
        if ($scope.formDetails.deposit.amounts.EUR) {
            currencyNames.push('евро');
        }
        $scope.formDetails.currencyText = currencyNames.join(', ');
        $scope.formDetails.trustedDepositInfo = $sce.trustAsHtml($scope.formDetails.deposit.addInfo);
        $scope.saveDataForSessionTimeout($scope.formDetails);
    }
}]);

app.controller('DepositOpenCtrl', ['$scope', '$stateParams', '$ionicModal', '$timeout', 'sys', 'WebWorker', 'openDepositSrv',
function($scope, $stateParams, $ionicModal, $timeout, sys, WebWorker, openDepositSrv) {
    $scope.form = {};

    // для подтверждения одноразовым паролем
    var args = [];
    var actionStrId = 'RetailConfirmRequestAction';

    if ($scope.globals.dataObjectForSessionTimeout) {
        initBySessionTimeout();
    } else {
        init();
    }

    function initBySessionTimeout() {
        $scope.form = $scope.globals.dataObjectForSessionTimeout;
        delete($scope.globals.dataObjectForSessionTimeout);
        if (!$scope.form.sourceProductList) {
            requestProducts();
        }
        if (!$scope.form.finalAmount) {
            sendRequestFinalAmount();
        }
    }

    function init() {
        $scope.form.readOnly = !angular.isUndefined($stateParams.retailDoc) && $stateParams.retailDoc != null;
        $scope.form.finalAmount = 0;

        // все параметры, кроме этих трех, берем из выбранного продукта
        var depositParams;
        if (!$scope.form.readOnly && angular.isObject(depositParams = $scope.getSearchParams())) {
            $scope.form.amount = depositParams.amount;
            $scope.form.currency = depositParams.currency;
            $scope.form.term = depositParams.termPeriod && depositParams.termPeriod.termStart
                ? depositParams.termPeriod.termStart : depositParams.term;
            sendRequestFinalAmount();
        }

        /* Режим просмотра заявки */
        if ($scope.form.readOnly) {
            $scope.form.retailDoc = $stateParams.retailDoc;
            $scope.form.currency = openDepositSrv.createCurrencyObjects($scope.form.retailDoc.currency);
            $scope.form.amount = $scope.form.retailDoc.sum;
            $scope.form.term = $scope.form.retailDoc.period;
            var date = new Date();
            date.setDate(date.getDate() + (parseInt($scope.form.term) || 0));
            $scope.form.endDate = date;
            $scope.form.deposit = {};
            $scope.form.deposit.intCreditSep = $scope.form.retailDoc.businessProduct.intCreditSep;
            $scope.form.deposit.capitalization = openDepositSrv.getIntCreditSepDispName(!$scope.form.retailDoc.businessProduct.capitalization);
            $scope.form.deposit.interestPayOut = $scope.form.retailDoc.businessProduct.interestPayOut.desc;
            $scope.form.deposit.uuid = $scope.form.retailDoc.businessProduct.uuid;                                    // это поле нужно для получения ожидаемой суммы вклада
            $scope.form.deposit.capitalizationPeriod = $scope.form.retailDoc.businessProduct.interestPayOut.value;    // и это тоже
            sendRequestFinalAmount();
            $scope.form.deposit.extension = $scope.form.retailDoc.businessProduct.extension;
            $scope.form.sourceProduct = $scope.form.retailDoc.sourceProduct;
            $scope.form.accForInterests = $scope.form.retailDoc.accForInterests;
            $scope.form.accForClosing = $scope.form.retailDoc.accForClosing;
            $scope.form.regionList = $scope.form.retailDoc.regionList;
            $scope.form.region = $scope.form.regionList[0];
            $scope.form.city = $scope.form.region.cityList[0];
            $scope.form.branch = $scope.form.city.branchList[0];
        } else {
            /* Создание новой заявки */
            if ($scope.form.currency) {
                requestProducts();
            } else {
                // фиктивная установка, чтобы не крутились вейтеры, если пришли из цели - параметры вклада не выбраны, без валюты продукты не запросить
                $scope.form.sourceProduct = {};
                $scope.form.accForInterests = {};
                $scope.form.accForClosing = {};
            }
            $scope.form.deposit = $stateParams.deposit;
            // оставлять на вкладе = капитализация, то есть обратно значению intCreditSep
            $scope.form.deposit.capitalization = openDepositSrv.getIntCreditSepDispName(!$scope.form.deposit.capitalization);
            $scope.form.currencyList = openDepositSrv.createCurrencyObjects($scope.form.deposit.currency);
            $scope.form.interestPayOutList = openDepositSrv.getInterestPayOutList();
            $scope.form.intCreditSepList = openDepositSrv.getIntCreditSepList();
        }
        $scope.saveDataForSessionTimeout($scope.form);
    }

    function requestProducts() {
        $scope.saveDataForSessionTimeout($scope.form);
        WebWorker.postMessage('getSourceForInitDeposit', 'getSourceForInitDeposit', [$scope.form.currency]);
        WebWorker.postMessage('getAccountForClosingDeposit', 'getAccountForClosingDeposit', [$scope.form.currency]);
    }

    /**
     * Отправка запроса на окончательную сумму вклада с учетом, что все требуемые поля заполнены
     */
    function sendRequestFinalAmount() {
        if (
            $scope.form.currency && $scope.form.currency.value
            && $scope.form.amount
            && $scope.form.term
        ) {
            delete $scope.form.finalAmount;

            sys.buffer(function(){
                /* параметры для расчета ожидаемой суммы вклада */
                var expectedAmountParams = {};
                expectedAmountParams.currency = $scope.form.currency.value;
                expectedAmountParams.amount = $scope.form.amount;
                expectedAmountParams.term = $scope.form.term;
                $scope.saveDataForSessionTimeout($scope.form);
                WebWorker.postMessage('getFinalAmount', 'getFinalAmount', [$scope.form.deposit.uuid, JSON.stringify(expectedAmountParams)]);
            });
        } else {
            $scope.form.finalAmount = null;
        }
    }

    var processingResults = function(data) {
        switch (data.cmdInfo) {
            case 'getSourceForInitDeposit':
                $scope.form.sourceProductList = data.result.data;
                if (data.result.data.length > 0) {
                    $scope.form.sourceProduct = $scope.form.sourceProductList[0];
                }
                break;
            case 'getAccountForClosingDeposit':
                $scope.form.creditAccountList = data.result.data;
                if (data.result.data.length > 0) {
                    $scope.form.accForClosing = $scope.form.creditAccountList[0];
                    if ($scope.form.deposit.intCreditSep) {
                        $scope.form.accForInterests = $scope.form.creditAccountList[0];
                    }
                }
                break;
            case 'getFinalAmount':
                $scope.form.finalAmount = data.result.data || null;
                break;
            case 'sendOpenDepositRequest':
                if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                    $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm');
                    return;
                } else if (data.result.data == 'true') {
                    $scope.confirmationHide();

                    // Действия после успешной отправки.
                    alert('Заявление на новый вклад принято в обработку').finally(function() {
                        $scope.goBack(3);
                    });
                } else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                    $scope.confirmationFalse(data.result.data);
                    return;
                } else {
                    $scope.confirmationHide();
                    alert(data.result.data);
                }
                break;
        }
        $scope.$apply();
    };
    WebWorker.setFunction(processingResults);

    $scope.changeCurrency = function() {
        $scope.saveDataForSessionTimeout($scope.form);
        WebWorker.postMessage('getSourceForInitDeposit', 'getSourceForInitDeposit', [$scope.form.currency]);
        WebWorker.postMessage('getAccountForClosingDeposit', 'getAccountForClosingDeposit', [$scope.form.currency]);
        sendRequestFinalAmount();
    };

    $scope.changeAmount = function() {
        sendRequestFinalAmount();
    };

    $scope.changeTerm = function() {
        var date = new Date();
        date.setDate(date.getDate() + (parseInt($scope.form.term) || 0));
        $scope.form.endDate = date;
        sendRequestFinalAmount();
    };
    $scope.changeTerm();

    $scope.showRequestButton = function() {
        return !$scope.form.readOnly && $scope.form.finalAmount && $scope.form.amount && ($scope.form.finalAmount != $scope.form.amount);
    };

    $scope.sendOrder = function() {
        if (!$scope.form.currency) {
            alert('Необходимо выбрать валюту вклада');
            return;
        }
        if (!$scope.form.amount) {
            alert('Необходимо ввести сумму вклада');
            return;
        }
        if (!$scope.form.term) {
            alert('Необходимо ввести срок вклада');
            return;
        }
        if (!$scope.form.sourceProduct) {
            alert('Необходимо выбрать источник первоначального взноса');
            return;
        }
        if (!$scope.form.region) {
            alert('Необходимо выбрать регион');
            return;
        }
        if (!$scope.form.city) {
            alert('Необходимо выбрать город');
            return;
        }
        if (!$scope.form.branch) {
            alert('Необходимо выбрать офис');
            return;
        }

        var params = {};
        params.depositId = $scope.form.deposit.id.toString();
        params.currency = $scope.form.currency.value;
        params.amount = $scope.form.amount.toString();
        params.term = $scope.form.term.toString();
        params.sourceProductUuid = $scope.form.sourceProduct.uuid;
        params.accForInterestsUuid = $scope.form.accForInterests ? $scope.form.accForInterests.uuid : null;
        params.accForClosingUuid = $scope.form.accForClosing ? $scope.form.accForClosing.uuid : null;
        params.branchUuid = $scope.form.branch.uuid;

        $scope.saveDataForSessionTimeout($scope.form);
        args = [actionStrId, JSON.stringify(params)];
        WebWorker.postMessage('sendOpenDepositRequest', 'sendOpenDepositRequest', args);
    };

    // <выбор продукта>
    $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/selectproduct.html', function($ionicModal) {
        $scope.selectProduct = $ionicModal;
    }, {
        scope: $scope
    });

    $scope.selectProductShow = function(productList, resultId) {
        if (!$scope.form.readOnly && productList) {
            $scope.resultId = resultId;
            switch(resultId) {
                case 'accForInterests':
                    $scope.form.canOpenAccountForInterests = $scope.form.deposit.canOpenAccountForInterests;
                    $scope.form.canOpenAccountForClosing = false;
                    break;
                case 'accForClosing':
                    $scope.form.canOpenAccountForInterests = false;
                    $scope.form.canOpenAccountForClosing = $scope.form.deposit.canOpenAccountForClosing;
                    break;
                default:
                    $scope.form.canOpenAccountForInterests = false;
                    $scope.form.canOpenAccountForClosing = false;
                    break;
            }
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

        // после выбора продукта вернуть реальные значения, чтобы верно отобразилась форма
        $scope.form.canOpenAccountForInterests = $scope.form.deposit.canOpenAccountForInterests;
        $scope.form.canOpenAccountForClosing = $scope.form.deposit.canOpenAccountForClosing;
    };
    // </выбор продукта>
}]);