var app = angular.module('app');

/**
 * Главная страница платежей и переводов.
 */
app.controller('PaymentsCtrl', ['$scope', '$state', 'WebWorker', 'paymentSrv',
    function ($scope, $state, WebWorker, paymentSrv) {

        $scope.hideCategoryWaiterPayments = true;

        $scope.categoriesLimit = 6;
        $scope.operationState = 'homeoperation';

        $scope.favoritList = paymentSrv.getFavouritesList();
        $scope.globalSearchText = {};

        // Список переводов
        $scope.transfersArr = paymentSrv.getTransfers();

        // Список категорий
        $scope.categoriesArr = paymentSrv.getCategoriesForPaymentArr();
        $scope.showMoreButton = $scope.categoriesArr && $scope.categoriesArr.length > $scope.categoriesLimit;

        $scope.getElementByField = function(elements, value, field) {
            if (elements && value) {
                for (var i = 0; i < elements.length; ++i) {
                    if (elements[i][field] == value) {
                        return elements[i];
                    }
                }
            }
            return null;
        };

        function processingResults(data) {
            var matchResult = data.cmdInfo ? data.cmdInfo.match(/^([^\(]*)\(([^\)]*)\).*$/) : null;
            var command = matchResult ? matchResult[1] : data.cmdInfo;
            var params = $scope.$eval(matchResult ? matchResult[2] : null);
            params = angular.isObject(params) ? params : {};

            switch (command) {
                case 'setPaymentRegion':
                    break;
                case 'getCategoriesForPayment':
                    paymentSrv.setCategoriesForPaymentArr(data.result.data);
                    $scope.categoriesArr = paymentSrv.getCategoriesForPaymentArr();
                    $scope.showMoreButton = $scope.categoriesArr && $scope.categoriesArr.length > $scope.categoriesLimit;
                    break;

                case 'getCategoriesForPaymentById':
                    $scope.categoriesArr = data.result.data;
                    $scope.hideCategoryWaiterPayments = true;
                    $state.go('paycategories', {title: params.catName, categories: data.result.data});
                    break;

                case 'getSearchResultForPayment':
                    $scope.searchResults = data.result.data;
                    if ($scope.searchResults) {
                        for (var searchResult in $scope.searchResults) {
                            if ($scope.searchResults[searchResult].name == 'TEMPLATE') {
                                for (var listId in $scope.searchResults[searchResult].list) {
                                    $scope.searchResults[searchResult].list[listId] = $scope.getElementByField($scope.favoritList, $scope.searchResults[searchResult].list[listId], 'templateId');
                                }
                            }
                        }
                    }
                    
                    break;
            }
            $scope.$apply();
        }

        WebWorker.setFunction(processingResults);

        var assignFavouritesPayments = function(result) {
            paymentSrv.setFavouritesList(result.data);
            $scope.favoritList = paymentSrv.getFavouritesList();
            if (!$scope.favoritList) {
                $scope.favoritList = [];
            }
        };

        var assignOnlineOperations = function(result) {
            $scope.visibleHistoryOperatins = result.data.length > 5;
            $scope.operationList = result.data.slice(0, 5);
            $scope.$broadcast('scroll.refreshComplete');
        };

        if (!$scope.favoritList) {
            WebWorker.invoke('getFavouritesPayments').then(assignFavouritesPayments);
        }

        paymentSrv.getRegionsForPayment();

        if (!$scope.categoriesArr || $scope.categoriesArr.length == 0) {
            WebWorker.postMessage('getCategoriesForPayment', 'getCategoriesForPayment', []);
        }
        WebWorker.invoke('getOnlineOperations', 'MAIN_PAYMENTS', 6).then(assignOnlineOperations);

        $scope.redirectToSetting = function () {
            $state.go('payments.paymentssettings');
        };

        $scope.onClickShowMoreButton = function () {
            $scope.categoriesLimit = $scope.categoriesArr.length;
            $scope.showMoreButton = false;
        };

        $scope.redirectToSelected = function (category) {
            if (category.type && category.type == 'SERVICE') {
                $scope.hideCategoryWaiterPayments = undefined;
                WebWorker.postMessage("getCategoriesForPayment", "getCategoriesForPaymentById(" + JSON.stringify({catName: category.name}) +  ")", [category.id]);
            } else if (category.link) {
                if (category.linkParams) {
                    $state.go(category.link, category.linkParams);
                } else {
                    $state.go(category.link);
                }
            }
        };

        $scope.redirectToTransfers = function (category) {
            if (category.hasSubCategories) {
                $state.go('paycategories', {title: category.name, categories: category.subCategories});
            } else if (category.link) {
                if (category.linkParams) {
                    $state.go(category.link, category.linkParams);
                } else {
                    $state.go(category.link);
                }
            }
        };

        /* Обновление информации при оттягивании страницы. Pull to refresh. */
        $scope.doRefresh = function() {
            WebWorker.invoke('getFavouritesPayments').then(assignFavouritesPayments);
            paymentSrv.getRegionsForPayment(true);
            WebWorker.postMessage('getCategoriesForPayment', 'getCategoriesForPayment', []);
            WebWorker.invoke('getOnlineOperations', 'MAIN_PAYMENTS', 6).then(assignOnlineOperations);
        };

        $scope.redirectToPayment = function (favourite) {
            if (!favourite.isGroup) {
                var params = paymentSrv.getParamsToRedirectFromFavourites(favourite.template, favourite, 'Избранные платежи');
                if (params) {
                    $state.go(params.link, params.linkParams);
                }
            }
        };

        $scope.$watch('globalSearchText.name', function(newValue) {
            if (newValue && newValue.length > 2) {
                WebWorker.postMessage('getSearchResultForPayment', 'getSearchResultForPayment', [newValue, '0', 'false']);
            }
        });

        $scope.redirectToService = function (category) {
            if (category.type && category.type == 'SERVICE') {
                $scope.hideCategoryWaiterPayments = undefined;
                WebWorker.postMessage("getCategoriesForPayment", "getCategoriesForPaymentById(" + JSON.stringify({catName: category.name}) +  ")", [category.id]);
            } else if (category.link) {
                if (category.linkParams) {
                    $state.go(category.link, category.linkParams);
                } else {
                    $state.go(category.link, null);
                }
            } else if (category.type && category.type == 'PROVIDER') {
                $state.go('servicepay',
                    {tile: category, viewMode: 'EDIT', title: category.name, providerId: category.providerId, serviceId: category.serviceId}
                );
            } else if (category.transferToCard) {
                // Если вдруг параметра $rootScope.globals.transferToCardURL нет, то пытаемся запросить
                $scope.initializeSettings().then(function(){
                    if ($scope.globals.transferToCardURL) {
                        $scope.openUrl($scope.globals.transferToCardURL, '_blank', 'location=yes');
                    } else {
                        // Если с сервера пришла пустая ссылка
                        alert('Сервис временно недоступен', 'Обратите внимание!');
                    }
                });
            }
        };
    }
]);


