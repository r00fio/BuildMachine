var DAORetailDepositService = (function() {

    var isArray = function(obj) { return Object.prototype.toString.call(obj) === '[object Array]'; };

    /**
     * Получить выписку по счету вклада за период. Параметры fromDate и toDate должны иметь тип Date
     * @param fromDate - дата начала периода
     * @param toDate - дата конца периода
     * @param uuid - идентификатор счета
     * @returns выписка
     */
    var getAccountExtract = function(fromDate, toDate, uuid) {
        var response = DAO.invokeEntityMethod(
            'system', 'RetailAccount', 'getAccountExtract',
            uuid, fromDate.format('dd.mm.yyyy'), toDate.format('dd.mm.yyyy')
        );
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getDepositList = function() {
        var response = DAO.invokeUserEntityMethod('getAllDeposits');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getDepositsToCompare = function(params){
        var response = DAO.invokeUserEntityMethod('getDepositProductsForSelection', JSON.stringify(params));
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Варианты сроков при подборе вклада
     */
    var depositTerms = null;
    var getDepositTerms = function(forceRefresh){
        if (!depositTerms || forceRefresh) {
            var response = DAO.invokeUserEntityMethod('getDepositTerms');
            if (!response) {
                console.error('xmlResponseToJson при парсинге ответа getDepositTerms возвращает ', response);
                return [];
            }
            if (response.code) {
                console.error('Запрос getDepositTerms выполнен с ошибкой ', response.code, response.msg);
                return [];
            }

            if (response.data) {
                response.data = isArray(response.data) ? response.data : [];
                response.data.push({termStart: null, alias: 'Индивидуальный'});
            }
            return response;
        }
        return DAO.wrapResult(depositTerms);
    };

    /**
     * Получение суммы вклада для перевода при досрочном закрытии
     * @param deposit       закрываемый вклад
     * @returns {null}
     */
    var getExternalInterestAmount = function(deposit) {
        var response = DAO.invokeEntityMethod('system', 'RetailDeposit', 'getExternalInterestAmountInfo', deposit.uuid);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getSourceForInitDeposit = function(currency) {
        var response = DAO.invokeUserEntityMethod('getSourceForInitDeposit', currency);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getAccountForClosingDeposit = function(currency) {
        var response = DAO.invokeUserEntityMethod('getAccountForClosingDeposit', currency);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение ожидаемой суммы вклада на форме открытия вклада
     * @param uuid      депозитного продукта
     * @param params    json параметры: валюта, сумма, срок, начисление процентов (ежемесячно, в конце срока)
     * @returns {*}
     */
    var getFinalAmount = function(uuid, params) {
        return DAO.invokeEntityMethod('document', 'DepositProduct', 'getFinalAmount', uuid, params);
    };

    var sendOpenDepositRequest = function(depositId, depositAmount,
        depositTerm, srcProductUuid, accForInterestsUUID, accForClosingUuid, branchUuid){

        return DAO.invokeUserEntityMethod(
            'sendOpenDepositRequest',
            depositId, depositAmount, depositTerm,
            srcProductUuid, accForInterestsUUID, accForClosingUuid,
            branchUuid
        );
    };

    /**
     *
     * @param deposit
     * @param account
     * @returns {*}
     */
    var getDepositRatesTable = function(deposit, account) {
        var depositModel = {};
        depositModel.businessProduct = deposit.businessProduct;
        depositModel.period = deposit.period;
        var accountModel = {};
        accountModel.availableBalance = account.availableBalance;
        accountModel.interestRate = account.interestRate;
        accountModel.currency = account.currency;
        var response = DAO.invokeEntityMethod('system', 'RetailDeposit', 'getDepositRatesTable', deposit.uuid,
                JSON.stringify(depositModel), JSON.stringify(accountModel));
        if (response.data) {
            response.data = JSON.parse(response.data);
            for (var i = 0; i < response.data.length; i++) {
                for (var j = 0; j < response.data[i].length; j++) {
                    response.data[i][j] = JSON.parse(response.data[i][j]);
                }
            }
        }
        return response;
    };

    return {
        getDepositList: getDepositList,
        getAccountExtract: getAccountExtract,
        getDepositsToCompare: getDepositsToCompare,
        getDepositTerms: getDepositTerms,
        getExternalInterestAmount: getExternalInterestAmount,
        getSourceForInitDeposit: getSourceForInitDeposit,
        getAccountForClosingDeposit: getAccountForClosingDeposit,
        getFinalAmount: getFinalAmount,
        sendOpenDepositRequest: sendOpenDepositRequest,
        getDepositRatesTable: getDepositRatesTable
    };
})();