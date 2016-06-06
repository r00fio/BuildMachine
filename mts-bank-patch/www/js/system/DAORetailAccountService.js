/**
 * Created by shubnik on 22.06.2015.
 */
var DAORetailAccountService = (function() {

    var getAccountList = function() {
        var response = DAO.invokeUserEntityMethod('getAllAccounts');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение списка типов счетов при открытии счета
     */
    var getAccountProductList = function() {
        var response = DAO.invokeUserEntityMethod('getAccountProductList');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };
    /**
     * Получение списка продуктов для оплаты открытия нового счета
     */
    var getSourceProductForNewAccount = function(currency) {
        var response = DAO.invokeUserEntityMethod('getSourceProductForNewAccount', currency);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение суммы обслуживания и ставки для открываемого счета
     * @param accountProductUuid    uuid бизнес-продукта
     * @param currency              валюта
     * @param amount                сумма
     */
    var getTariffAmountAndRateForNewAccount = function(accountProductUuid, currency, amount) {
        var response = DAO.invokeEntityMethod('document', 'AccountProduct', 'getTariffAmountAndRateForNewAccount',
                accountProductUuid, currency, {type:'money', value:amount});
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Отправка запроса на открытие счета
     * @param paramPamPam           содержит в себе либо actionStrId, либо oneTimePassword, либо codeDate
     * @param accountProductUuid    uuid бизнес-продукта
     * @param currency              валюта
     * @param branch                офис обслуживания
     */
    var sendNewAccountRequest = function(paramPamPam, accountProductUuid, currency, branch){
        return DAO.invokeUserEntityMethod('sendNewAccountRequest',
                paramPamPam, accountProductUuid, currency, branch.uuid);
    };

    /**
     * Проверка возможности закрытия счета
     * @param account       счет клиента
     * @returns {*}
     */
    var checkAccountReference = function(account) {
        return DAO.invokeEntityMethod('system', 'RetailAccount', 'checkAccountReference', account.uuid);
    };

    /**
     * Получение диапазанов сумм и соответствюущих им ставок для счета
     * @param account
     */
    var getRateInfo = function(account) {
        var accountModel = {};
        accountModel.businessProduct = account.businessProduct;
        accountModel.interestRate = account.interestRate;
        accountModel.currency = account.currency;
        var response = DAO.invokeEntityMethod('system', 'RetailAccount', 'getRateInfo', account.uuid, JSON.stringify(accountModel));
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    return {
        getAccountList: getAccountList,
        getAccountProductList: getAccountProductList,
        getSourceProductForNewAccount: getSourceProductForNewAccount,
        getTariffAmountAndRateForNewAccount: getTariffAmountAndRateForNewAccount,
        sendNewAccountRequest: sendNewAccountRequest,
        checkAccountReference: checkAccountReference,
        getRateInfo: getRateInfo
    };
})();