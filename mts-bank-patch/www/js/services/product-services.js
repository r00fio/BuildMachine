/**
 * Подключение SMS Банк-инфо, справка в посольство
 * Created by varzinov on 19.05.2015.
 */
(function (DAO) {
    var app = angular.module('app');

    app.factory('productSrv', ['$rootScope', '$filter', 'cardSrv', 'loanSrv', 'accountSrv', 'depositSrv', 'WebWorker',
    function($rootScope, $filter, cardSrv, loanSrv, accountSrv, depositSrv, WebWorker){
        var productListForClosing = null;
        var productListForCredit = null;
        var currentProduct = null;      // Текущий продукт, просматриваемый в карусели
        var currentOperation = null;    // Просматриваемая операция продукта
        var currentExtract = {};        // Просматриваемая выписка продукта
        var currentCategory = null;     // Просматриваемая категория продуктов

        var setCurrentProduct = function(product) {
            currentProduct = product;
        };

        var getCurrentProduct = function() {
            return currentProduct;
        };

        var setCurrentExtract = function(extract) {
            $rootScope.clone(currentExtract, extract);
            currentExtract.operationsDisplay = currentExtract.operationList.slice(0, 10);
        };

        var getCurrentExtract = function(reset) {
            if (reset) currentExtract = {};
            return currentExtract;
        };

        var setCurrentCategory = function(category) {
            currentCategory = category;
        };

        var getCurrentCategory = function() {
            return currentCategory;
        };

        var setCurrentOperation = function(operation) {
            currentOperation = operation;
        };

        var getCurrentOperation = function() {
            return currentOperation;
        };

        var findProductById = function(productId) {
            if (productListForClosing) {
                for (var i = 0; i < productListForClosing.length; i++) {
                    if (productListForClosing[i].id == productId) { return productListForClosing[i]; }
                }
            }
            return null;
        };

        /**
         * Возвращает признак изменения даты текущей операции относительно предыдущей
         * @param list      список операций
         * @param index     индекс текущей операции
         * @returns {boolean}
         */
        var isChangeDate = function(list, index) {
            if (list[index - 1].operationDate != list[index].operationDate) {
                return true;
            }
            return false;
        };

        /**
         * Получение комиссии в валюте источника списания денежных средств на выпуск виртуальной предоплаченной карты
         */
        var getComissionAmountForSourceProduct = function(sourceProduct) {
            var responseXML = DAO.invokeEntityMethod('system', sourceProduct.entityKind, 'getComissionReplenishment',
                sourceProduct.uuid);
            var response = DAO.xmlResponseToJson(responseXML);

            var logMsgPrefix = 'Поучение комиссии: ';
            if (response.code) {
                console.warn(logMsgPrefix + response.msg + ' (' + response.code + ')');
            } else {
                console.log(logMsgPrefix + response.msg);
                return response.data;
            }
        };

        /**
         * Получение параметров заявки на выпуск предоплаченной виртуальной карты
         */
        var getIssueRetailVirtualCardParams = function(sourceProduct) {
            var responseXML = DAO.invokeEntityMethod('system', sourceProduct.entityKind, 'getIssueRetailVirtCardParams',
                sourceProduct.uuid);
            var response = DAO.xmlResponseToJson(responseXML);

            var logMsgPrefix = 'Получение параметров заявки на выпуск предоплаченной виртуальной карты: ';
            if (response.code) {
                console.warn(logMsgPrefix + response.msg + ' (' + response.code + ')');
            } else {
                console.log(logMsgPrefix + response.msg);
                return JSON.parse(response.data);
            }
        };

        /**
         * Отправка заявки на выпуск предоплаченной виртуальной карты
         */
        var sendRetailVirtualCardRequest = function(sourceProduct, initialAmount) {
            var responseXML = DAO.invokeEntityMethod('system', sourceProduct.entityKind, 'sendRetailVirtCardRequest',
                sourceProduct.uuid, initialAmount);
            var response = DAO.xmlResponseToJson(responseXML);

            var logMsgPrefix = 'Отправка заявки на выпуск предоплаченной виртуальной карты: ';
            if (response.code) {
                console.warn(logMsgPrefix + response.msg + ' (' + response.code + ')');
            } else {
                console.log(logMsgPrefix + response.msg);
                return response.data;
            }
        };

        /**
         * Результат получения выписки
         * @param operation
         * @param categoryUpdate
         * @returns {Function}
         */
        var resultGetExtract = function(operation, categoryUpdate) {
            return function(result) {
                if (result.data == 'extractError') {
                    currentExtract.errorLoad = true;
                } else {
                    setCurrentExtract(result.data);

                    if (operation) {
                        updateCurrentOperation(operation, currentExtract.operationList, true);
                        if (categoryUpdate) {
                            updateCurrentCategory(currentExtract.categoryList);
                        }
                    }
                }
            };
        };

        /**
         * Сравнение двух операций - проводится по 3м полям, т.к. каких-то может не быть
         * @param op1
         * @param op2
         * @returns {boolean}
         */
        var equalsOperation = function(op1, op2) {
            return op1.extId == op2.extId
                && op1.docPaymentId == op2.docPaymentId
                && op1.rrn == op2.rrn;
        };

        /**
         * Обновление текущей операции при смене категории
         * @param operation             операция с идентификаторами текущей
         * @param operationList         список новых пришедших операций
         * @param onlyCurrentProduct    признак обновления только в текущем продукте или вообще во всех
         */
        var updateCurrentOperation = function(operation, operationList, onlyCurrentProduct) {
            for (var i = 0; i < operationList.length; i++) {
                if (equalsOperation(operation, operationList[i])) {
                    $rootScope.clone(currentOperation, operationList[i]);
                    break;
                }
            }

            /* если пришёл признак обновляем только текущий продукт (из выписки, например) */
            if (onlyCurrentProduct) {
                updateOperationInProduct(operation, currentProduct);
            } else {

                /* в контроле расходов нужно найти операцию во всех закэшированных продуктах, если таковые есть */
                if (updateOperationInProductList(operation, cardSrv.getCardList())) {
                    return true;
                }
                if (updateOperationInProductList(operation, loanSrv.getLoanList())) {
                    return true;
                }
                if (updateOperationInProductList(operation, depositSrv.getAccountList())) {
                    return true;
                }
                if (updateOperationInProductList(operation, accountSrv.getAccountList())) {
                    return true;
                }
            }
        };

        /**
         * Обновление операции в списке продуктов (карты, кредиты, вклады, счета)
         * @param operation
         * @param productList
         * @returns {boolean}
         */
        var updateOperationInProductList = function(operation, productList) {
            if (productList) {
                for (var i = 0; i < productList.length; i++) {
                    if (updateOperationInProduct(operation, productList[i])) {
                        return true;
                    }
                }
            }
            return false;
        };

        /**
         * Обновление операции в продукте, в котором была найдена операция с теми же идентификаторами
         * @param operation
         * @param product
         */
        var updateOperationInProduct = function(operation, product) {
            if (product.operationList) {
                for (var i = 0; i < product.operationList.length; i++) {
                    if (equalsOperation(operation, product.operationList[i])) {
                        $rootScope.clone(product.operationList[i], operation);
                        return true;
                    }
                }
            }
            return false;
        };

        /**
         * Обновление текущей категории расходов
         * @param categoryList
         */
        var updateCurrentCategory = function(categoryList) {
            if (categoryList) {
                for (var i = 0; i < categoryList.length; i++) {
                    if (currentOperation.categoryCode == categoryList[i].strId) {
                        $rootScope.clone(currentCategory, categoryList[i]);
                        break;
                    }
                }
            }
        };

        /**
         * Получение последних операций за месяц
         * @param product
         * @returns {promise|*}
         */
        var getLastOperationsForProduct = function(product) {
            var dateTo = new Date();
            var dateFrom = new Date();
            dateFrom.setMonth(dateFrom.getMonth() - 1);
            dateFrom.setDate(dateFrom.getDate() + 1);
            return WebWorker.invoke('getExtract', product, dateFrom, dateTo);
        };

        /**
         * Результат получения последних операций за месяц продукта
         * @param product       продукт
         * @param operation     операция, у которой изменили категорию (из списка последних операций продукта)
         * @returns {Function}
         */
        var resultGetLastOperationsForProduct = function(product, operation) {
            return function(result) {
                setFieldsProductForOperationList(product, result.data);

                /* если изменили категорию операции нужно обновить и операцию */
                if (operation) {
                    updateCurrentOperation(operation, product.operationList);
                }
            };
        };

        /**
         * Получение списка связанных продуктов
         * @param product
         * @returns {Function}
         */
        var getLinkedProductsForProduct = function(product) {
            return function() {
                WebWorker.invoke('getLinkedProducts', product).then(
                    function(result) {
                        product.linkedProducts = result.data;
                    }
                );
            }
        };

        /**
         * Сохранить последние операции в продукте (для всех продуктов одинаково)
         * @param product
         * @param resultRequest
         */
        var setFieldsProductForOperationList = function(product, resultRequest) {
            product.operationList = [];
            product.operationsDisplay = [];
            product.operationError = false;
            product.noOperations = false;
            product.visibleBtnExtract = false;
            product.showEarlyOperations = false;

            if (resultRequest == 'extractError') {
                product.operationError = true;
                product.visibleBtnExtract = true;
            } else {
                product.operationList = resultRequest.operationList;
                product.operationsDisplay = product.operationList && product.operationList.slice(0, 10);
                if (product.operationList.length > 0 && product.operationList.length <= 10) {
                    product.showEarlyOperations = true;
                    product.visibleBtnExtract = true;
                }
                if (product.operationList.length == 0) {
                    product.noOperations = true;
                    product.visibleBtnExtract = true;
                }

                /* 096614: для карт заблокированные средства приходят с выпиской */
                if (product.entityKind == 'BankCard') {
                    product.holdSum = resultRequest.holdSum;
                    product.holdOperations = $filter('filter')(product.operationList, {isHold: true, sign: '-'});
                }
            }
        };

        /**
         * Подгрузить следующие 10 операций (для всех продуктов одинаково)
         * @param product
         * @param scope
         */
        var showMoreOperations = function(product, scope) {
            if (product.operationList && product.operationList.length > 10) {
                product.operationsDisplay = product.operationList.slice(0, product.operationsDisplay.length + 10);
                product.visibleBtnExtract = product.operationsDisplay.length == product.operationList.length;
                product.showEarlyOperations = product.operationsDisplay.length == product.operationList.length;
                scope.$applyAsync();
            }
        };

        /*
         * Получение ссылки на продукт
         */
        var getProductSref = function(product) {
            if (product.entityKind) {
                switch (product.entityKind) {
                    case 'BankCard':
                        return 'card({cardId:' + product.id + '})';
                    case 'RetailLoan':
                        return 'loan({loanId:' + product.id + '})';
                    case 'RetailAccount':
                        return 'account({productId:' + product.id + '})';
                    case 'RetailDeposit':
                        return 'account({productId:' + product.id + '})';
                }
            }
        };

        return {
            setCurrentProduct: setCurrentProduct,
            getCurrentProduct: getCurrentProduct,
            setCurrentExtract: setCurrentExtract,
            getCurrentExtract: getCurrentExtract,
            setCurrentCategory: setCurrentCategory,
            getCurrentCategory: getCurrentCategory,
            setCurrentOperation:setCurrentOperation,
            getCurrentOperation: getCurrentOperation,
            findProductById: findProductById,
            isChangeDate: isChangeDate,
            getCommissionAmountForSourceProduct: getComissionAmountForSourceProduct,
            getIssueRetailVirtualCardParams: getIssueRetailVirtualCardParams,
            sendRetailVirtualCardRequest: sendRetailVirtualCardRequest,
            resultGetExtract: resultGetExtract,
            updateCurrentOperation: updateCurrentOperation,
            updateCurrentCategory: updateCurrentCategory,
            getLastOperationsForProduct: getLastOperationsForProduct,
            resultGetLastOperationsForProduct: resultGetLastOperationsForProduct,
            getLinkedProductsForProduct: getLinkedProductsForProduct,
            setFieldsProductForOperationList: setFieldsProductForOperationList,
            showMoreOperations: showMoreOperations,
            getProductSref: getProductSref
        };
    }]);
}());