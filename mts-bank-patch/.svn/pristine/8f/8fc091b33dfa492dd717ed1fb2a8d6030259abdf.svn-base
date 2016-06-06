/**
 * Created by shubnik on 26.06.2015.
 */

var app = angular.module('app');

app.controller('CodifierSelectCtrl', ['$scope', '$state', '$window', 'selectCodifierService',
    function ($scope, $state, $window, selectCodifierService) {

        this.title = selectCodifierService.getTitle();
        this.searchTitle = selectCodifierService.getSearchTitle();

        this.codifiersList = selectCodifierService.getCodifiers();

        this.onSelectCodifier = function(codifier) {
            selectCodifierService.setSelectedCodifier(codifier);
            $window.history.back();
        };

    }
]);