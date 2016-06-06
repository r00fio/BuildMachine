/*
 * Инфосервисы
 */
(function (DefaultHandler2) {
    var app = angular.module('app');

    app.factory('chat', ['$filter', '$rootScope', 'stateCache', function($filter, $rootScope, stateCache) {

        var messageList = null;

        var getMessages = function(){
            return messageList;
        };

        var setMessages = function(messages){
            messageList = angular.isArray(messages) ? messages : [];
        };

        var clearMessages = function(){
            while(messageList.length) { messageList.pop(); }
        };

        // Сообщение, которое содержит и текст и вложение/картинку надо разделить на несколько сообщений
        var splitMessage = function(msg){
            var attachments = msg && msg.attachments;
            var text = msg && msg.text && msg.text.trim();

            if (angular.isArray(attachments) && attachments.length) {
                var msgs = [];
                var splittedMsg;

                if (text) {
                    splittedMsg = angular.extend({}, msg);
                    splittedMsg.attachments = [];
                    msgs.push(splittedMsg);
                }

                for (var i = 0; i < attachments.length; i++) {
                    splittedMsg = angular.extend({}, msg);
                    splittedMsg.text = null;
                    splittedMsg.attachments = [attachments[i]];
                    msgs.push(splittedMsg);
                }
                return msgs;
            } else {
                return [msg];
            }
        };

        var appendMessage = function(msg){
            if (msg && (msg.id === undefined ||
                        !$filter('filter')(messageList, function(message){ return message.id == msg.id; }).length)) {
                var msgArr = splitMessage(msg);
                for (var i = 0; i < msgArr.length; i++) {
                    messageList.push(msgArr[i]);
                }
            }
        };

        var prependMessage = function(msg){
            var msgArr = splitMessage(msg);
            for (var i = msgArr.length - 1; i > -1; i--) {
                messageList.unshift(msgArr[i]);
            }
        };

        var loadMessages = function(messages){
            // Подгружаем сообщения
            if (angular.isArray(messages)) {
                for (var i = 0; i < messages.length; i++) {
                    prependMessage(messages[i]);
                }
            }
        };

        var getEarliestMessageTime = function(){
            if (messageList.length && angular.isDate(messageList[0].dateCreate) && !isNaN(messageList[0].dateCreate.getTime())) {
                return messageList[0].dateCreate.getTime();
            } else {
                return null;
            }
        };

        var newMessageList = [];
        var getNewMessages = function(){
            return newMessageList;
        };

        var addNewMessage = function(newMessage){
            if (newMessage && !$filter('filter')(newMessageList, function(msg){ return msg.id == newMessage.id; }).length) {
                newMessageList.push(newMessage);
            }
        };

        var addNewMessages = function(newMessages){
            if (angular.isArray(newMessages)) {
                for (var i = 0; i < newMessages.length; i++) {
                    addNewMessage(newMessages[i]);
                }
            } else {
                addNewMessage(newMessages);
            }
        };

        var setNewMessages = function(newMessages){
            newMessageList = angular.isArray(newMessages) ? newMessages : [];
            $rootScope.globals.newChatMessageCount = newMessageList.length;
        };

        var clearNewMessages = function(){
            while(newMessageList.length) { newMessageList.pop(); }
        };

        var reset = function() {
            setNewMessages(null);
        };

        return {
            getMessages: getMessages,
            setMessages: setMessages,
            clearMessages: clearMessages,
            appendMessage: appendMessage,
            prependMessage: prependMessage,
            loadMessages: loadMessages,
            getEarliestMessageTime: getEarliestMessageTime,
            getNewMessages: getNewMessages,
            addNewMessages: addNewMessages,
            setNewMessages: setNewMessages,
            clearNewMessages: clearNewMessages,
            reset: reset
        };
    }]);

    app.factory('bankNews', ['$filter', 'utils', '$rootScope', '$ionicModal', 'persistence', function($filter, utils, $rootScope, $ionicModal, persistence) {
        var allNews = null;

        var getNews = function() { return allNews; };

        var setNews = function(news) {
            allNews = angular.isArray(news) ? news : [];
        };

        var addNews = function(news) {
            if (angular.isArray(news)) {
                allNews = allNews ? allNews.concat(news) : news;
            }
        };

        /**
         * Получение списка новостей типа "Объявление"
         * @returns {*}
         */
        var getAdvertList = function() {
            return $filter('filter')(allNews, {'entityKind': 'News', type: 'advert'});
        };

        /**
         * Получение списка обычных новостей
         * @returns {*}
         */
        var getNewsList = function(importantOnly) {
            if (importantOnly) {
                return $filter('filter')(allNews, {'entityKind': 'News', type: 'news', important: true});
            } else {
                return $filter('filter')(allNews, {'entityKind': 'News', type: 'news'});
            }
        };

        var getImportant = function() {
            return $filter('filter')(allNews, {'entityKind': 'News', important: true});
        }

        /**
         * Получение списка акций банка
         * @returns {*}
         */
        var getPromoList = function() {
            return $filter('filter')(allNews, {'entityKind': 'RetailPromotion'});
        };

        /**
         * Получение списка обычгых ноыостей и акций банка
         * @returns {*}
         */
        var getNewsAndPromo = function() {
            return $filter('objectArrayFilter')(allNews, [{'entityKind': 'News', type: 'news'}, {'entityKind': 'RetailPromotion'}]);
        };

        var enablePromo = function(id) {
            if (utils.isIntVal(id)) {
                return DAO.parseResponse(DAO.invokeUserEntityMethod('enablePromo', {type: 'integer', value: id}));
            }
            return {code: 999, msg: 'id акции "' + id + '" не является целым числом'};
        };

        var sendPromoByEmail = function(id) {
            if (utils.isIntVal(id)) {
                return DAO.parseResponse(DAO.invokeUserEntityMethod('sendPromoByEmail', {type: 'integer', value: id}));
            }
            return {code: 999, msg: 'id акции "' + id + '" не является целым числом'};
        };

        var showImportant = function() {
            var scope = $rootScope.$new();
            scope.importantNews = getImportant();
            var lastViewedId = persistence.get('lastViewedNews');

            if (scope.importantNews && scope.importantNews.length && lastViewedId != scope.importantNews[0].id) {
                scope.importantNews = scope.importantNews[0];
                persistence.put('lastViewedNews', scope.importantNews.id);
                $ionicModal.fromTemplateUrl('templates/home/importantnews.html', {
                    scope: scope
                }).then(function(modal) {
                    angular.element('#rootpane').addClass('blur15px');
                    modal.show();
                    scope.hideImportantNews = function(){
                        modal.remove();
                        angular.element('#rootpane').removeClass('blur15px');
                        scope.$destroy();
                    };
                });
            }
        };

        var reset = function() {
            allNews = null;
        };

        return {
            getNews: getNews,
            setNews: setNews,
            addNews: addNews,
            getAdvertList: getAdvertList,
            getNewsList: getNewsList,
            getPromoList: getPromoList,
            getNewsAndPromo: getNewsAndPromo,
            enablePromo: enablePromo,
            sendPromoByEmail: sendPromoByEmail,
            showImportant: showImportant,
            reset: reset
        };
    }]);

    app.factory('curRates', ['$filter', function($filter){
        var adjustRates = function(data){

            // Покупки валют
            var fromRub = $filter('filter')(data, {fromCurrency: 'RUB'});
            var bids = {};
            for (var i = 0; i < fromRub.length; i++) {
                bids[fromRub[i].toCurrency] = fromRub[i].fromValue;
            }

            // Продажи валют
            var toRub = $filter('filter')(data, {toCurrency: 'RUB'});
            var asks = {};
            for (var i = 0; i < toRub.length; i++) {
                asks[toRub[i].fromCurrency] = toRub[i].toValue;
            }

            // Покупки и продажи
            var bidAskRates = [];
            for (var prop in bids) {
                bidAskRates.push({currency: prop, bid: bids[prop], ask: asks[prop]});
            }

            return bidAskRates;
        };

        return {
            adjustRates: adjustRates
        };
    }]);

    app.factory('appHelp', [function(){

        var findQuestionById = function(questions, id) {
            for (var i = 0; questions && i < questions.length; i++) {
                if (questions[i].id == id){
                    return questions[i];
                }
            }
            return null;
        };

        return {
            findQuestionById: findQuestionById
        };
    }]);

    app.factory('ideabank', ['$filter', 'WebWorker', 'stateCache', 'persistence', function($filter, WebWorker, stateCache, persistence) {

        var ideaList = null;

        var getIdeas = function(ideaFilter, userUuid) {
            switch(ideaFilter) {
                case 'popular':
                    return $filter('orderByProperty')(ideaList, 'questions[0].answers[0].count.count');
                case 'mine':
                    return $filter('filter')(ideaList, {author: {uuid: userUuid}});
                default:
                    return ideaList;
            }
        };

        var newIdeaDetector = function(ideabankLastVisit) {
            if (!angular.isDate(ideabankLastVisit)) {
                ideabankLastVisit = new Date(ideabankLastVisit);
            }
            var ideabankLastVisitTime = (!isNaN(ideabankLastVisit.getTime()) ? ideabankLastVisit.getTime() : 0);
            return function(idea){
                var activationTime = new Date(idea.emplActivateDate).getTime();
                return activationTime > ideabankLastVisitTime;
            };
        };

        var getNewIdeas = function(){
            return $filter('filter')(ideaList, newIdeaDetector(stateCache.getLastVisit('ideabank')));
        };

        var setIdeas = function(ideas){
            ideaList = angular.isArray(ideas) ? ideas : [];
        };

        var createIdea = function(subject, desc) {
            return WebWorker.invoke('createIdea', subject, desc);
        };

        var voteForIdea = function(idea, vote){
            return WebWorker.invoke('voteForIdea', idea, vote);
        };

        var showAppendix = function(){
            var dbDate = $filter('date')(new Date(), 'yyyy-MM-dd', '+0300');
            return (getNewIdeas().length > 0) && (persistence.get('ideasVisited') != dbDate);
        };

        var markAsSeen = function(){
            persistence.put('ideasVisited', $filter('date')(new Date(), 'yyyy-MM-dd', '+0300'));
        };

        var reset = function() {
            ideaList = null;
        };

        return {
            getIdeas: getIdeas,
            newIdeaDetector: newIdeaDetector,
            getNewIdeas: getNewIdeas,
            setIdeas: setIdeas,
            createIdea: createIdea,
            voteForIdea: voteForIdea,
            showAppendix: showAppendix,
            markAsSeen: markAsSeen,
            reset: reset
        };
    }]);

    app.factory('costControll', ['$filter', 'persistence', 'utils', function($filter, persistence, utils){
        var categories = persistence.get('costCtrlCategories');
        if (!utils.isObject(categories)) {
            persistence.put('costCtrlCategories', categories = {});
        }

        var setCosts = function(costs){
            var dbDate = $filter('date')(new Date(), 'yyyy-MM', '+0300');

            if (categories['_TOTAL_'] != dbDate && costs.overrunPercent > 0) {
                categories['_TOTAL_'] = 'overrun';
            }

            for (var i = 0; costs.categoryList && (i < costs.categoryList.length); i++) {
                if (categories[costs.categoryList[i].strId] != dbDate && costs.categoryList[i].overrunPercent > 0) {
                    categories[costs.categoryList[i].strId] = 'overrun';
                }
            }
        };

        var showAppendix = function(){
            for (var category in categories) {
                if (categories[category] == 'overrun') {
                    return true;
                }
            }
            return false;
        };

        var markAsSeen = function(){
            var dbDate = $filter('date')(new Date(), 'yyyy-MM', '+0300');

            for (var category in categories) {
                categories[category] = dbDate;
            }
        };

        return {
            setCosts: setCosts,
            showAppendix: showAppendix,
            markAsSeen: markAsSeen
        };
    }]);

    app.factory('tips', ['$q', '$http', '$rootScope', '$ionicModal', function($q, $http, $rootScope, $ionicModal){
        var parseXml = function(xmlText) {
            var resultArray = [];
            var screenNum = 0;
            var isScreenTagStarted = false;

            var handler = new xmlHandler();
            handler.startElement = function(qName, atts) {
                if (qName === 'screen') {
                    screenNum = resultArray.push(null);
                    isScreenTagStarted = true;
                }
            };
            handler.characters = function(data, start, length) {
                var ch = data.substr(start, length);
                if(isScreenTagStarted) { resultArray[screenNum - 1] = ch; }
            };
            handler.endElement = function (qName) {
                if (qName === 'screen') { isScreenTagStarted = false; }
            };

            var parser = new SAXDriver();

            parser.setDocumentHandler(handler);
            parser.setErrorHandler(handler);
            parser.setLexicalHandler(handler);

            parser.parse(xmlText);

            return resultArray;
        };

        var tips;
        var loadInfoMsg = function() {
            var assetUrl = 'assets/tips.xml';

            var deferred = $q.defer();
            if (tips) {
                deferred.resolve(tips);
            } else {
                $http.get(assetUrl).then(function (response) {
                    tips = parseXml(response.data);
                    deferred.resolve(tips);
                }).catch(function (err) {
                    deferred.reject('Не удалось загрузить \'' + assetUrl + '\'');
                });
            }

            return deferred.promise;
        };

        var $tipScope = $rootScope.$new(true);
        var $modal;

        $ionicModal.fromTemplateUrl('templates/ios/help/tip.html', function ($ionicModal) {
            $ionicModal.scope.hide = function(){
                checkStatusBar($ionicModal.scope.$root.getCurrentStateName());
                $ionicModal.hide();
            };
            $modal = $ionicModal;
        }, {
            scope: $tipScope
        });

        var showDialog = function(text){
            $tipScope.text = text;
            $tipScope.$applyAsync();
            $rootScope.showStatusBar(false);
            $modal.show();
        };

        var checkStatusBar = function(stateName) {
            if (stateName != 'start') {
                $rootScope.showStatusBar(true);
            }
        };

        var hideDialog = function(){
            checkStatusBar($rootScope.getCurrentStateName());
            $modal.hide();
        };

        return {
            loadInfoMsg: loadInfoMsg,
            showDialog: showDialog,
            hideDialog: hideDialog
        };
    }]);

    app.factory('navigation', ['$q', '$window', function($q, $window){
        var promises = [];
        var platform = ionic.Platform.platform();
        var availableApps = [];

        var navigators = [{
            name: 'Карты',
            scheme: 'maps://',
            iosURL: 'maps://?saddr=%lat_from%,%lon_from%&daddr=%lat_to%,%lon_to%'
        }, {
            name: 'HERE Maps',
            scheme: 'here-route://',
            iosURL: 'here-route:///%lat_to%,%lon_to%'
        }, {
            name: 'Waze',
            package: 'com.waze',
            scheme: 'waze://',
            iosURL: 'waze://?q=%lat_to%,%lon_to%&navigate=yes',
            androidURL: 'waze://?q=%lat_to%,%lon_to%&navigate=yes'
        }, {
            name: 'Google Карты',
            package: 'com.google.android.apps.maps',
            scheme: 'comgooglemaps://',
            iosURL: 'comgooglemaps://?daddr=%lat_to%,%lon_to%',
            androidURL: 'google.navigation:q=%lat_to%,%lon_to%'
        }, {
            name: 'Яндекс.Карты',
            package: 'ru.yandex.yandexmaps',
            scheme: 'yandexmaps://',
            iosURL: 'yandexmaps://build_route_on_map?lon_from=%lon_from%&lat_from=%lat_from%&lat_to=%lat_to%&lon_to=%lon_to%',
            action: 'ru.yandex.yandexmaps.action.BUILD_ROUTE_ON_MAP',
            getExtras: function(from, to) {
                return {
                    'lon_from': from[1].toString(),
                    'lat_from': from[0].toString(),
                    'lon_to': to[1].toString(),
                    'lat_to': to[0].toString()
                };
            }
        }, {
            name: 'Яндекс.Навигатор',
            package: 'ru.yandex.yandexnavi',
            scheme: 'yandexnavi://',
            iosURL: 'yandexnavi://build_route_on_map?lat_to=%lat_to%&lon_to=%lon_to%',
            action: 'ru.yandex.yandexnavi.action.BUILD_ROUTE_ON_MAP',
            getExtras: function(from, to) {
                return {
                    'lon_from': from[1].toString(),
                    'lat_from': from[0].toString(),
                    'lon_to': to[1].toString(),
                    'lat_to': to[0].toString()
                };
            }
        }];

        angular.forEach(navigators, function(nav) {
           var app;
            if (platform == 'android') {
                app = nav.package;
            } else if (platform == 'ios') {
                app = nav.scheme;
            }
            if (app && $window.appAvailability) {
                var deferred = $q.defer();
                promises.push(deferred.promise);
                appAvailability.check(app, function () {
                    availableApps.push(nav);
                    deferred.resolve();
                }, function () {
                    deferred.resolve();
                });
            }
        });

        /* Возвращает Promise, который разрешается со список доступных навигаторов */
        var getAvailable = function() {
            var deferred = $q.defer();
            $q.all(promises).finally(
                function() {
                    deferred.resolve(availableApps);
                }
            );
            return deferred.promise;
        };

        /* Подстановка координат в API URL */
        var prepareURL = function(url, from, to) {
            return url.replace('%lat_to%', to[0]).replace('%lon_to%', to[1])
                          .replace('%lat_from%', from[0]).replace('%lon_from%', from[1]);
        };

        /* Запуск внешнего приложения для навигации */
        var navigate = function(id, from, to) {
            var nav = availableApps[id];
            if (platform == 'android') {
                var intent = {
                    action: nav.action ? nav.action : window.plugins.webintent.ACTION_VIEW
                };
                if (nav.getExtras) {
                    intent.extras = nav.getExtras(from, to);
                }
                if (nav.androidURL) {
                    intent.url = prepareURL(nav.androidURL, from, to);
                }
                window.plugins.webintent.startActivity(intent,
                    function () {
                    },
                    function () {
                        alert('Не удалось запустить приложение ' + nav.name, 'Ошибка');
                    }
                );
            } else if (platform == 'ios') {
                $window.location = prepareURL(nav.iosURL, from, to);
            }
        };

        /* Если не обнаружено поддерживаемых навигаторов */
        var fallback = function(to) {
            var url = 'geo:' + to[0] + ',' + to[1] + '?q=' + to[0] + ',' + to[1] + '(Пункт назначения)';
            if (platform == 'android') {
            if (window.plugins && window.plugins.webintent) {
                window.plugins.webintent.startActivity({
                        action: window.plugins.webintent.ACTION_VIEW,
                        url: url
                    },
                        function () { },
                        function () { }
                );
            }
            } else if (platform == 'windowsphone') {
                url = 'bingmaps:?rtp=~pos.' + to[0] + '_' + to[1];
                window.location = url;
            } else {
                window.location = url
            }
        };

        return {
            getAvailable: getAvailable,
            navigate: navigate,
            fallback: fallback
        };
    }]);
}(window.DefaultHandler2));