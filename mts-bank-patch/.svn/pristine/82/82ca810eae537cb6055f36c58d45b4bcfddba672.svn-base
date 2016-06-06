/**
 * Контроллеры комфортного баланса
 */
var app = angular.module('app');

/**
 * Главная страница контроля расходов с разбивкой по месяцам
 */
app.controller('ControllingCostsCtrl', ['$scope', '$state', '$ionicScrollDelegate', 'sys', 'costControll', 'productSrv', 'WebWorker', '$timeout', function($scope, $state, $ionicScrollDelegate, sys, costControll, productSrv, WebWorker, $timeout) {

    costControll.markAsSeen();

    var monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    /* Массив месяцев за год назад, включая текущий месяц */
    $scope.monthsData = [];
    /* Массив промисов запросов по получению информации за месяц, для асинхронной подгрузки в настройках бюджета */
    var promises = [];

    $scope.currentMonthIdx = new Date().getMonth();
    $scope.selectedMonthIdx = $scope.currentMonthIdx;

    function createMonthData(monthIndex) {
        return {
            idx: monthIndex,
            name: monthNames[monthIndex],
            donut: {
                rendered: false
            }
        };
    }

    function getMonthData(monthIndex) {
        return $scope.monthsData[monthIndex];
    }

    function setMonthData(monthIndex) {
        $scope.monthsData[monthIndex] = createMonthData(monthIndex);
    }

    function renderMonthData(monthData) {
        if (monthData.donut.render) {
            monthData.donut.render();
        }
    }

    for (var i = 0; i < 12; i++) {
        var nextMonthIdx = ($scope.selectedMonthIdx + i) % 12;
        setMonthData(nextMonthIdx);
    }

    var isBackFromInnerState = $state.current.monthIdx;
    if (!(typeof isBackFromInnerState == 'undefined')) {
        $scope.selectedMonthIdx = $state.current.monthIdx;
    }
    $scope.selectedMonthData = $scope.monthsData[$scope.selectedMonthIdx];

    /**
     * Получение позиции для отображения по индексу в массиве месяцев.
     *
     * monthPosition = (monthIdx + 11 + currentMonthIdx) % 12
     *
     * @param monthIdx индекс в массиве месяцев.
     * @returns {number} номер позиции для отображения.
     */
    function getMonthPosition(monthIdx) {
        return (monthIdx + 11 - $scope.currentMonthIdx) % 12;
    }

    /**
     * Получение индекса месяца по позиции отображения.
     * "Обратная" к getMonthPosition(monthIdx).
     *
     * monthIndex = ((monthPosition - 11 + currentMonthIdx) + 12) % 12;
     * equivalents to:
     * monthIndex = (monthPosition + 1 + currentMonthIdx) % 12;
     *
     * @param monthPosition позиция отображения.
     * @returns {number} индекс в массиве месяцев.
     */
    function getMonthIndex(monthPosition) {
        return (monthPosition + 1 + $scope.currentMonthIdx) % 12;
    }

    $timeout(function() {
        var fw7App = sys.getFramework7App();
        var monthSwiper = fw7App.swiper('.month-swiper', {
            slidesPerView: 3,
            slideToClickedSlide: true,
            initialSlide: getMonthPosition($scope.selectedMonthIdx),
            centeredSlides: true,
            threshold: 10
        });
        var donutSwiper = fw7App.swiper('.donut-swiper', {
            slidesPerView: 3,
            slideToClickedSlide: true,
            centeredSlides: true,
            threshold: 10,
            direction: 'horizontal',
            control: monthSwiper,
            initialSlide: getMonthPosition($scope.selectedMonthIdx),
            onSlideChangeEnd: function(swiper) {

                $scope.selectedMonthIdx = getMonthIndex(swiper.activeIndex);

                var monthData = getMonthData($scope.selectedMonthIdx);
                $scope.selectedMonthData = monthData;
                $ionicScrollDelegate.resize();

                if (!$scope.selectedMonthData.donut.data) {
                    loadCostsForMonth($scope.selectedMonthIdx, false);
                } else {
                    if (!$scope.selectedMonthData.donut.rendered) {
                        renderMonthData($scope.selectedMonthData);
                    }
                }
                $scope.$applyAsync();
            }
        });
        monthSwiper.params.control = donutSwiper;
    });

    function createDonutData(costs) {
        var donutData = [];
        for (var i = 0; i < costs.categoryList.length; i++) {
            var value = parseInt(costs.categoryList[i].percent.toFixed(0));
            if (value != 0) {
                donutData.push({
                    value: value,
                    text: value + '%',
                    color: costs.categoryList[i].color,
                    domId: '#expense-category-' + costs.categoryList[i].strId
                });
            }
        }
        return donutData;
    }

    var loadCostsForMonth = function(monthIdx, refresh) {
        var costParams = {};
        costParams.refresh = refresh;
        costParams.fromHomePage = false;
        costParams.month = monthIdx;
        var promise = WebWorker.invoke('getControllingCosts', costParams);
        promises[monthIdx] = promise;
        promise.then(
            function(result) {
                var costs = result.data.costs;
                costs.isAll = true;
                costs.strId = 'ALL';
                costs.color = sys.getPlatform() === 'ios' ? "#24A7B3" : "#00ACB5";
                costs.name = 'Общий бюджет';
                costs.isActive = true;

                var currentMonthData = getMonthData(monthIdx);

                if (costs.categoryList && costs.categoryList.length) {
                    currentMonthData.costs = costs;
                    currentMonthData.productList = result.data.productList;
                    currentMonthData.donut.data = createDonutData(costs);

                    if (monthIdx == $scope.selectedMonthIdx) {
                        renderMonthData(currentMonthData);
                    }
                }
                if (costs.firstLogonMessage) {
                    $timeout(alert(costs.firstLogonMessage), true);
                }
                $scope.$broadcast('scroll.refreshComplete');
            }
        );
    };

    $scope.onDonutSectorClick = function(event, sectorIndex, sectorData){
        angular.element('.mts-controll-category-highlight').removeClass('mts-controll-category-highlight');
        var selected = angular.element(sectorData.domId).addClass('mts-controll-category-highlight');

        if (selected.length) {
            $ionicScrollDelegate.scrollTo(selected[0].offsetLeft, selected[0].offsetTop, true);
        }
    };

    $scope.showBudgetSetting = function() {
        $timeout(function() {
            $state.current.monthIdx = $scope.selectedMonthData.idx;
            $state.go('settingbudget', {
                monthIdx: $scope.selectedMonthData.idx,
                costs: $scope.selectedMonthData.costs,
                promise: promises[$scope.selectedMonthData.idx]
            });
        });
    };

    $scope.showBudgetFilter = function() {
        $state.current.monthIdx = $scope.selectedMonthData.idx;
        $state.go('controllingcostsfilter', {productList: $scope.selectedMonthData.productList});
    };

    $scope.sortByChronologicalOrder = function(monthData) {
        return getMonthPosition(monthData.idx);
    };

    $scope.doRefresh = function() {
        loadCostsForMonth($scope.selectedMonthIdx, true);
    };

    delete($state.current.monthIdx);
}]);

