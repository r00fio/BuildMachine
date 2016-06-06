/*
 * Сервис контроля расходов
 */
(function () {
    var app = angular.module('app');

    app.factory('costsSrv', ['$rootScope', '$filter', 'productSrv', 'WebWorker',
    function($rootScope, $filter, productSrv, WebWorker) {

        /**
         * Перерасчёт просматриваемого месяца при изменении бюджета
         * @param monthIdx  месяц
         * @returns {promise|*}
         */
        var recalculateCostsForMonth = function(monthIdx) {
            var costParams = {};
            costParams.refresh = true;
            costParams.fromHomePage = false;
            costParams.month = monthIdx;
            return WebWorker.invoke('getControllingCosts', costParams);
        };

        /**
         * Результат перерасчёта месяца - обновление текущей категории
         * @param result
         */
        var resultRecalculateCostsForMonth = function(result) {
            for (var i = 0; i < result.data.costs.categoryList.length; i++) {
                if (productSrv.getCurrentCategory().strId == result.data.costs.categoryList[i].strId) {
                    $rootScope.clone(productSrv.getCurrentCategory(), result.data.costs.categoryList[i]);
                    break;
                }
            }
        };

        /**
         * Применение фильтра в контроле расходов
         * @param costsFilterCtrl   объект в скоупе, хранящий данные
         * @returns {promise|*}
         */
        var applyCostsFilter = function(costsFilterCtrl) {
            var costParams = {};
            costParams.refresh = true;
            costParams.fromHomePage = false;
            costParams.fromDate = $filter('defaultDate')(costsFilterCtrl.fromDate);
            costParams.toDate = $filter('defaultDate')(costsFilterCtrl.toDate);

            /* отправлять надо все продукты, т.к. обновляются в бд */
            costParams.productList = JSON.stringify(costsFilterCtrl.productList);
            return WebWorker.invoke('getControllingCosts', costParams);
        };

        /**
         * Результат запроса контроля расходов в фильтре
         * @param costsFilterCtrl   объект в скоупе, хранящий данные
         * @returns {Function}
         */
        var resultApplyCostsFilter = function(result, costsFilterCtrl) {
            costsFilterCtrl.extract = result.data.extract;
            var donutData = [];
            for (var i = 0; i < costsFilterCtrl.extract.categoryList.length; i++) {
                var value = parseInt(costsFilterCtrl.extract.categoryList[i].percent.toFixed(0));
                if (value != 0) {
                    donutData.push({
                        value: value,
                        text: value + '%',
                        color: costsFilterCtrl.extract.categoryList[i].color,
                        domId: '#expense-category-' + costsFilterCtrl.extract.categoryList[i].strId
                    });
                }
            }
            costsFilterCtrl.donutData.data = donutData;
            if (costsFilterCtrl.donutData.render) {
                costsFilterCtrl.donutData.render();
            }
        };

        return {
            recalculateCostsForMonth: recalculateCostsForMonth,
            resultRecalculateCostsForMonth: resultRecalculateCostsForMonth,
            applyCostsFilter: applyCostsFilter,
            resultApplyCostsFilter: resultApplyCostsFilter
        };
    }]);
}());