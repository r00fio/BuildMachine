/*
 * Сервис для кредитов
 */
(function () {
    var app = angular.module('app');

    app.factory('loanSrv', ['$http', '$templateCache', '$filter',
        function($http, $templateCache, $filter) {

        var loanList = null;
        var loan = null;

        var getLoanList = function() {
            return loanList;
        };

        /**
         * Получение отсортированного списка кредитов: открытые избранные, открытые неизбранные, закрытые
         * @returns {*}
         */
        var getSortedLoanList = function() {
            var openFavouriteLoans = $filter('objectArrayFilter')(loanList, [{isFavourite: true, isClosed: false}]);
            var openNotFavouriteLoans = $filter('objectArrayFilter')(loanList, [{isFavourite: false, isClosed: false}]);
            var closedLoans = $filter('objectArrayFilter')(loanList, [{isClosed: true}]);
            loanList = openFavouriteLoans.concat(openNotFavouriteLoans).concat(closedLoans);
            delete(openFavouriteLoans);
            delete(openNotFavouriteLoans);
            delete(closedLoans);
            return loanList;
        };

        var setLoanList = function(list){
            loanList = list || [];
        };

        var getLoanById = function(loanId){
            if (loanList) {
                for(var i = 0; i < loanList.length; i++) {
                    if (loanList[i].id == loanId) {
                        return loanList[i];
                    }
                }
            }
            return null;
        };

        var getLoanIdxById = function(loanId){
            if (loanList) {
                for(var i = 0; i < loanList.length; i++) {
                    if (loanList[i].id == loanId) {
                        return i;
                    }
                }
            }
            return -1;
        };

        var reset = function() {
            loanList = null;
        };

        return {
            getLoanList: getLoanList,
            getSortedLoanList: getSortedLoanList,
            setLoanList: setLoanList,
            getLoanById: getLoanById,
            getLoanIdxById: getLoanIdxById,
            reset: reset
        };
    }]);

}());