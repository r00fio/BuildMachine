/**
 * Контроллеры выписки
 */
var app = angular.module('app');

/**
 * Просмотр выписки за указанный период
 */
app.controller('ExtractCtrl', ['$scope', '$state', 'sys', 'productSrv', 'WebWorker', function($scope, $state, sys, productSrv, WebWorker) {
    $scope.product = productSrv.getCurrentProduct();
    $scope.extract = productSrv.getCurrentExtract(true);
    $scope.extract.errorLoad = false;
    $scope.statisticState = $state.current.name + '.statistic';
    $scope.operationState = $state.current.name + '.operation';
    $scope.sendExtractState = $state.current.name.replace('extract', 'sendextract');

    $scope.extractDateFrom = new Date();
    $scope.extractDateFrom.setMonth($scope.extractDateFrom.getMonth() - 1);
    $scope.extractDateFrom.setDate($scope.extractDateFrom.getDate() + 1);
    $scope.extractDateTo = new Date();

    $scope.hideDatePickers = function() {
        $scope.$broadcast('close-ios-datepickers');
    };

    $scope.hideAndroidDatePickers = function() {
        $scope.$broadcast('close-android-datepickers');
    };

    $scope.onChangeDate = function() {
        if ($scope.extract) {
            $scope.showExtract();
        }
    };

    $scope.showExtract = function() {
        var errors = "";

        if (!$scope.extractDateFrom) {
            errors += "Заполните начало периода\n";
        }
        if (!$scope.extractDateTo) {
            errors += "Заполните конец периода\n";
        }
        if (errors.length > 0) {
            alert(errors);
            return;
        }

        $scope.showSpinner = true;
        $scope.extract = productSrv.getCurrentExtract(true);

        WebWorker.invoke('getExtract', $scope.product, $scope.extractDateFrom, $scope.extractDateTo).then(function(result) {
            $scope.showSpinner = false;
            productSrv.resultGetExtract()(result);
        }, function() {
            $scope.showSpinner = false;
        });
        $scope.hideDatePickers();
        $scope.hideAndroidDatePickers();
    };

    $scope.showMoreOperations = function() {
        if ($scope.extract.operationList) {
            $scope.extract.operationsDisplay = $scope.extract.operationList.slice(0, $scope.extract.operationsDisplay.length + 10);
            $scope.$apply();
        }
    };

    $scope.redirectToSendEmail = function() {
        $state.go($scope.sendExtractState, {dates: {from: $scope.extractDateFrom, to: $scope.extractDateTo }});
    };

}]);

/**
 * Отправка выписки за указанный период
 */
app.controller('SendExtractCtrl', ['$scope', '$state', 'sys', 'productSrv', 'WebWorker', function($scope, $state, sys, productSrv, WebWorker) {
    $scope.product = productSrv.getCurrentProduct();
    $scope.errorLoad = false;

    var monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    monthAgo.setDate(monthAgo.getDate() + 1);
    var now = new Date();
    $scope.extractDateFrom = $state.params.dates.from || monthAgo;
    $scope.extractDateTo = $state.params.dates.to || now;

    function processingResults(data) {
        if (data.result) {
                switch (data.cmdInfo) {
                    case 'sendExtractToEmail':
                        alert(data.result.data);
                        break;
                }
                $scope.$apply();
        }
    }
    WebWorker.setFunction(processingResults);

    $scope.hideDatePickers = function() {
        $scope.$broadcast('close-ios-datepickers');
    };

    $scope.hideAndroidDatePickers = function() {
        $scope.$broadcast('close-android-datepickers');
    };

    $scope.sendExtract = function() {
        var errors = "";
        if (!$scope.extractDateFrom) {
            errors += "Заполните начало периода\n";
        }
        if (!$scope.extractDateTo) {
            errors += "Заполните конец периода\n";
        }
        var email = "";
        jQuery("#send-email-address").each(function(e) {
            email = this.value;
        });
        if (!email || !email.match(/.+\@.+\..+/ig)) {
            errors += "Заполните E-mail\n";
        }

        if (errors.length > 0) {
            alert(errors);
            return;
        }

        WebWorker.postMessage('sendEmail', 'sendExtractToEmail', [$scope.product, email, 'EXTRACT', $scope.extractDateFrom, $scope.extractDateTo]);
        $scope.hideDatePickers();
        $scope.hideAndroidDatePickers();
    };

}]);

/**
 * "Расходы и статистика" по выписке
 */
