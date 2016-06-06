/*
 * Общий сервис.
 */
(function () {
    var app = angular.module('app');

    app.factory('commonSrv', ['utils', 'WebWorker', '$q', function(utils, WebWorker, $q) {
        var regionList = null;
        var nextState = null;
        var argsOTPUserAction = null;
        var aggregateBalance = null;

        var getRegionList = function() {
            if (regionList === null) {
                regionList = $q.defer();
                WebWorker.invoke('getRegionList').then(function(result) {
                    regionList.resolve(result.data);
                });
            }
            return regionList.promise;
        };

        /**
         * Метод для сохранения следующего состояния после успешного подтверждения
         * @param args
         */
        var setNextState = function(state) {
            nextState = state;
        };

        /**
         * Возврат состояния для редиректа после успешного подтверждения
         * @param args
         */
        var getNextState = function() {
            return nextState;
        };

        /**
         * Метод для сохранения параметров подтверждаемой операции
         * @param args
         */
        var setArgsOTPUserAction = function(args) {
            argsOTPUserAction = args;
        };

        /**
         * Возврат параметров подтверждаемой операции для вызова из контроллера подтверждения
         * @returns {*}
         */
        var getArgsOTPUserAction = function() {
            return argsOTPUserAction;
        };

        var openPDF = function(file) {
            if (file && file.name && file.name.split('.').pop() == 'pdf' && file.data) {
                utils.saveAndOpenFile(file.name, file.data, 'application/pdf')
            }
        };

        var setAggregateBalance = function(object) {
            aggregateBalance = object;
        };

        var getAggregateBalance = function() {
            return aggregateBalance;
        };

        var sendRequisitesBySMS = function(requisites) {
            var number = '';
            var message = getSMSMessageByRequisites(requisites);

            //CONFIGURATION
            var options = {
                replaceLineBreaks: true, // true to replace \n by a new line, false by default
                android: {
                    intent: 'INTENT'  // send SMS with the native android SMS messaging
                    //intent: '' // send SMS without open any other app
                }
            };
            var success = function () { console.log('Message sent successfully'); };
            var error = function (e) { console.log('Message Failed:' + e); };
            sms.send(number, message, options, success, error);
        };

        function getSMSMessageByRequisites(requisites) {
            var message = '';
            if (requisites.propertiesBank.length) {
                message += requisites.bankDataLabel + '\n';
                for (var i = 0; i < requisites.propertiesBank.length; i++) {
                    message += '\n' + requisites.propertiesBank[i].first + ': ' + requisites.propertiesBank[i].second;
                }
            }
            if (message) {
                message += '\n\n';
            }
            message += requisites.accountDataLabel + '\n';
            for (var i = 0; i < requisites.propertiesAccount.length; ++i) {
                message += '\n' + requisites.propertiesAccount[i].first + ': ' + requisites.propertiesAccount[i].second;
            }
            return message;
        }

        var getDaysInDecline = function(number) {
            var lastTwoDigits = number % 100;
            var lastDigit = number % 10;
            if (((lastTwoDigits > 10) && (lastTwoDigits < 20)) || (lastDigit == 0) || (lastDigit == 5) || (lastDigit == 6) || (lastDigit == 7) || (lastDigit == 8) || (lastDigit == 9)) {
                return ' дней';
            } else if (lastDigit == 1) {
                return ' день';
            } else {
                return ' дня';
            }
        };

        var reset = function() {
            regionList = null;
            nextState = null;
            argsOTPUserAction = null;
            aggregateBalance = null;
        };

        return {
            getRegionList: getRegionList,
            setNextState: setNextState,
            getNextState: getNextState,
            setArgsOTPUserAction: setArgsOTPUserAction,
            getArgsOTPUserAction: getArgsOTPUserAction,
            openPDF: openPDF,
            setAggregateBalance: setAggregateBalance,
            getAggregateBalance: getAggregateBalance,
            sendRequisitesBySMS: sendRequisitesBySMS,
            getDaysInDecline: getDaysInDecline,
            reset: reset
        };
    }]);
}());