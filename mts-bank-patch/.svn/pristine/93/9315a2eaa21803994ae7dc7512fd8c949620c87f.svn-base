
angular.module('app').controller('FavouritesPaymentCtrl', ['$scope', '$state', 'WebWorker', 'paymentSrv',
    function ($scope, $state, WebWorker, paymentSrv) {

        $scope.favoritList = paymentSrv.getFavouritesList();

        var assignFavouritesPayments = function(result) {
            paymentSrv.setFavouritesList(result.data);
            $scope.favoritList = paymentSrv.getFavouritesList();
            if (!$scope.favoritList) {
                $scope.favoritList = [];
            }
            $scope.$broadcast('scroll.refreshComplete');
        };

        if (!$scope.favoritList) {
            WebWorker.invoke('getFavouritesPayments').then(assignFavouritesPayments);
        }

        $scope.redirectToPayment = function (favourite) {
            if (!favourite.isGroup) {
                var params = paymentSrv.getParamsToRedirectFromFavourites(favourite.template, favourite, 'Избранные платежи');
                if (params) {
                    $state.go(params.link, params.linkParams);
                }
            }
        };

        /* Обновление информации при оттягивании страницы. Pull to refresh. */
        $scope.doRefresh = function() {
            WebWorker.invoke('getFavouritesPayments').then(assignFavouritesPayments);
        };
    }
]);
