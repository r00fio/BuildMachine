/* Сервис использует методы из продуктовых сервисов */
var DAORetailProductService = (function () {

    /**
     * Обновление детальной информации продукта из АБС
     * @param product
     * @returns {*}
     */
    var updateProduct = function(product) {
        var response = DAO.invokeEntityMethod('system', product.entityKind, 'update' + product.entityKind, product.uuid);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /* Список связанных продуктов */
    var getLinkedProducts = function(product) {
        var response = DAO.invokeEntityMethod('system', 'ClientProduct', 'getLinkedProducts', product.uuid);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Метод отправки реквизитов, выписки и графика платежей на email
     * @param product       продукт
     * @param email         email назначения
     * @param printType     тип формы REPLENISHMENT / EXTRACT / SCHEDULE (реквизиты / выписка / графика платежей)
     * @param dateFrom      дата начала периода (только для выписок)
     * @param dateTo        дата конца периода (только для выписок)
     * @returns {JSON|*}
     */
    var sendEmail = function(product, email, printType, dateFrom, dateTo) {
        if (dateFrom) {
            dateFrom = dateFrom.format('dd.mm.yyyy');
        }
        if (dateTo) {
            dateTo = dateTo.format('dd.mm.yyyy');
        }
        return DAO.invokeEntityMethod('system', product.entityKind, 'sendEmail', product.uuid, email, printType, dateFrom, dateTo);
    };

    /**
     * Установка признака "Отображение в списке продуктов" (избранное, не избранное)
     * @param product          продукт
     * @returns {JSON|*}
     */
    var setIsFavourite = function(product) {
        return DAO.invokeEntityMethod('system', product.entityKind, 'setIsFavourite', product.uuid, product.isFavourite);
    };

    /**
     * Установка признака "Использование в платежах"
     * @param product          продукт
     * @returns {JSON|*}
     */
    var setDisabled = function(product) {
        return DAO.invokeEntityMethod('system', product.entityKind, 'setDisabled', product.uuid, product.disabled);
    };

    /**
     * Получение выписки
     * @param product       продукт
     * @param fromDate      дата начала периода
     * @param toDate        дата конца периода
     * @returns             выписка
     */
    var getExtract = function(product, dateFrom, dateTo){
        var methodName = 'get' + product.entityKind + 'Extract';
        dateFrom = dateFrom.format('dd.mm.yyyy');
        dateTo = dateTo.format('dd.mm.yyyy');
        var response = DAO.invokeEntityMethod('system', product.entityKind, methodName, product.uuid, dateFrom, dateTo);
        try {
            response.data = JSON.parse(response.data);  // может прийти строка 'extractError' - не парсится
        } catch(e) {}
        return response;
    };

    /**
     * Сохранение категории операции на сервере
     * @param operation   операция
     * @param category    новая категория
     */
    var saveOperationCategory = function(operation, category) {
        var params = {};
        params.docPaymentId = operation.docPaymentId;
        params.extId = operation.extId;
        params.rrn = operation.rrn;
        params.category = category;
        return DAO.invokeUserEntityMethod('saveOperationCategory', JSON.stringify(params));
    };

    /**
     * Сохранение комментария операции на сервере
     * @param operation     операция
     */
    var saveOperationComment = function(operation) {
        var params = {};
        params.docPaymentId = operation.docPaymentId;
        params.extId = operation.extId;
        params.rrn = operation.rrn;
        params.comment = operation.comment;
        return DAO.invokeUserEntityMethod('saveOperationComment', JSON.stringify(params));
    };

    /**
     * Получение списка услуг и опций всех продуктов
     * @param product       карта / счет / вклад
     * @param accountId     id депозитного счета, в случае депозита
     * @returns {*}
     */
    var getProductServices = function(product, accountId) {
        var response = DAO.invokeEntityMethod("system", product.entityKind, "getProductServices", product.uuid, {type: 'integer', value: accountId});
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение реквизитов пополнения продукта
     * @param product       продукт
     * @param accountId     id счета (для вклада)
     * @returns {*}
     */
    var getReplenishmentDetails = function(product, accountId) {
        var response;
        if (accountId) {
            response = DAO.invokeEntityMethod('system', product.entityKind, 'getReplenishmentDetails', product.uuid, {type: 'integer', value: accountId});
        } else {
            response = DAO.invokeEntityMethod('system', product.entityKind, 'getReplenishmentDetails', product.uuid);
        }
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение списка опций услуги СМС Банк-инфо (TODO: возможно объединение с isActiveSMSBankInfo и getPaymentSourceList)
     * @param product
     */
    var getTariffOptionsSMSBankInfo = function(product) {
        var response = DAO.invokeEntityMethod('system', product.entityKind, 'getTariffOptionsSMSBankInfo', product.uuid);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение списка продуктов, с которых доступно списание (для оплаты различных услуг и опций)
     * (TODO: возможно объединение с isActiveSMSBankInfo и getTariffOptionsSMSBankInfo)
     * @returns {*|Array}
     */
    var getPaymentSourceList = function(){
        var response = DAO.invokeUserEntityMethod('getPaymentSourceList', '');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Метод отправки заявки на Подключение/Отключение СМС Банк-инфо
     * @param paramPamPam           содержит в себе либо actionStrId, либо oneTimePassword, либо codeDate
     * @param product               продукт
     * @param isConnect             признак подключения/отключения
     * @param selectedTariff        выбранный тариф для услуги
     * @param selectedSource        выбранный источник оплаты подключения услуги
     * @returns {*}
     */
    var sendSMSBankInfoRequest = function(paramPamPam, product, isConnect, selectedTariff, selectedSource, selectedMethod, amount) {
        return DAO.invokeEntityMethod('system', product.entityKind, 'sendSMSBankInfoRequest', product.uuid, paramPamPam,
                                                 isConnect, selectedTariff ? selectedTariff.uuid : null,
                                                 selectedSource ? selectedSource.uuid : null,
                                                 selectedMethod ? selectedMethod.uuid : null,
                                                 amount);
    };

    /**
     * Переименование продукта
     * @param product   продукт
     * @param name      имя
     */
    var renameProduct = function(product, name) {
        return DAO.invokeEntityMethod('system', product.entityKind, 'renameProduct', product.uuid, name);
    };

    /**
     *  Получение офисов в разбивке регионы, города, офисы
     */
    var getRegionList = function() {
        var response = DAO.invokeUserEntityMethod('getRegionList');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение срока изготовления справки для посольства
     * @type {null}
     */
    var termMakingEmbassyRef = null;
    var getTermMakingEmbassyRef = function() {
        if (!termMakingEmbassyRef) {
            return DAO.invokeUserEntityMethod('getTermMakingEmbassyRef');
        }
        return DAO.wrapResult(termMakingEmbassyRef);
    };

    /**
     * Отправка заявки на справку для посольства
     * @param product       продукт
     * @param branch        выбранный офис доставки
     * @param tariff        тариф справки
     * @param comment       комментарий
     */
    var sendEmbassyDocRequest = function(product, branch, tariff, comment){
        var response = DAO.invokeEntityMethod('system', product.entityKind, 'sendEmbassyDocRequest', product.uuid, branch.uuid, tariff.uuid, comment);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение списка счетов/вкладов для закрытия
     * @returns {*|null}
     */
    var getProductListForClosing = function() {
        var response = DAO.invokeUserEntityMethod('getProductListForClosing');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение списка счетов/карт для перечисления средств при закрытии счета/вклада
     * @param product       закрываемый счет/вклад
     * @returns {*|null}
     */
    var getProductListForCredit = function(product) {
        var response = DAO.invokeEntityMethod('system', product.entityKind, 'getProductListForCredit', product.uuid);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Отправка заявки на закрытие счета/вклада
     * @param paramPamPam   содержит в себе либо actionStrId, либо oneTimePassword, либо codeDate
     * @param product       закрываемый счет/вклад
     * @param creditTo      счет/карта для списания средств
     */
    var sendProductClosingRequest = function(paramPamPam, product, creditTo) {
        return DAO.invokeEntityMethod('system', product.entityKind, 'sendProductClosingRequest', product.uuid, paramPamPam, creditTo.uuid);
    };

    var sendRetailVirtCardRequest = function(paramPamPam, selectedSource, initialAmount) {
        return DAO.invokeEntityMethod(
            'system', selectedSource.entityKind, 'sendRetailVirtCardRequest', selectedSource.uuid, paramPamPam, initialAmount);
    };

    /**
     * Получить бизнес-продукт счета/вклада/кредита
     */
    var getBusinessProductAsObject = function(product) {
        return DAO.invokeEntityMethod('system', product.entityKind, 'getBusinessProductAsObject', product.uuid);
    };

    return {
        updateProduct: updateProduct,
        getLinkedProducts: getLinkedProducts,
        sendEmail: sendEmail,
        setIsFavourite: setIsFavourite,
        setDisabled: setDisabled,
        getExtract: getExtract,
        saveOperationCategory: saveOperationCategory,
        saveOperationComment: saveOperationComment,
        getProductServices: getProductServices,
        getReplenishmentDetails: getReplenishmentDetails,
        getTariffOptionsSMSBankInfo: getTariffOptionsSMSBankInfo,
        getPaymentSourceList: getPaymentSourceList,
        sendSMSBankInfoRequest: sendSMSBankInfoRequest,
        renameProduct: renameProduct,
        getRegionList: getRegionList,
        getTermMakingEmbassyRef: getTermMakingEmbassyRef,
        sendEmbassyDocRequest: sendEmbassyDocRequest,
        getProductListForClosing: getProductListForClosing,
        getProductListForCredit: getProductListForCredit,
        sendProductClosingRequest: sendProductClosingRequest,
        sendRetailVirtCardRequest: sendRetailVirtCardRequest,
        getBusinessProductAsObject: getBusinessProductAsObject
    };
})();