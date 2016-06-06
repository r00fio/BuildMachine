var app = angular.module('app');

app.factory('paymentSrv', ['$q', 'WebWorker', function ($q, WebWorker) {

    var regionsForPayments = null;

    var mgtsCategory = {
        name: "Начисления",
        hasSubCategories: false,
        link: 'paymentaccruals',
        iconSrc: 'img/mgts-pay.svg'
    };

    var categoriesForPaymentArr = undefined;
    var vatValuesList = undefined;

    var favouritesList = undefined;

    // Кодификаторы для переодических платежей
    var codifiersList = {};

    // Кодификаторы для налоговых платежей
    var taxCodifiersList = {};

    var paymentConfirmActionStrId = 'ConfirmPaymentAction';

    var naturalPersonTypeList = {
        TO_SELF: {
            strId: 'TO_SELF',
            desc: 'Самому себе'
        },
        TO_OTHER: {
            strId: 'TO_OTHER',
            desc: 'Третьему лицу'
        }
    };

    var PersonTypes = {
        JURIDICAL: {
            code: 0,
            strId: 'JURIDICAL',
            desc: 'Юридическое лицо'
        },
        NATURAL_PERSON: {
            code: 1,
            strId: 'NATURAL_PERSON',
            desc: 'Физическое лицо'
        },
        INDIVIDUAL_ENTREPRENEUR: {
            code: 2,
            strId: 'INDIVIDUAL_ENTREPRENEUR',
            desc: 'Индивидуальный предприниматель'
        }
    };

    var getPersonTypeByStrId = function(strId) {
        return PersonTypes[strId];
    };

    var TransferTypes = {
        OTHERCLIENT: {
            code: 0,
            strId: 'OTHERCLIENT'
        },
        JURIDICAL: {
            code: 1,
            strId: 'JURIDICAL'
        },
        TAXPAY: {
            code: 2,
            strId: 'TAXPAY'
        },
        BUDGETPAY: {
            code: 3,
            strId: 'BUDGETPAY'
        },
        BROKER: {
            code: 4,
            strId: 'BROKER'
        },
        INTER_CLIENT: {
            code: 5,
            strId: 'INTER_CLIENT'
        },
        EXCHANGE: {
            code: 6,
            strId: 'EXCHANGE'
        },
        OPEN_ACCOUNT: {
            code: 7,
            strId: 'OPEN_ACCOUNT'
        }
    };

    var getTransferTypeByStrId = function(strId) {
        return TransferTypes[strId];
    };

    /**
     * Список доступных способов платежей по реквизитам
     */
    var paymentToCard = [
        {
            name: 'С карты МТС банка',
            hasSubCategories: false,
            link: 'paymenttocard',
            iconSrc: 'img/payment-cards.svg',
            linkParams: { viewMode: 'EDIT', title: 'С карты МТС банка'}
        },
        {
            name: 'С карты другого банка',
            hasSubCategories: false,
            iconSrc: 'img/payment-cards.svg',
            transferToCard: true
        }
    ];

    /**
     * Список доступных способов платежей по реквизитам
     */
    var paymentForDetails = [
        {
            name: 'Физическому лицу',
            hasSubCategories: false,
            link: 'rubpayment',
            iconSrc: 'img/payment-requisites.svg',
            linkParams: { viewMode: 'EDIT', title: 'Физическому лицу', typePayment : TransferTypes.OTHERCLIENT, isTaxPayment: false, payeeType: PersonTypes.OTHERCLIENT}
        },
        {
            name: 'Юридическому лицу',
            hasSubCategories: false,
            link: 'rubpayment',
            iconSrc: 'img/payment-requisites.svg',
            linkParams: { viewMode: 'EDIT', title: 'Юридическому лицу', typePayment : TransferTypes.JURIDICAL, isTaxPayment: false, payeeType: PersonTypes.JURIDICAL}
        },
        // #104184: MTS.Платежи и переводы.Изменения по 107Н\3/
        {
            name: 'Налоговые и бюджетные платежи',
            hasSubCategories: false,
            link: 'rubpayment',
            iconSrc: 'img/payment-requisites.svg',
            linkParams: { viewMode: 'EDIT', title: 'Налоговые и бюджетные платежи', typePayment : TransferTypes.TAXPAY, isTaxPayment: true, payeeType: PersonTypes.JURIDICAL}
        },
        //{
        //    name: 'В бюджетную организацию',
        //    hasSubCategories: false,
        //    link: 'rubpayment',
        //    iconSrc: 'img/payment-requisites.svg',
        //    linkParams: { viewMode: 'EDIT', title: 'В бюджетную организацию', typePayment : TransferTypes.BUDGETPAY, isTaxPayment: false, payeeType: PersonTypes.JURIDICAL}
        //},
        {
            name: 'На брокерский счет в МТС Банке',
            hasSubCategories: false,
            link: 'rubpayment',
            iconSrc: 'img/payment-requisites.svg',
            linkParams: { viewMode: 'EDIT', title: 'На брокерский счет в МТС Банке', typePayment : TransferTypes.BROKER, isTaxPayment: false, payeeType: PersonTypes.JURIDICAL}
        }
    ];

    /**
     * Список доступных способов платежей
     */
    var transfers = [
        {
            name: 'Между своими счетами',
            iconSrc: 'img/payment-accounts.svg',
            hasSubCategories: false,
            link: 'transfer',
            linkParams: { viewMode: 'EDIT', title: 'Между своими счетами'}
        },
        {
            name: 'Другому клиенту банка',
            iconSrc: 'img/payment-another-bank.svg',
            hasSubCategories: false,
            link: 'ictransfer',
            linkParams: { viewMode: 'EDIT', title: 'Другому клиенту банка'}
        },
        {
            name: 'Друзьям',
            iconSrc: 'img/payment-friends.svg',
            hasSubCategories: false,
            link: 'socialfriends'
        },
        {
            name: 'С карты на карту',
            iconSrc: 'img/payment-cards.svg',
            hasSubCategories: true,
            subCategories: paymentToCard
        },
        {
            strId: 'PaymentForDetails',
            name: 'По реквизитам',
            iconSrc: 'img/payment-requisites.svg',
            hasSubCategories: true,
            subCategories: paymentForDetails
        },
        {
            name: 'Обмен валют',
            iconSrc: 'img/payment-currency-rates.svg',
            hasSubCategories: false,
            link: 'transfer',
            linkParams: { viewMode: 'EDIT', title: 'Обмен валют'}
        }
    ];

    var getRegionsForPayment = function(forceUpdate) {
        if (forceUpdate || regionsForPayments === null) {
            regionsForPayments = $q.defer();
            WebWorker.invoke('getRegionsForPayment').then(function(result) {
                regionsForPayments.resolve(result.data);
            }, function(result) {
                regionsForPayments.reject(result);
            });
        }
        return regionsForPayments.promise;
    };

    var setCategoriesForPaymentArr = function (arr) {
        categoriesForPaymentArr = []
        categoriesForPaymentArr = categoriesForPaymentArr.concat(arr);
        categoriesForPaymentArr.push(mgtsCategory);
    };

    var getCategoriesForPaymentArr = function () {
        return categoriesForPaymentArr;
    };

    var getTransfers = function () {
        return transfers;
    };

    var getPersonTypes = function () {
        return PersonTypes;
    };

    var getTransferTypes = function () {
        return TransferTypes;
    };

    var setVatValuesList = function(arr) {
        vatValuesList = arr;
    };

    var getVatValuesList = function() {
        return vatValuesList;
    };

    var getNaturalPersonTypeList = function() {
        return naturalPersonTypeList;
    };

    var getDefaultPaymentModeStruct = function() {
        return {
            isTemplateMode: false,
            isVisibleTemplateFields: false,
            isDeleteTemplate: false,
            visibleRegularFields: false,
            fromTemplate : false,
            isRepeated: false,
            actionStrId: 'execute', // 'execute', 'saveTemplate', 'executeAndSaveTemplate'
            templateName: null,
            templateId: null
        };
    };

    var getDefaultPeriodicalPayStruct = function() {
        return {
            id: null,
            beginDay: new Date(), // Дата начала
            cause: null, // Причина приостановки
            dayOfMonth: null, // Число месяца
            dayOfWeekValue: null, // День недели
            decisionValue: 'SKIP', // Варианты исполнения платежа в случае нехватки средств
            endDay: new Date(), // Дата окончания
            isActive: null, // Активность периодического платежа
            isNotEnoughMoney: null, // Недостаточно средств для списания
            isOnlyWorkDay: false, // Только рабочие дни
            monthValue: null, // Месяц
            nearlyPayDay: (new Date()).format('dd.mm.yyyy'), // Дата ближайшего платежа
            payId: null, // Шаблон
            payDay: new Date(), // Дата платежа
            percent: null, // Процент
            periodicityValue: 'SINGLE', // Периодичность срабатывания событий
            priority: null, // Приоритет
            processedDay: null, // ДатаВремя последнего исполнения
            typeSumValue: 'FIX' // Тип суммы
        };
    };

    var getPaymentConfirmActionStrId = function() {
        return paymentConfirmActionStrId;
    };

    var getCodifierListByStrId = function(strId) {
        return codifiersList[strId];
    };

    var setCodifierListByStrId = function(strId, list) {
        codifiersList[strId] = list;
    };

    var getTaxCodifierListByStrId = function(strId) {
        return taxCodifiersList[strId];
    };

    var setTaxCodifierListByStrId = function(strId, list) {
        taxCodifiersList[strId] = list;
    };

    var getFavouritesList = function() {
        return favouritesList;
    };

    var setFavouritesList = function(arr) {
        favouritesList = arr;
    };

    var getParamsToRedirectFromFavourites = function(template, favourite, title) {
        if (!template) {
            return null;
        }

        if (template.docKind == 'RetailTransfer') {
            return {
                link: 'transfer',
                linkParams: {
                    viewMode: 'EDIT', title: title || 'Между своими счетами',
                    favorite: favourite, template: template
                }
            };
        } else if (template.docKind == 'RetailPayToCard') {
            return {
                link: 'paymenttocard',
                linkParams: {
                    viewMode: 'EDIT', title: title || 'С карты МТС банка',
                    favorite: favourite, template: template
                }
            };
        } else if (template.docKind == 'RetailRubPayment') {
            return {
                link: 'rubpayment',
                linkParams: {
                    viewMode: 'EDIT', title: title || 'По реквизитам',
                    typePayment : getTransferTypeByStrId(template.typePayment), isTaxPayment: template.isTaxPayment, payeeType: getPersonTypeByStrId(template.payeeTypeValue),
                    favorite: favourite, template: template
                }
            };
        } else if (template.docKind == 'RetailICTransfer') {
            return {
                link: 'ictransfer',
                linkParams: {
                    viewMode: 'EDIT', title: title || 'Другому клиенту банка',
                    favorite: favourite, template: template
                }
            };
        } else if (template.docKind == 'RetailServicePay') {
            return {
                link: 'servicepay',
                linkParams: {
                    viewMode: 'EDIT',
                    title: title || template.tile.name,
                    tile: template.tile,
                    providerId: template.tile.providerId,
                    serviceId: template.tile.serviceId,
                    favorite: favourite, template: template
                }
            };
        } else if (template.docKind == 'RetailTrToFriend') {
            return {
                link: 'paymenttofriend',
                linkParams: {
                    viewMode: 'EDIT',
                    title: title || 'Друзьям',
                    friendExtId: template.friendExtId,
                    favorite: favourite, template: template
                }
            };
        }

        return null;
    };

    var reset = function() {
        favouritesList = undefined;
    };

    return {
        getRegionsForPayment: getRegionsForPayment,
        setCategoriesForPaymentArr: setCategoriesForPaymentArr,
        getCategoriesForPaymentArr: getCategoriesForPaymentArr,
        getTransfers: getTransfers,
        getPersonTypes: getPersonTypes,
        getTransferTypes: getTransferTypes,
        setVatValuesList: setVatValuesList,
        getVatValuesList: getVatValuesList,
        getNaturalPersonTypeList: getNaturalPersonTypeList,
        getDefaultPaymentModeStruct: getDefaultPaymentModeStruct,
        getDefaultPeriodicalPayStruct: getDefaultPeriodicalPayStruct,
        getPaymentConfirmActionStrId: getPaymentConfirmActionStrId,
        getCodifierListByStrId: getCodifierListByStrId,
        setCodifierListByStrId: setCodifierListByStrId,
        getTaxCodifierListByStrId: getTaxCodifierListByStrId,
        setTaxCodifierListByStrId: setTaxCodifierListByStrId,
        getFavouritesList: getFavouritesList,
        setFavouritesList: setFavouritesList,
        getParamsToRedirectFromFavourites: getParamsToRedirectFromFavourites,
        reset: reset
    }
}]);