/**
 * Настройки платежей.
 */
app.controller('PaymentSettingsCtrl', ['$scope', '$ionicModal', 'sys', 'WebWorker', 'paymentSrv', 'commonSrv',
    function ($scope, $ionicModal, sys, WebWorker, paymentSrv, commonSrv) {
        paymentSrv.getRegionsForPayment().then(function(result) {
            $scope.regionsForPaymentArr = result;
            $scope.selectedRegion = $scope.retailClient.payRegion;
        }, function(result) {
            $scope.regionsForPaymentArr = [];
            $scope.selectedRegion = $scope.retailClient.payRegion;
        });

        // <Панель для выбора региона>
        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/payments/select.region.html', function ($ionicModal) {
            $scope.selectRegionPanel = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.onSelectRegionPanel = function () {
            $scope.selectRegionPanel.show()
        };

        $scope.clickRegion = function (region) {
            WebWorker.postMessage('setPaymentRegion', 'setPaymentRegion', [region.id]);

            $scope.selectRegionPanel.hide();
            $scope.selectedRegion = region;
            $scope.retailClient.payRegion = region;
        };
        // </Панель для выбора кодификатора>

    }
]);


/**
 * Список видов платежей
 */
app.controller('PaymentCategoriesCtrl', ['$scope', '$state', '$stateParams', 'WebWorker',
    function ($scope, $state, $stateParams, WebWorker) {
        $scope.form = {};
        $scope.form.hideCategoryWaiterCategories = true;

        if ($scope.globals.dataObjectForSessionTimeout) {
            initBySessionTimeout();
        } else {
            init();
        }

        function initBySessionTimeout() {
            $scope.form = $scope.globals.dataObjectForSessionTimeout;
            delete($scope.globals.dataObjectForSessionTimeout);
        }

        function init() {
            $scope.form.categories = $stateParams.categories ? $stateParams.categories : [];
            $scope.form.categoriesTitle = $stateParams.title ? $stateParams.title : 'Список категорий';
            $scope.saveDataForSessionTimeout($scope.form);
        }

        $scope.redirectToSelected = function(category) {
            if (category.type && category.type == 'SERVICE') {
                $scope.form.hideCategoryWaiterCategories = undefined;
                WebWorker.postMessage("getCategoriesForPayment", "getCategoriesForPaymentById(" + JSON.stringify({catName: category.name}) +  ")", [category.id]);
            } else if (category.link) {
                if (category.linkParams) {
                    $state.go(category.link, category.linkParams, {location: 'replace'});
                } else {
                    $state.go(category.link, null, {location: 'replace'});
                }
            } else if (category.type && category.type == 'PROVIDER') {
                $state.go('servicepay',
                    {tile: category, viewMode: 'EDIT', title: category.name, providerId: category.providerId, serviceId: category.serviceId}
                    , {location: 'replace'});
            } else if (category.transferToCard) {
                // Если вдруг параметра $rootScope.globals.transferToCardURL нет, то пытаемся запросить
                $scope.initializeSettings().then(function(){
                    if ($scope.globals.transferToCardURL) {
                        $scope.openUrl($scope.globals.transferToCardURL, '_blank', 'location=yes');
                    } else {
                        // Если с сервера пришла пустая ссылка
                        alert('Сервис временно недоступен', 'Обратите внимание!');
                    }
                });
            }
        };

        function processingResults(data) {
            var matchResult = data.cmdInfo ? data.cmdInfo.match(/^([^\(]*)\(([^\)]*)\).*$/) : null;
            var command = matchResult ? matchResult[1] : data.cmdInfo;
            var params = $scope.$eval(matchResult ? matchResult[2] : null);
            params = angular.isObject(params) ? params : {};

            switch (command) {
                case 'getCategoriesForPaymentById':
                    $scope.form.hideCategoryWaiterCategories = true;
                    $state.go('paycategories', {title: params.catName, categories: data.result.data}, {location: 'replace'});
                    break;
            }
            $scope.$apply();
        }

        WebWorker.setFunction(processingResults);

    }
]);