/**
 * Настройка бюджета конкретной категории
 */
app.controller('CategoryBudgetCtrl', ['$scope', '$state', 'productSrv','costsSrv', 'WebWorker', '$rootScope', function($scope, $state, productSrv, costsSrv, WebWorker, $rootScope) {
    var monthIdx = $state.params.monthIdx;
    $state.current.monthIdx = monthIdx;     // нужен при смене категории операции для запроса нужного месяца для перерасчёта бублика
    $scope.category = productSrv.getCurrentCategory();
    $scope.operationsDisplay = $scope.category.operationList.slice(0, 10);
    $scope.operationState = 'categorybudget.operation';

    $scope.showMoreOperations = function () {
        $scope.operationsDisplay = $scope.category.operationList.slice(0, $scope.operationsDisplay.length + 10);
        $scope.$apply();
    };

    if ($scope.category) {
        var stateName = $state.current.name;
        var oldColor = $rootScope.statusBarColor;
        $rootScope.statusBarColor = $scope.category.color;
        $scope.$on('$destroy', function() {
            $rootScope.statusBarColor = oldColor;
        });
        $scope.$on('$stateChangeStart', function(event, toState) {
            $rootScope.statusBarColor = (toState.name == stateName) ? $scope.category.color : oldColor;
        });
    }

    $scope.toggleBudget = function() {
        $scope.category.budget = 0;
        WebWorker.invoke('saveBudgetCategory', $scope.category);

        /* перерасчёт текущего месяца */
        costsSrv.recalculateCostsForMonth(monthIdx).then(
            function(result) {
                costsSrv.resultRecalculateCostsForMonth(result)
            }
        );
    };

    $scope.saveBudget = function() {
        if (!$scope.category.budget) {
            $scope.category.budget = 0;
        }
        WebWorker.invoke('saveBudgetCategory', $scope.category);

        /* перерасчёт текущего месяца */
        costsSrv.recalculateCostsForMonth(monthIdx).then(
            function(result) {
                costsSrv.resultRecalculateCostsForMonth(result)
            }
        );
    };
}]);

