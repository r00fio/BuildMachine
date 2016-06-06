/*
 * Сервис для вкладов
 */
(function () {
    var app = angular.module('app');

    app.factory('depositSrv', ['commonSrv', '$rootScope', function(commonSrv, $rootScope) {
        var deposit = null;                     // текущий вклад
        var account = null;                     // текущий просматриваемый счет
        var depositList = null;                 // список всех вкладов с вложенными счетами accountList
        var accountList = null;                 // счета всех вкладов с вложенным вкладом deposit

        var getDepositList = function() {
            return depositList;
        };

        var setDepositList = function(list) {
            depositList = list || [];
            accountList = [];
            for (var i = 0; i < depositList.length; i++) {
                deposit = depositList[i];
                var accounts = [];
                for (var currency in deposit.accountMBMap) {
                    accounts.push(deposit.accountMBMap[currency]);
                }
                for (var j = 0; j < accounts.length; j++) {
                    accounts[j].deposit = deposit;
                    accountList.push(accounts[j]);
                }
                deposit.accountList = accounts;
                delete(deposit.accountMBMap);
            }
        };

        var updateAccountList = function(list){
            if (!angular.isArray(list)) {
                list = [list];
            }

            for (var i = 0; i < list.length; i++) {
                if (!angular.isObject(list[i])) {
                    continue;
                }

                var isAccountInTheList = false;
                for (var j = 0; j < accountList.length; j++) {
                    if (accountList[j].id == list[i].id) {
                        isAccountInTheList = true;
                        angular.extend(accountList[j], list[i]);
                        break;
                    }
                }
                if (!isAccountInTheList) {
                    accountList.push(list[i]);
                }
            }
        };

        var linkAccountsToDeposit = function(deposit) {
            if (angular.isObject(deposit.accountMBMap)) {
                var accounts = [];
                var i = 0;
                for (var currency in deposit.accountMBMap) {
                    accounts.push(deposit.accountMBMap[currency]);
                    accounts[i].deposit = deposit;
                    i++;
                }
                deposit.accountList = accounts;
                delete(deposit.accountMBMap);
                updateAccountList(deposit.accountList);
            }
        };

        var updateDepositList = function(list){
            if (!angular.isArray(list)) {
                list = [list];
            }

            for (var i = 0; i < list.length; i++) {
                if (!angular.isObject(list[i])) {
                    continue;
                }

                var isDepositInTheList = false;
                for (var j = 0; j < depositList.length; j++) {
                    if (depositList[j].id == list[i].id) {
                        isDepositInTheList = true;
                        angular.extend(depositList[j], list[i]);
                        linkAccountsToDeposit(depositList[j]);
                        break;
                    }
                }
                if (!isDepositInTheList) {
                    depositList.push(list[i]);
                    linkAccountsToDeposit(list[i]);
                }
            }
        };

        var getDeposit = function() {
            return deposit;
        };

        var getAccountList = function() {
            return accountList;
        };

        var getDepositById = function(depositId) {
            for (var i = 0; depositList && i < depositList.length; i++) {
                if (depositList[i].id == depositId) {
                    return deposit = depositList[i];
                }
            }
            return deposit = null;
        };

        var getAccountById = function(accountId) {
            for (var i = 0; i < accountList.length; i++) {
                if (accountId == accountList[i].id) {
                    return accountList[i];
                }
            }
            return null;
        };

        var getDepositByAccountId = function(accountId) {
            for (var i = 0; i < depositList.length; i++) {
                if (accountId == depositList[i].account.id) {
                    deposit = depositList[i];
                    return deposit;
                }
            }
            return null;
        };

        // Выбор счета
        var setCurrentAccount = function(accountId) {
            for (var i = 0; i < accountList.length; i++) {
                if (accountId == accountList[i].id) {
                    account = accountList[i];
                    break;
                }
            }
        };

        // Текущий просматриваемый счет вклада
        var getCurrentAccount = function() {
            return account;
        };

        var reset = function() {
            depositList = null;
            accountList = null;
        };

        return {
            getDepositList: getDepositList,
            setDepositList: setDepositList,
            updateAccountList: updateAccountList,
            updateDepositList: updateDepositList,
            getDeposit: getDeposit,
            getAccountList: getAccountList,
            getAccountById: getAccountById,
            getDepositById: getDepositById,
            getDepositByAccountId: getDepositByAccountId,
            setCurrentAccount: setCurrentAccount,
            getCurrentAccount: getCurrentAccount,
            reset: reset
        };
    }]);

    app.factory('openDepositSrv', ['commonSrv', function(commonSrv) {
        var depositDetails = null;      // детальная информация о вкладе
        var depositCompareList = null;  // список сравниваемых вкладов

        // такая сложная "фигня" для того, чтобы параметры на странице включения/выключения выводились отсортированными
        // как заданы в массиве, а на странице сравнения из этого массива получается объект с полями strId
        // для определения необходимости вывода определенного параметра в сравнительной таблице
        var depositCompareParams = [];
        depositCompareParams.push({strId: "currency",        name: "Валюта",                        value: true});
        depositCompareParams.push({strId: "terms",           name: "Срок размещения",               value: true});
        depositCompareParams.push({strId: "amounts",         name: "Сумма вклада",                  value: true});
        depositCompareParams.push({strId: "refill",          name: "Возможность пополнения",        value: true});
        depositCompareParams.push({strId: "partialWithdraw", name: "Возможность частичного снятия", value: true});
        depositCompareParams.push({strId: "interestPayOut",  name: "Выплата процентов",             value: true});
        depositCompareParams.push({strId: "extension",       name: "Пролонгация",                   value: true});
        depositCompareParams.push({strId: "earlyCancel",     name: "Досрочное расторжение",         value: true});
        depositCompareParams.push({strId: "addInfo",         name: "Доп. информация",               value: true});

        var getAmountAndCurrencyInWords = function(amount, currency){
            var result = '';
            if ((amount || amount == 0) && currency) {
                var lastDigit = amount % 10;
                switch (currency.value) {
                    case 'RUB':
                        result = amount + ' рубл' + (lastDigit > 1 && lastDigit < 5 ? 'я' : lastDigit == 1 ? 'ь' : 'ей');
                        break;
                    case 'USD':
                        result = amount + ' доллар' + (lastDigit > 1 && lastDigit < 5 ? 'а' : lastDigit == 1 ? '' : 'ов');
                        break;
                    case 'EUR':
                        result = amount + ' евро';
                        break;
                }
            }
            return result;
        };

        var buildDepositParamsStr = function(params) {
            var resultStr = null;
            if (angular.isObject(params)) {
                resultStr = getAmountAndCurrencyInWords(params.amount, params.currency);
                if (params.termPeriod && params.termPeriod.termStart) {
                    resultStr += (resultStr ? ' ' : '');
                    resultStr += 'на ' + params.termPeriod.alias;
                } else if (params.term) {
                    resultStr += (resultStr ? ' ' : '');
                    resultStr += 'на ' + params.term + commonSrv.getDaysInDecline(params.term);
                }
                if (params.refill) {
                    var refillInWords = getAmountAndCurrencyInWords(params.refillAmount, params.currency);
                    resultStr += (resultStr ? '. ' : '');
                    if (refillInWords) {
                        resultStr += 'Пополнение в месяц ' + refillInWords;
                    } else {
                        resultStr += 'С возможностью пополнения';
                    }
                }
                if (params.withdrawal) {
                    resultStr += (resultStr ? '. ' : '');
                    resultStr += 'Частичное снятие';
                }
                if (params.capitalization != null) {
                    resultStr += (resultStr ? '. ' : '');
                    resultStr += params.capitalization.dispname;
                }
                if (params.interestPayOut != null) {
                    resultStr += (resultStr ? '. ' : '');
                    resultStr += params.interestPayOut.dispname;
                }
                if (params.extension) {
                    resultStr += (resultStr ? '. ' : '');
                    resultStr += 'Пролонгируемый';
                }
            }
            return resultStr;
        };

        var setDepositDetails = function(details) {
            depositDetails = details;
        };

        var getDepositDetails = function() {
            return depositDetails;
        };

        var setDepositCompareList = function(compareList) {
            depositCompareList = compareList;
        };

        var getDepositCompareList = function() {
            return depositCompareList;
        };

        var setDepositCompareParams = function(compareParams) {
            depositCompareParams = compareParams;
        };

        var getDepositCompareParams = function() {
            return depositCompareParams;
        };

        var createCurrencyObjects = function(isoString) {
            if (angular.isArray(isoString)) {
                var result = [];
                for (var i = 0; i < isoString.length; i++) {
                    result.push(createCurrencyObjects(isoString[i]));
                }
                return result;
            } else {
                if (/^rub$/i.test(isoString)) {
                    return {value:'RUB', dispname:'Рубли'};
                } else if (/^usd$/i.test(isoString)) {
                    return {value:'USD', dispname:'Доллары'};
                } else if (/^eur$/i.test(isoString)) {
                    return {value:'EUR', dispname:'Евро'};
                } else {
                    return {value:isoString.toString(), dispname:isoString.toString()};
                }
            }
        };

        var getInterestPayOutList = function(){
            return [
                {value: 'MONTHLY', dispname: 'Ежемесячно'},
                {value: 'TERMEND', dispname: 'В конце срока'}
            ];
        };

        var getIntCreditSepList = function(){
            return [
                {value: true, dispname: 'Переводить на карту/счет'},
                {value: false, dispname: 'Оставлять на вкладе'}
            ];
        };

        var getIntCreditSepDispName = function(value){
            var list = getIntCreditSepList();
            for (var i = 0; i < list.length; i++) {
                if (list[i].value === value) {
                    return list[i].dispname;
                }
            }
            return null;
        };

        return {
            buildDepositParamsStr: buildDepositParamsStr,
            setDepositDetails: setDepositDetails,
            getDepositDetails: getDepositDetails,
            setDepositCompareList: setDepositCompareList,
            getDepositCompareList: getDepositCompareList,
            setDepositCompareParams: setDepositCompareParams,
            getDepositCompareParams: getDepositCompareParams,
            createCurrencyObjects: createCurrencyObjects,
            getInterestPayOutList: getInterestPayOutList,
            getIntCreditSepList: getIntCreditSepList,
            getIntCreditSepDispName: getIntCreditSepDispName
        };
    }]);
}());