app.controller('ExtractStatisticCtrl', ['$scope', '$state', '$ionicScrollDelegate', 'productSrv',
function($scope, $state, $ionicScrollDelegate, productSrv) {
    $scope.product = productSrv.getCurrentProduct();
    $scope.extract = productSrv.getCurrentExtract();
    var categoryState = $state.current.name.replace('statistic', 'category');

    $scope.showCategory = function(category) {
        category.currency = $scope.extract ? $scope.extract.currency : null;
        productSrv.setCurrentCategory(category);
        $state.go(categoryState);
    };

    var donutData = [];
    for (var i = 0; i < $scope.extract.categoryList.length; i++) {
        var value = parseInt($scope.extract.categoryList[i].percent.toFixed(0));
        if (value != 0) {
            donutData.push({
                value: value,
                text: value + '%',
                color: $scope.extract.categoryList[i].color,
                domId: '#expense-category-' + $scope.extract.categoryList[i].strId
            });
        }
    }
    $scope.donutData = {};
    $scope.donutData.data = donutData;

    $scope.onDonutSectorClick = function(event, sectorIndex, sectorData){
        angular.element('.mts-controll-category-highlight').removeClass('mts-controll-category-highlight');
        var selectedEl = angular.element(sectorData.domId).addClass('mts-controll-category-highlight');

        if (selectedEl.length) {
            $ionicScrollDelegate.scrollTo(selectedEl[0].offsetLeft, selectedEl[0].offsetTop, true);
        }
    };
}]);

/**
 * Просмотр конкретной категории из выписки
 */
app.controller('ExtractCategoryCtrl', ['$scope', '$state', 'productSrv', '$rootScope', function($scope, $state, productSrv, $rootScope) {
    $scope.extract = productSrv.getCurrentExtract();
    $scope.category = productSrv.getCurrentCategory();
    $scope.operationsDisplay = $scope.category.operationList.slice(0, 10);
    $scope.operationState = $state.current.name.replace('category', 'operation');

    if ($scope.category) {
        var oldColor = $rootScope.statusBarColor;
        $rootScope.statusBarColor = $scope.category.color;
        $scope.$on('$destroy', function() {
            $rootScope.statusBarColor = oldColor;
        });
    }

    $scope.showMoreOperations = function() {
        $scope.operationsDisplay = $scope.category.operationList.slice(0, $scope.operationsDisplay.length + 10);
        $scope.$apply();
    };
}]);

/**
 * Просмотр краткой и детальной информации операции
 */
