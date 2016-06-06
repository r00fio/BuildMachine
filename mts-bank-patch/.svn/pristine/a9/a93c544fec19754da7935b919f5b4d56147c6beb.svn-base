
var DAOPaymentService = (function () {

    /**
     * Получение онлайн-операций
     * @param page          страница, на которой запрашиваются онлайн-платежи
     * @param count         число запрашиваемых операций
     * @param startDate     при подгрузке операций надо отсылать дату последнего платежа, чтобы следующие подбирались более поздние
     * @param fromDate      дата начала периода в фильтре
     * @param toDate        дата конца периода в фильтре
     * @param typeFilter    фильтр (Все, Платежи, Переводы)
     * @param productList   список продуктов (на сервере обновляются признаки isSelectedInPay)
     * @returns {Array}
     */
    var getOnlineOperations = function() {
        var page = arguments[0];
        var paramsArray = [];
        if (arguments.length == 2) {
            var count = {type: 'integer', value: arguments[1]};
            paramsArray.push(page);
            paramsArray.push(count);
        } else if (arguments.length == 3) {
            var count = {type: 'integer', value: arguments[1]};
            var startDate = arguments[2].format('dd.mm.yyyy HH:MM:ss');
            paramsArray.push(page);
            paramsArray.push(count);
            paramsArray.push(startDate);
        } else if (arguments.length == 5) {
            var dateFrom = arguments[1].format('dd.mm.yyyy');
            var dateTo = arguments[2].format('dd.mm.yyyy');
            var operationType = arguments[3];
            var productList = arguments[4];
            paramsArray.push(page);
            paramsArray.push(dateFrom);
            paramsArray.push(dateTo);
            paramsArray.push(operationType);
            paramsArray.push(productList);
        }
        return DAO.invokeUserEntityMethodAsync('getOnlineOperations', paramsArray).then(
            function(response) {
                if (response.data) {
                    response.data = JSON.parse(response.data);
                }
                return response;
            }
        );
    };

    var preparePeriodicalPayStruct = function(periodicalPayStruct) {
        if (periodicalPayStruct) {
            var tmp = JSON.parse(periodicalPayStruct);
            tmp.payDay = tmp.payDay ? new Date(tmp.payDay).format('dd.mm.yyyy') : null;
            tmp.beginDay =tmp.beginDay ? new Date(tmp.beginDay).format('dd.mm.yyyy') : null;
            tmp.endDay = tmp.endDay ? new Date(tmp.endDay).format('dd.mm.yyyy') : null;
            return JSON.stringify(tmp);
        }
        return periodicalPayStruct;
    };


    var getRegionsForPayment = function() {
        var response = DAO.invokeUserEntityMethod('getRegionsForPayment');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var setPaymentRegion = function(id) {
        return DAO.invokeUserEntityMethod('setPaymentRegion', id);
    };

    var getCategoriesForPayment = function(categoryId) {
        var response = DAO.invokeUserEntityMethod('getCategoriesForPayment', categoryId);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getSourcesListForPayment = function(type, sourceId) {
        var response = DAO.invokeUserEntityMethod(
            'getSourcesListForPayment', type, sourceId ? sourceId : null
        );
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getPayeeBank = function(bic) {
        return DAO.getEntitiesByCondition('document', 'Bank', 'BIC == ' + bic);
    };

    var validateAndSaveRetailRubPayment = function(paramPamPam, payment, paymentModeParams, periodicalPayStruct) {
        var response = DAO.invokeUserEntityMethod('validateAndSaveRetailRubPayment', paramPamPam, payment, paymentModeParams, preparePeriodicalPayStruct(periodicalPayStruct));
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getBrokerPaymentParams =  function() {
        var response = DAO.invokeUserEntityMethod('getBrokerPaymentParams');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getJuridicalPaymentParams =  function() {
        var response = DAO.invokeUserEntityMethod('getJuridicalPaymentParams');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getServicePaymentParams = function(providerId, serviceTypeId, personalAccountId) {
        var response = DAO.invokeUserEntityMethod('getServicePaymentParams', providerId, serviceTypeId, personalAccountId);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var validateAndSaveRetailServicePay = function(paramPamPam, source, payment, additionalFields, paymentModeParams, periodicalPayStruct, personalAccountId) {
        var response = DAO.invokeUserEntityMethod('validateAndSaveRetailServicePay', paramPamPam, source, payment, additionalFields, paymentModeParams, preparePeriodicalPayStruct(periodicalPayStruct), personalAccountId);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var validateAndSaveRetailTransfer = function(paramPamPam, source, dest, payment, paymentModeParams, periodicalPayStruct) {
        var response = DAO.invokeUserEntityMethod('validateAndSaveRetailTransfer', paramPamPam, source, dest, payment, paymentModeParams, preparePeriodicalPayStruct(periodicalPayStruct));
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getConversionRateForTransfer = function(paramPamPam, source, dest) {
        var response = DAO.invokeUserEntityMethod('getConversionRateForTransfer', paramPamPam, source, dest);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var validateAndSaveRetailICTransfer = function(paramPamPam, source, payment, paymentModeParams, periodicalPayStruct) {
        var response = DAO.invokeUserEntityMethod('validateAndSaveRetailICTransfer', paramPamPam, source, payment, paymentModeParams, preparePeriodicalPayStruct(periodicalPayStruct));
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var validateAndSaveRetailPayToCard = function(paramPamPam, source, payment, paymentModeParams, periodicalPayStruct) {
        var response = DAO.invokeUserEntityMethod('validateAndSaveRetailPayToCard', paramPamPam, source, payment, paymentModeParams, preparePeriodicalPayStruct(periodicalPayStruct));
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getFavouritesPayments = function() {
        return DAO.invokeUserEntityMethodAsync('getFavouritesPayments').then(
            function(response) {
                if (!response.code && response.data) {
                    response.data = JSON.parse(response.data);
                }
                return response;
            }
        );
    };

    var validateAndSaveRetailTrToFriend = function(paramPamPam, source, payment, paymentModeParams, periodicalPayStruct) {
        var response = DAO.invokeUserEntityMethod('validateAndSaveRetailTrToFriend', paramPamPam, source, payment, paymentModeParams, preparePeriodicalPayStruct(periodicalPayStruct));
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var importPhoneBook = function(phoneBook) {
        var response = DAO.invokeUserEntityMethod('importPhoneBook', phoneBook);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var addOrRefreshSocialNetwork = function(params) {
        var response = DAO.invokeUserEntityMethod('addOrRefreshSocialNetwork', JSON.stringify(params));
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var deleteFromSocialNetwork = function(strId, friendsInfo, photo, token) {
        var response = DAO.invokeUserEntityMethod('deleteFromSocialNetwork', strId, friendsInfo, photo, token);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getFriendsForPaymentParams = function() {
        var response = DAO.invokeUserEntityMethod('getFriendsForPaymentParams');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getSocialNetworksParams = function() {
        var response = DAO.invokeUserEntityMethod('getSocialNetworksParams');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getMGTSChargeList = function() {
        var response = DAO.invokeUserEntityMethod('getMGTSChargeList');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getSearchResultForPayment = function(searchText, currentPage, showAll) {
        var response = DAO.invokeUserEntityMethod('getSearchResultForPayment', searchText, currentPage, showAll);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var sendToEmailPaymentReceipt = function(paymentId, addressEmail) {
        return DAO.invokeUserEntityMethod('sendToEmailPaymentReceipt', paymentId, addressEmail);
    };

    var searchPayeeBaseName = function(type, number) {
        return DAO.invokeUserEntityMethodAsync('searchPayeeBaseName', type, number).then(function(response){
            if (response.data) {
                response.data = JSON.parse(response.data);
            }
            return response;
        });
    };

    return {
        getOnlineOperations: getOnlineOperations,
        getRegionsForPayment: getRegionsForPayment,
        setPaymentRegion: setPaymentRegion,
        getCategoriesForPayment: getCategoriesForPayment,
        getSourcesListForPayment: getSourcesListForPayment,
        getPayeeBank: getPayeeBank,
        validateAndSaveRetailRubPayment: validateAndSaveRetailRubPayment,
        getBrokerPaymentParams: getBrokerPaymentParams,
        getJuridicalPaymentParams: getJuridicalPaymentParams,
        getServicePaymentParams: getServicePaymentParams,
        validateAndSaveRetailServicePay: validateAndSaveRetailServicePay,
        validateAndSaveRetailTransfer: validateAndSaveRetailTransfer,
        getConversionRateForTransfer: getConversionRateForTransfer,
        validateAndSaveRetailICTransfer: validateAndSaveRetailICTransfer,
        validateAndSaveRetailPayToCard: validateAndSaveRetailPayToCard,
        getFavouritesPayments: getFavouritesPayments,
        validateAndSaveRetailTrToFriend: validateAndSaveRetailTrToFriend,
        importPhoneBook: importPhoneBook,
        addOrRefreshSocialNetwork: addOrRefreshSocialNetwork,
        deleteFromSocialNetwork: deleteFromSocialNetwork,
        getFriendsForPaymentParams: getFriendsForPaymentParams,
        getSocialNetworksParams: getSocialNetworksParams,
        getMGTSChargeList: getMGTSChargeList,
        getSearchResultForPayment: getSearchResultForPayment,
        sendToEmailPaymentReceipt: sendToEmailPaymentReceipt,
        searchPayeeBaseName: searchPayeeBaseName
    };
})();
