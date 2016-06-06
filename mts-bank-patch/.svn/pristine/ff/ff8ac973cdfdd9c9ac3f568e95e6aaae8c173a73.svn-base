/*
 * Сервис для карт
 */
(function () {
    var app = angular.module('app');

    app.factory('cardSrv', ['$filter', '$rootScope', 'WebWorker', function($filter, $rootScope, WebWorker) {
        var _card = null;
        var _cardList = null;
        var _currentBankCardOptions = null;

        var setCurrentBankCard = function(bankCard) {
            _card = bankCard;
        };

        var getCurrentBankCard = function() {
            return _card;
        };

        /*
         * Получить список карт для отображения на странице Мои финансы.
         */
        var getCardList = function() {
            return _cardList;
        };

        var setCardList = function(list) {
            _cardList = list || [];
        };

        /**
         * Получение отсортированного списка карт: открытые избранные, открытые неизбранные, закрытые
         * @returns {*}
         */
        var getSortedCardList = function() {
            var openFavouriteCards = $filter('objectArrayFilter')(getCardList(), [{isFavourite: true, isClosed: false}]);
            var openNotFavouriteCards = $filter('objectArrayFilter')(getCardList(), [{isFavourite: false, isClosed: false}]);
            var closedCards = $filter('objectArrayFilter')(getCardList(), [{isClosed: true}]);
            _cardList = openFavouriteCards.concat(openNotFavouriteCards).concat(closedCards);
            delete(openFavouriteCards);
            delete(openNotFavouriteCards);
            delete(closedCards);
            return _cardList;
        };

        var setCurrentBankCardOptions = function(currentBankCardOptions) {
            _currentBankCardOptions = currentBankCardOptions;
        };

        var getCurrentBankCardOptions = function() {
            return _currentBankCardOptions;
        };

        var getCardById = function(id) {
            for (var i = 0; i < _cardList.length; i++) {
                if (_cardList[i].id == id) {
                    return _cardList[i];
                }
            }
            return null;
        };

        var getCardIdxById = function(id) {
            for (var i = 0; i < _cardList.length; i++) {
                if (_cardList[i].id == id) {
                    return i;
                }
            }
            return 0;
        };

        var reset = function() {
            _cardList = null;
            _currentBankCardOptions = null;
        };

        var setBlocked = function(bankCard, value) {
            if (!angular.isObject(bankCard) || bankCard.entityKind !== 'BankCard') {
                return;
            }
            var cmd = 'sendRetailBankCardBlockRequest';
            var confirmCmd = 'RetailConfirmRequestAction';
            var newStatus = value ? 'BLOCKED' : 'ACTIVE';

            function processingResults(data) {
                switch (data.cmdInfo) {
                    case cmd:
                        // <для подтверждения одноразовым паролем>
                        if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                            $rootScope.confirmationShow(cmd, args, data.result.data == 'otpConfirm');
                        } else if (data.result.data == 'true') {
                            $rootScope.confirmationHide();

                            // Действия после успешной отправки.
                            alert('Заявка на ' + (value ? '' : 'раз') + 'блокировку карты принята в обработку.');

                        } else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                            $rootScope.confirmationFalse(data.result.data);
                        } else {
                            $rootScope.confirmationHide();
                            alert(data.result.data);
                        }
                        // </для подтверждения одноразовым паролем>
                        break;
                }
            }
            WebWorker.setFunction(processingResults);

            var args = [confirmCmd, bankCard, newStatus];
            WebWorker.postMessage(cmd, cmd, args);
        };

        return {
            setCardList: setCardList,
            getCardList: getCardList,
            getSortedCardList: getSortedCardList,
            setCurrentBankCard: setCurrentBankCard,
            getCurrentBankCard: getCurrentBankCard,
            setCurrentBankCardOptions: setCurrentBankCardOptions,
            getCurrentBankCardOptions: getCurrentBankCardOptions,
            getCardById: getCardById,
            getCardIdxById: getCardIdxById,
            reset: reset,
            setBlocked: setBlocked
        };
    }]);

}());    