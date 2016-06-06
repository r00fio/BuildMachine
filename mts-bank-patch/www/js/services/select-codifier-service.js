/**
 * Created by shubnik on 26.06.2015.
 */

(function () {
    var app = angular.module('app');

    app.factory('selectCodifierService', [function () {

        var _title = "Выберите значение";
        var _searchTitle = "Поиск";
        var _codifierStrId = "";
        var _codifiers = [];
        var _selectedCodifier = null;

        var setCodifiers = function(codifiers) {
            _codifiers = codifiers;
        };

        var getCodifiers = function() {
            return _codifiers
        };

        var setSelectedCodifier = function(selectedCodifier) {
            _selectedCodifier = selectedCodifier;
        };

        var getSelectedCodifier = function() {
            return _selectedCodifier;
        };

        var setTitle  = function(title) {
            _title = title;
        };

        var getTitle  = function() {
            return _title;
        };

        var setCodifierStrId = function(codifierStrId) {
            _codifierStrId = codifierStrId;
        };

        var getCodifierStrId = function() {
            return _codifierStrId;
        };

        var resetServiceData = function() {
            _title = "Выберите значение";
            _searchTitle = "Поиск";
            _codifierStrId = "";
            _codifiers = [];
            _selectedCodifier = null;
        };

        var setSearchTitle = function(searchTitle) {
            _searchTitle = searchTitle;
        };

        var getSearchTitle = function() {
            return _searchTitle;
        };

        return {
            setCodifiers: setCodifiers,
            getCodifiers: getCodifiers,
            setSelectedCodifier: setSelectedCodifier,
            getSelectedCodifier: getSelectedCodifier,
            setTitle: setTitle,
            getTitle: getTitle,
            setCodifierStrId: setCodifierStrId,
            getCodifierStrId: getCodifierStrId,
            resetServiceData: resetServiceData,
            setSearchTitle: setSearchTitle,
            getSearchTitle: getSearchTitle
        }

    }]);
})();