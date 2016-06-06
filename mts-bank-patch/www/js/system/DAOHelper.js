/**
 * Created by shubnik on 22.06.2015.
 */

var DAOHelper = (function(CleverClient) {

    var isString = function(obj) { return Object.prototype.toString.call(obj) === '[object String]'; };
    var isDate = function(obj) { return Object.prototype.toString.call(obj) === '[object Date]'; };
    var isObject = function(obj) { return Object.prototype.toString.call(obj) === '[object Object]'; };
    var isArray = function(obj) { return Object.prototype.toString.call(obj) === '[object Array]'; };

    var getRetailClient = function() {
        return DAO.invokeUserEntityMethodAsync('getRetailClient').then(
            function(response) {
                if (response.data) {
                    response.data = JSON.parse(response.data);
                }
                return response;
            }
        );
    };

    var getCodifierValues = function(codifStrId) {
        return DAO.getEntitiesByKindStrId('codifier', codifStrId);
    };

    /**
     * Получение агрегированного баланса
     * @returns {null}
     */
    var getAggregateBalance = function() {
        return DAO.invokeUserEntityMethodAsync('getAggregateBalance').then(
            function(response) {
                if (response.data) {
                    response.data = JSON.parse(response.data);
                }
                return response;
            }
        );
    };

    /**
     * Получение новостей
     * @returns {null}
     */
    var getNews = function(offset, size, types) {
        var response;

        /* авторизованы */
        if (CleverClient.getUserUuid()) {
            return DAO.invokeUserEntityMethodAsync('getNews', offset, size, types).then(
                function(response) {
                    if (response.data) {
                        response.data = JSON.parse(response.data);
                    }
                    return response;
                }
            );

        /* неавторизованы */
        } else {
            response = DAO.invokeMethod('getNews');
            if (response.data) {
                response.data = JSON.parse(response.data);
            }
            return response;
        }
    };

    /**
     * Получение уведомлений
     * @param offset  позиция первого уведомления для выборки.
     * @param size    количество уведомлений в выборке.
     * @returns {null}
     */
    var getNoticeList = function(offset, size) {
        var response = DAO.invokeUserEntityMethod('getNoticeList', offset, size);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение данных о расходах за месяц
     * Параметры:
     * @param params            json объект параметров
     *        fromHomePage      вызов с главной страницы (луч)
     *        month             месяц
     *        fromDate          дата с (фильтр)
     *        toDate            дата по (фильтр)
     *        productList       список выбранных продуктов (фильтр)
     * @returns {null}
     */
    var getControllingCosts = function(params) {
        return DAO.invokeUserEntityMethodAsync('getControllingCosts', JSON.stringify(params)).then(
            function(response) {
                if (response.data) {
                    response.data = JSON.parse(response.data);
                }
                return response;
            }
        );
    };

    /**
     * Сохранение бюджета конкретной категории расходов клиента
     * @param category      категория расходов
     * @returns {*}
     */
    var saveBudgetCategory = function(category) {
        return DAO.invokeUserEntityMethod('saveBudgetCategory', JSON.stringify(category));
    };

    /**
     * Сохранение бюджетов всех категорий
     * @param costs      объект со всеми категориями
     * @returns {*}
     */
    var saveBudgetCategories = function(costs) {
        return DAO.invokeUserEntityMethod('saveBudgetCategories', JSON.stringify(costs));
    };

    /**
     * Получение списка заявок на открытие продуктов для блока "На оформлении"
     * @returns {null}
     */
    var getRetailReqDocBaseList = function() {
        var response = DAO.invokeUserEntityMethod('getRetailReqDocBaseList');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение списка адресов из КЛАДРа
     */
    var getAddressElementListByKLADR = function(request) {
        var response = DAO.invokeUserEntityMethod('getAddressElementListByKLADR', request);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение глобальных настроек.
     */
    var getGlobalSettings = function() {
        var response = DAO.invokeMethod('getGlobalSettings');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Проверка кода при выводе приложения из бэкграунда
     * @param params
     * @returns {*}
     */
    var checkCodeByResumeApp = function(params) {
        var response = DAO.invokeUserEntityMethod('checkCodeByResumeApp', JSON.stringify(params));
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    return {
        isString: isString,
        isDate: isDate,
        isObject: isObject,
        isArray: isArray,

        getRetailClient: getRetailClient,
        getCodifierValues: getCodifierValues,
        getAggregateBalance: getAggregateBalance,
        getNews: getNews,
        getNoticeList: getNoticeList,
        getControllingCosts: getControllingCosts,
        saveBudgetCategory: saveBudgetCategory,
        saveBudgetCategories: saveBudgetCategories,
        getRetailReqDocBaseList: getRetailReqDocBaseList,
        getAddressElementListByKLADR: getAddressElementListByKLADR,
        getGlobalSettings: getGlobalSettings,
        checkCodeByResumeApp: checkCodeByResumeApp
    };
})(CleverClient);