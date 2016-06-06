/**
 * Created by shubnik on 22.06.2015.
 */
var DAOBankCardService = (function() {

    var getCardList = function() {
        var response = DAO.invokeUserEntityMethod('getAllBankCards');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение параметров для подключения услуги страхования для кредитной карты
     */
    var getRetailCardInsuranceParams = function(cardUUID) {
        var response = DAO.invokeEntityMethod('system', 'BankCard', 'getRetailCardInsuranceParams', cardUUID);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение данных для заявки перевыпуска карты
     * @param card
     * @returns {*}
     */
    var getRetailCardReisRqData = function(card) {
        var response = DAO.invokeEntityMethod('system', 'BankCard', 'getRetailCardReisRqData', card.uuid);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение комиссии за подключение услуги страхования для кредитной карты
     */
    var getTariffAmountForInsuranceOption = function(cardUUID, company) {
        return DAO.invokeEntityMethod('system', 'BankCard', 'getTariffAmountForInsuranceOption', cardUUID, company);
    };

    /**
     * Отправка заявки на подключение услуги страхования для кредитной карты
     * @param insOptionStrId
     */
    var sendRetailCardInsuranceRequest = function(paramPamPam, card, insOptionStrId, amount) {
        return DAO.invokeEntityMethod(
            'system', 'BankCard', 'sendRetailCardInsuranceRequest',
            card.uuid, paramPamPam, insOptionStrId, amount);
    };

    var sendRetailBankCardBlockRequest = function(paramPamPam, card, newStatus) {
        return DAO.invokeEntityMethod(
            'system', 'BankCard', 'sendRetailBankCardBlockRequest',
            card.uuid, paramPamPam, newStatus);
    };

    /**
     * Отправка заявки на перевыпуск карты
     * @param paramPamPam               strId действия / смс-код / кодовая дата
     * @param card                      карта
     * @param requestData               данные для заявки, полученные при входе на страницу (нужны на сервере снова)
     * @param reissueReasonValue        выбранная причина перевыпуска
     * @param reissueProduct            выбранный продукт перевыпуска для карты
     * @param officeUUID                выбранный офис обслуживания
     * @returns {*}
     */
    var sendRetailBankCardReissueRequest = function(paramPamPam, card, requestData, reissueReasonValue, reissueProduct, officeUUID) {
        return DAO.invokeEntityMethod(
            'system', 'BankCard', 'sendRetailBankCardReissueRequest',
            card.uuid, paramPamPam, requestData, reissueReasonValue, reissueProduct, officeUUID);
    };

    var sendRetailProdOptRequest = function(paramPamPam, card, optionStrId, type, payMethodValue, roundMethodValue, phoneNumber, amount) {
        if (type == 'ACTIVATE') {
            return DAO.invokeEntityMethod(
                'system', 'BankCard', 'sendRetailProdOptRequest',
                card.uuid, paramPamPam, optionStrId, type, payMethodValue, roundMethodValue, phoneNumber, amount);
        } else {
            return DAO.invokeEntityMethod(
                'system', 'BankCard', 'sendRetailProdOptRequest',
                card.uuid, paramPamPam, optionStrId, type);
        }
    };


    var sendRetailAutoPayRequest = function(paramPamPam, card, optionId, phone, sum, threshold, action) {
        var response = DAO.invokeEntityMethod('system', 'BankCard', 'sendRetailAutoPayRequest', card.uuid,
            paramPamPam, optionId, phone, sum, threshold, action);
        try {
            response.data = JSON.parse(response.data);
        } catch (e) {}
        return response;
    };

    var getAutoPayBalanceParams = function(card) {
        var response = DAO.invokeEntityMethod('system', 'BankCard', 'getAutoPayBalanceParams', card.uuid);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getCardBonusInfo = function(card){
        var response = DAO.invokeEntityMethod('system', 'BankCard', 'getCardBonusInfo', card.uuid);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getExtractForBonuses = function(card, optionStrId, fromDate, toDate, operationType) {
        var response = DAO.invokeEntityMethod(
            'system', 'BankCard', 'getExtractForBonuses',
            card.uuid,
            optionStrId || null,
            DAOHelper.isDate(fromDate) ? fromDate.format('dd.mm.yyyy') : null,
            DAOHelper.isDate(toDate) ? fromDate.format('dd.mm.yyyy') : null,
            operationType || null
        );
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var sendVirtualCardRequisites = function(card) {
        var response = DAO.invokeEntityMethod('system', 'BankCard', 'sendVirtualCardRequisites', card.uuid);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    return {
        getCardList: getCardList,
        sendRetailCardInsuranceRequest: sendRetailCardInsuranceRequest,
        getTariffAmountForInsuranceOption: getTariffAmountForInsuranceOption,
        getRetailCardInsuranceParams: getRetailCardInsuranceParams,
        getRetailCardReisRqData: getRetailCardReisRqData,
        sendRetailBankCardBlockRequest: sendRetailBankCardBlockRequest,
        sendRetailBankCardReissueRequest: sendRetailBankCardReissueRequest,
        sendRetailProdOptRequest: sendRetailProdOptRequest,
        sendRetailAutoPayRequest: sendRetailAutoPayRequest,
        getAutoPayBalanceParams: getAutoPayBalanceParams,
        getCardBonusInfo: getCardBonusInfo,
        getExtractForBonuses: getExtractForBonuses,
        sendVirtualCardRequisites: sendVirtualCardRequisites
    };
})();