/**
 * Created by varzinov on 28.07.2015.
 */

var DAOInfoServices = (function(CleverClient) {
    /* Банк идей */
    var getIdeas = function(createdByCurrentUser){
        return DAO.invokeUserEntityMethodAsync('getIdeas',  {type: 'bool', value: !!createdByCurrentUser}).then(
            function(response) {
                if (!response.code && response.data) {
                    response.data = JSON.parse(response.data);
                }
                return response;
            }
        );
    };

    var createIdea = function(subject, desc){
        return DAO.invokeUserEntityMethod('createIdea', subject, desc);
    };

    var voteForIdea = function(idea, vote){
        return DAO.invokeUserEntityMethod('voteForIdea', idea.uuid, {type: 'bool', value: vote});
    };

    /* Курсы валют */
    var getCurrentRates = function() {
        if (CleverClient.getUserUuid()) {
            /* авторизованы */
            return DAO.invokeUserEntityMethodAsync('getCurrencyRates').then(DAO.parseDataJson);
        } else {
            /* неавторизованы */
            return DAO.invokeMethodAsync('getCurrencyRates').then(DAO.parseDataJson);
        }
    };

    var getCurrencyRateHistory = function(period){
        if (CleverClient.getUserUuid()) {
            /* авторизованы */
            return DAO.invokeUserEntityMethodAsync('getCurrencyRateHistory', period).then(DAO.parseDataJson);
        } else {
            /* неавторизованы */
            return DAO.invokeMethodAsync('getCurrencyRateHistory', period).then(DAO.parseDataJson);
        }
    };

    var adjustMessages = function(messages) {
        for (var i = 0; DAOHelper.isArray(messages) && i < messages.length; i++) {
            if (messages[i].attachments) {
                messages[i].attachments = DAO.objectToArray(messages[i].attachments);
            }

            messages[i].text = DAOHelper.isArray(messages[i].text) ? messages[i].text.join('') : messages[i].text;
        }
    };

    var getMessages = function(beforeMsgMillisec, size){
        return DAO.invokeUserEntityMethodAsync('getAllMessages', beforeMsgMillisec, size).then(function(response){
            if (!response.code && response.data) {
                DAO.propValueToArray(response, 'data');
                adjustMessages(response.data);
            }
            return response;
        });
    };

    var sendMessage = function(text, imgBase64Str){
        return DAO.invokeUserEntityMethod('sendOnlineMessage', text, imgBase64Str);
    };

    var getNewChatMessages = function(){
        return DAO.invokeUserEntityMethodAsync('getNewChatMessages').then(function(response){
            if (!response.code && response.data) {
                DAO.propValueToArray(response, 'data');
                adjustMessages(response.data);
            }
            return response;
        });
    };

    var markChatMessagesAsRead = function(unreadMessageIds){
        return DAO.invokeUserEntityMethod('markChatMessagesAsRead', unreadMessageIds);
    };

    var getMapObjects = function(boundBoxStr, city, objType, atmFilter){
        var response;
        if (CleverClient.getUserUuid()) {
            response = DAO.invokeUserEntityMethod('getMapObjects', boundBoxStr, city, objType, atmFilter);
        } else {
            response = DAO.invokeMethod('getMapObjects', boundBoxStr, city, objType, atmFilter);
        }
        if (!response.code && response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getNearestGeoObjects = function(lat, lng, objectType, atmFilter, searchText, startIdx, batchSize) {
        if (CleverClient.getUserUuid()) {
            return DAO.invokeUserEntityMethodAsync('getNearestGeoObjects', lat, lng, objectType, atmFilter, searchText, startIdx, batchSize).then(DAO.parseDataJson);
        } else {
            return DAO.invokeMethodAsync('getNearestGeoObjects', lat, lng, objectType, atmFilter, searchText, startIdx, batchSize).then(DAO.parseDataJson);
        }
    };

    var categories;
    var getQuestionCategories = function(){
        if (categories) {
            return categories;
        }
        var response = DAO.invokeUserEntityMethod('getQuestionCategories');
        if (!response.code && response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение списка всех заявок для блока "Обслуживание клиента"
     * @param params
     * @returns {Array}
     */
    var getRetailDocBaseList = function(params) {
        params.dateFrom = params.dateFrom.format('dd.mm.yyyy');
        params.dateTo = params.dateTo.format('dd.mm.yyyy');
        var response = DAO.invokeUserEntityMethod('getRetailDocBaseList', [JSON.stringify(params)]);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    return {
        /* Банк идей */
        getIdeas: getIdeas,
        createIdea: createIdea,
        voteForIdea: voteForIdea,

        /* Курсы валют */
        getCurrentRates: getCurrentRates,
        getCurrencyRateHistory: getCurrencyRateHistory,

        /* Общение с банком */
        getMessages: getMessages,
        getNewChatMessages: getNewChatMessages,
        markChatMessagesAsRead: markChatMessagesAsRead,
        sendMessage: sendMessage,

        /* Контакты и реквизиты банка */
        getMapObjects: getMapObjects,
        getNearestGeoObjects: getNearestGeoObjects,

        /* Справочный центр */
        getQuestionCategories: getQuestionCategories,

        getRetailDocBaseList: getRetailDocBaseList
    };
})(CleverClient);