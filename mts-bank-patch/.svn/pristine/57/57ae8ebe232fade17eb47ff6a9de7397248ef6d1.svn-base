/*
 * Сервис для счетов
 */
(function () {
    var app = angular.module('app');

    app.factory('accountSrv', [function() {

        var _account = null;
        var _accountList = null;

        var _accountListForSelectProduct = null;
        var accountProductList = null;

        var setAccountList = function(list) {
            _accountList = list || [];
        };

        var getAccountList = function() {
            return _accountList;
        };

        var setCurrentAccount = function(account) {
            _account = account;
        };

        var getAccountById = function(accountId) {
            for (var i = 0; i < _accountList.length; i++) {
                if (accountId == _accountList[i].id) {
                    _account = _accountList[i];
                    return _account;
                }
            }
            return null;
        };

        var getAccount = function() {
            return _account;
        };

        var reset = function() {
            _accountList = null;
            _accountListForSelectProduct = null;
            accountProductList = null;
        };

        return {
            setAccountList: setAccountList,
            getAccountList: getAccountList,
            setCurrentAccount: setCurrentAccount,
            getAccountById: getAccountById,
            getAccount: getAccount,
            reset: reset
        };
    }]);

}());