/**
 * Список платежей для МГТС
 */
app.controller('MGTSPaymentCtrl', ['$scope', '$state', '$stateParams', 'WebWorker',
    function ($scope, $state, $stateParams, WebWorker) {

        $scope.categories = undefined;

        WebWorker.invoke('getMGTSChargeList').then(
            function(result) {
                if (angular.isArray(result.data)) {
                    $scope.categories = result.data;
                } else {
                    $scope.categories = null;
                    $scope.serviceNotAvailable = true;
                }
            }
        ).catch(
            function(result) {
                $scope.categories = null;
                $scope.externalError = true;
            }
        );

        $scope.redirectToSelected = function (category) {
            $state.go('servicepay', {
                tile: category.tile,
                viewMode: 'EDIT',
                title: 'Начисления',
                providerId: category.tile.providerId,
                serviceId: null,
                personalAccountId: category.id,
                template: {sum: category.sum < 0 ? Math.abs(category.sum) : null}
            }, {location: 'replace'});
        };

    }
]);


app.controller('OperationHistoryCtrl', ['$scope', '$state', '$filter', 'WebWorker', 'utils',
    function ($scope, $state, $filter, WebWorker, utils) {

        $scope.operationType = 'ALL';
        $scope.isLoaded = true;
        var isShowMore = false;

        $scope.dateFrom = new Date();
        $scope.dateFrom.setMonth($scope.dateFrom.getMonth() - 1);
        $scope.dateFrom.setDate($scope.dateFrom.getDate() + 1);
        $scope.dateTo = new Date();

        $scope.hideDatePickers = function () {
            $scope.$broadcast('close-ios-datepickers');
        };

        $scope.hideAndroidDatePickers = function () {
            $scope.$broadcast('close-android-datepickers');
        };

        $scope.setOperationType = function(type) {
            $scope.operationType = type;
        };

        $scope.operationState = 'operationhistory.operation';
        $scope.operationList = undefined;

        function processingResults(data) {
            switch (data.cmdInfo) {
                case 'getOnlineOperations':
                    isShowMore = data.result.data.length > count;
                    $scope.operationList = data.result.data.slice(0, 10);
                    break;
                case 'getOnlineOperationsWithFilter':
                    isShowMore = false;
                    $scope.operationList = data.result.data;
                    break;
                case 'getSourcesListForPayment':
                    $scope.productList = data.result.data;
                    break;
            }
            $scope.$apply();
        }

        WebWorker.setFunction(processingResults);

        /* Запрашиваем каджый раз на 1 операцию больше, для проверки наличия следующих операций для запросов */
        var count = 10;
        WebWorker.postMessage('getOnlineOperations', 'getOnlineOperations', ['HISTORY_PAYMENTS', count + 1, new Date()]);

        WebWorker.postMessage('getSourcesListForPayment', 'getSourcesListForPayment', ['HISTORYFILTER']);

        $scope.showFilter = function() {
            $state.go('operationhistory.filter');
        };

        $scope.applyFilter = function() {
            $scope.operationList = undefined;
            $scope.operationsDisplay = undefined;
            WebWorker.postMessage('getOnlineOperations', 'getOnlineOperationsWithFilter',
                ['FILTER_PAYMENTS', $scope.dateFrom, $scope.dateTo, $scope.operationType, JSON.stringify($scope.productList)]);
            $scope.goBack();
        };

        $scope.showMoreOperations = function() {
            if (isShowMore && $scope.isLoaded) {
                var lastPayment = $scope.operationList[$scope.operationList.length - 1];
                var lastPayDate = lastPayment.paymentCreateDate;

                var startDate;
                if (angular.isDate(new Date(lastPayDate)) && !isNaN(Date.parse(lastPayDate))) {
                    startDate = new Date(lastPayDate);
                } else {
                    startDate = utils.dateParser(lastPayDate);
                }
                $scope.isLoaded = undefined;
                $scope.$applyAsync();
                return WebWorker.invoke('getOnlineOperations', 'HISTORY_PAYMENTS', count + 1, startDate).then(function(result) {
                    $scope.isLoaded = true;
                    isShowMore = result.data.length > count;
                    $scope.operationList = $scope.operationList.concat(result.data.slice(0, 10));
                });
            }
        };
    }
]);