/**
 * Страница задания фильтра для контроля расходов
 */
app.controller('ControllingCostsFilterCtrl', ['$scope', '$state', '$filter', '$timeout', '$ionicScrollDelegate', 'sys', 'productSrv', 'costsSrv',
    function($scope, $state, $filter, $timeout, $ionicScrollDelegate, sys, productSrv, costsSrv) {
        $scope.costsFilterCtrl.productList = $state.params.productList;
        var df = new Date(), dt = new Date();
        df.setDate(1);
        $scope.costsFilterCtrl.fromDate = df;
        $scope.costsFilterCtrl.toDate = dt;
        $scope.costsFilterCtrl.donutData = {};

        $scope.onDonutSectorClick = function(event, sectorIndex, sectorData){
            angular.element('.mts-controll-category-highlight').removeClass('mts-controll-category-highlight');
            var selectedEl = angular.element(sectorData.domId).addClass('mts-controll-category-highlight');

            if (selectedEl.length) {
                $ionicScrollDelegate.scrollTo(selectedEl[0].offsetLeft, selectedEl[0].offsetTop, true);
            }
        };

        /* Правая верхняя кнопка меню: снова показать фильтр вместо результатов фильтрации */
        $scope.showFilter = function() {
            $scope.goBack();
        };

        /* Провал в категорию */
        $scope.showCategory = function(category) {
            productSrv.setCurrentExtract($scope.costsFilterCtrl.extract);
            productSrv.setCurrentCategory(category);
            $state.go('controllingcostsfilter.category');
        };

        /* Применить фильтр */
        $scope.applyFilter = function() {
            costsSrv.applyCostsFilter($scope.costsFilterCtrl).then(
                function(result) {
                    costsSrv.resultApplyCostsFilter(result, $scope.costsFilterCtrl)
                }
            );
            $scope.costsFilterCtrl.extract = undefined;
            $state.go('controllingcostsfilter.resultfilter');
        };

    }]);

/**
 * Страница настройки бюджетов всех категорий
 */
app.controller('SettingBudgetCtrl', ['$scope', '$state', '$filter', 'costsSrv', 'WebWorker', '$timeout', function($scope, $state, $filter, costsSrv, WebWorker, $timeout) {
    var monthIdx = $state.params.monthIdx;
    $scope.costs = $state.params.costs;

    var filterCosts = function() {
        $scope.categoryList = $filter('orderBy')($scope.costs.categoryList, ['-isView','name']);
    };

    if (angular.isUndefined($scope.costs.categoryList)) {
        $state.params.promise.then(function(result) {
            if (result && result.code == 0) {
                $scope.costs = result.data.costs;
                filterCosts();
            } else {
                $scope.categoryList = [];
            }

        }, function(error) {
            $scope.categoryList = [];
        });
    } else {
        filterCosts();
    }



    $scope.changeBudget = function() {
        $scope.costs.budget = 0;
        for (var i = 0; i < $scope.categoryList.length; i++) {
            $scope.costs.budget += angular.isUndefined($scope.categoryList[i].budget) ? 0 : $scope.categoryList[i].budget;
        }
        $scope.costs.budget = parseFloat($scope.costs.budget.toFixed(2));   // иногда число после запятой зашкаливает
    };

    /* Задержка нужна для iPhone 5 */
    $timeout(function() {
        $scope.cancelSettings = function() {
            $scope.goBack();
        };
    }, 800);

    $scope.saveSettings = function() {
        WebWorker.invoke('saveBudgetCategories', $scope.costs);
        $scope.goBack();
    };
}]);