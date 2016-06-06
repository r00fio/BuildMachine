/**
 * Created by Varzinov on 07.09.2015.
 */
(function () {
    var module = angular.module('app');

    module.controller('BonusesCtrl', ['$scope', 'WebWorker', function($scope, WebWorker) {

        var getBonusInfo = function(){
            WebWorker.invoke('getBonusInfo').then(function(result){

                $scope.availableBonuses = result.data && result.data.availableBonuses || null;
                $scope.interestingBonuses = result.data && result.data.interestingBonuses || null;
                $scope.myBonuses = result.data && result.data.myBonuses || null;
                $scope.$broadcast('scroll.refreshComplete');

            });
        };

        getBonusInfo();

        $scope.doRefresh = function(){
            getBonusInfo();
        };
    }]);

    module.controller('BonusesPartnersCtrl', ['$scope', 'WebWorker', function($scope, WebWorker) {

        var getPartnersInfo = function(){
            WebWorker.invoke('getPartnersInfo').then(function(result){

                $scope.bankPartners = result.data || null;
                $scope.$broadcast('scroll.refreshComplete');

            });
        };

        getPartnersInfo();

        $scope.doRefresh = function(){
            getPartnersInfo();
        };
    }]);

    module.controller('BonusesPromosCtrl', ['$scope', 'WebWorker', function($scope, WebWorker) {

        var getPromosInfo = function(){
            WebWorker.invoke('getPromosInfo').then(function(result){

                $scope.currentPromos = result.data && result.data.currentPromos || null;
                $scope.pastPromos = result.data && result.data.pastPromos || null;
                $scope.$broadcast('scroll.refreshComplete');

            });
        };

        getPromosInfo();

        $scope.doRefresh = function(){
            getPromosInfo();
        };
    }]);

    module.controller('BonusesDetailsCtrl', ['$scope', '$state', '$stateParams', function($scope, $state, $stateParams) {
        $scope.bonus = $stateParams.bonus;
        $scope.isInterestingBonuses = $stateParams.isInterestingBonuses;

        $scope.redirectToConnectOption = function() {
            if ($scope.isInterestingBonuses) {
                $state.go('products', null, {location: 'replace'});
            } else {
                $state.go('addoption', {bonus: $scope.bonus}, {location: 'replace'});
            }
        };
    }]);

    module.controller('PartnerDetailsCtrl', ['$scope', '$stateParams', function($scope, $stateParams) {
        $scope.bankPartner = $stateParams.bankPartner;
    }]);

    module.controller('PromoDetailsCtrl', ['$scope', '$stateParams', function($scope, $stateParams) {
        $scope.promo = $stateParams.promo;
    }]);

}());