app.controller('ExtractOperationCtrl', ['$scope', '$state', 'productSrv', 'WebWorker', '$ionicModal', '$ionicPopover',
    '$ionicActionSheet', '$ionicPopup', '$ionicScrollDelegate', '$filter', 'sys', 'commonSrv', 'paymentSrv', 'costsSrv',
function($scope, $state, productSrv, WebWorker, $ionicModal, $ionicPopover, $ionicActionSheet, $ionicPopup, $ionicScrollDelegate, $filter, sys, commonSrv, paymentSrv, costsSrv) {
    $scope.operation = productSrv.getCurrentOperation();
    $scope.isNegative = $scope.operation.isNegativeTransactionSum;
    $scope.isShowDetails = false;

    /* признак возможности отправки квитанции */
    $scope.canSendReceipt = $scope.operation.isOnline && $scope.operation.isAuthor && $scope.operation.isProcessed;

    function processingResults(data) {
        if (data.result) {
                switch (data.cmdInfo) {
                    case 'getCategoryOperatio':
                        $scope.categories = data.result.data;
                        break;
                    case 'sendToEmailPaymentReceipt':
                        if (data.result.data) {
                            alert(data.result.data);
                        }
                        break;
                }
                $scope.$apply();
        }
    }
    WebWorker.setFunction(processingResults);

    $scope.showDetails = function() {
        $scope.isShowDetails = true;
        $ionicScrollDelegate.resize();
    };

    $scope.hideDetails = function() {
        $scope.isShowDetails = false;
        $ionicScrollDelegate.resize();
    };

    $scope.isViewRateOperation = function() {
        return ($scope.operation.rateLock || $scope.operation.rateWriteOff) && $scope.isDifferentCurrencies();
    };

    $scope.isDifferentCurrencies = function() {
        return $scope.operation.transactionCurrency && $scope.operation.currency
            && $scope.operation.transactionCurrency != $scope.operation.currency;
    };

    /* алгоритм директивы conversionRate не подходит, тут несколько по-другому данные устроены, алгоритм идентичен ИК */
    $scope.calcRateOperation = function() {
        if ($scope.operation.isAccountOperation && $scope.operation.transactionCurrency == 'RUB') {
                $scope.fromAmount = 1;
                $scope.toAmount = $scope.operation.rateLock || $scope.operation.rateWriteOff;
                $scope.fromCurrency = $scope.operation.currency;
                $scope.toCurrency = $scope.operation.transactionCurrency;
        } else {
            $scope.fromAmount = 1;
            $scope.toAmount = $scope.operation.rateLock || $scope.operation.rateWriteOff;
            $scope.fromCurrency = $scope.operation.transactionCurrency;
            $scope.toCurrency = $scope.operation.currency;
        }
    };

    $scope.saveOperationComment = function() {
        WebWorker.invoke('saveOperationComment', $scope.operation).then(
            function(result) {
                if (!result.code) {

                    /* если в операцию попали из выписки, проставим коммент ещё в списке операций продукта */
                    if ($state.previous.name.match(/.extract/)) {
                        for (var i = 0; i < productSrv.getCurrentProduct().operationList.length; i++) {
                            if ($scope.operation.extId == productSrv.getCurrentProduct().operationList[i].extId) {
                                productSrv.getCurrentProduct().operationList[i].comment = $scope.operation.comment;
                                break;
                            }
                        }
                    }
                } else {
                    $scope.operation.comment = '';
                }
            }
        );
    };

    $scope.repeatOperation = function() {
        var params = paymentSrv.getParamsToRedirectFromFavourites($scope.operation.template, null);
        if (params) {
            $state.go(params.link, params.linkParams);
        }
    };

        $scope.retailClientEmail = $scope.retailClient.email;

        $scope.sendEmail = function(email) {
            WebWorker.postMessage('sendToEmailPaymentReceipt', 'sendToEmailPaymentReceipt', [$scope.operation.retailDocId, email]);
        };

        /* Переход на страницу для отправки на почту (с вводом адреса) (для ios) */
        $scope.goSendEmail = function() {
            $state.go('sendtoemailreceipt', {operation: $scope.operation});
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

        /* Показать ActionSheet для выбора способа отправки квитанции (для ios) */
        $scope.showSend = function() {
            var buttons = $scope.retailClientEmail
                ? [{ text: $scope.retailClientEmail }, { text: 'Отправить на e-mail' }]
                : [{ text: 'Отправить на e-mail' }];

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

        /* Показать Popover для выбора способа отправки квитанции (для android) */
        $ionicPopover.fromTemplateUrl('templates/extract/popover.html', {
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


        WebWorker.postMessage(
            'getEntitiesByCondition',
            'getCategoryOperatio',
            ['document', 'CategoryOperatio', 'true']);


        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/extract/selectCategory.html', function($ionicModal) {
            $scope.selectCategory = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.clickCategory = function(category) {
            WebWorker.invoke('saveOperationCategory', $scope.operation, category.code);
            $scope.selectCategory.hide();

            /* если в операцию пришли из настройки бюджета категории в контроле расходов, то перестроим месяц */
            if ($state.previous.name.match(/categorybudget/)) {
                costsSrv.recalculateCostsForMonth($state.previous.monthIdx).then(
                    function(result) {

                        /* в ответном списке новых категорий находим ту, которую выбрали, и обновляем текущую операцию из списка операций категории */
                        for (var i = 0; i < result.data.costs.categoryList.length; i++) {
                            if (category.code == result.data.costs.categoryList[i].strId) {
                                productSrv.updateCurrentOperation($scope.operation, result.data.costs.categoryList[i].operationList, false);
                                break;
                            }
                        }
                        /* и обновляем текущую категорию */
                        productSrv.updateCurrentCategory(result.data.costs.categoryList);
                    }
                )
            } else

            /* если в операцию попали из фильтра контроля расходов, обновляем бублик расходов за период, текущую операцию и текущую категорию */
            if ($state.previous.name.match(/controllingcostsfilter.category/)) {
                costsSrv.applyCostsFilter($scope.costsFilterCtrl).then(
                    function(result) {
                        costsSrv.resultApplyCostsFilter(result, $scope.costsFilterCtrl);
                        productSrv.updateCurrentOperation($scope.operation, result.data.extract.operationList, false);
                        productSrv.updateCurrentCategory(result.data.extract.categoryList);
                    }
                )
            } else

            /* если в операцию попали из категории, обновляем выписку, операцию и категорию */
            if ($state.previous.name.match(/.extract.category/)) {
                WebWorker.invoke('getExtract', $scope.product, $scope.extractDateFrom, $scope.extractDateTo).then(
                    productSrv.resultGetExtract($scope.operation, true)
                );
            } else

            /* если попали из выписки по продукту, обновляем выписку и операцию */
            if ($state.previous.name.match(/.extract/)) {
                WebWorker.invoke('getExtract', $scope.product, $scope.extractDateFrom, $scope.extractDateTo).then(
                    productSrv.resultGetExtract($scope.operation)
                );
            } else

            /* если попали из списка операций продукта, то обновляем список операций продукта */
            if ($state.previous.name.match(/card|loan|account/)) {
                productSrv.getLastOperationsForProduct(productSrv.getCurrentProduct()).then(
                    productSrv.resultGetLastOperationsForProduct(productSrv.getCurrentProduct(), $scope.operation)
                );
            }
        };
}]);

app.controller('SendToEmailPaymentReceiptCtrl', ['$scope', '$state', 'commonSrv', 'productSrv', 'WebWorker',
    function($scope, $state, commonSrv, productSrv, WebWorker) {

        $scope.sendEmailData = { email: $scope.retailClient.email };
        $scope.operation = $state.params.operation;

        function processingResults(data) {
            switch (data.cmdInfo) {
                case 'sendToEmailPaymentReceipt':
                    if (data.result.data) {
                        alert(data.result.data);
                    }
                    break;
            }
            $scope.$apply();
        }
        WebWorker.setFunction(processingResults);

        $scope.sendEmail = function(email) {
            if (email) {
                WebWorker.postMessage('sendToEmailPaymentReceipt', 'sendToEmailPaymentReceipt', [$scope.operation.retailDocId, email]);
            } else {
                alert('Введите адрес');
            }
        }
    }
]);