var DAORetailClientService = (function () {

    /**
     * Редактирование анктеных данных
     * @param param0        strId действия / смс / кодовая дата
     * @param fieldValue    новое значение
     * @returns {*}
     */
    var changeFieldValue = function(param0, fieldValue) {
        return DAO.invokeRetailClientEntityMethod('changeFieldValue', param0, fieldValue);
    };

    /**
     * Редактирование мобильного телефона
     * @param param0        strId действия / смс / кодовая дата
     * @param fieldValue    новое значение
     * @returns {*}
     */
    var changeMobileTelephone = function(param0, fieldValue) {
        return DAO.invokeRetailClientEntityMethod('changeMobileTelephone', param0, fieldValue);
    };

    /**
    * Редактирование адреса фактического проживания
    * @param param0        strId действия / смс / кодовая дата
    * @param address       json новый адрес
    * @returns {*}
    */
    var changeFactAddress = function(param0, address) {
        return DAO.invokeRetailClientEntityMethod('changeFactAddress', param0, address);
    };

    /**
     * Создание водительского удостоверения
     * @param driverDoc     json объект ВУ
     */
    var createDriverDoc = function(driverDoc) {
        var response = DAO.invokeRetailClientEntityMethod('createDriverDoc', driverDoc);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Редактирование водительского удостоверения
     * @param driverDoc     json объект ВУ
     */
    var changeDriverDoc = function(driverDoc) {
        return DAO.invokeRetailClientEntityMethod('changeDriverDoc', driverDoc);
    };

    /**
     * Удаление водительского удостоверения
     * @param uuid     ВУ
     */
    var deleteDriverDoc = function(uuid) {
        return DAO.invokeRetailClientEntityMethod('deleteDriverDoc', uuid);
    };

    /**
     * Создание транспортного средства
     * @param driverDoc     json объект ТС
     */
    var createTransportPass = function(transportPass) {
        var response = DAO.invokeRetailClientEntityMethod('createTransportPass', transportPass);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Редактирование транспортного средства
     * @param transportPass     json объект ТС
     */
    var changeTransportPass = function(transportPass) {
        return DAO.invokeRetailClientEntityMethod('changeTransportPass', transportPass);
    };

    /**
     * Удаление транспортного средства
     * @param uuid     TC
     */
    var deleteTransportPass = function(uuid) {
        return DAO.invokeRetailClientEntityMethod('deleteTransportPass', uuid);
    };

    /**
     * Создание лицевого счёта
     * @param personalAccount     json объект лицевого счёта
     */
    var createPersonalAccount = function(personalAccount) {
        var response = DAO.invokeRetailClientEntityMethod('createPersonalAccount', personalAccount);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Получение ближайшего офиса по местоположению клиента
     * @param coordsStr Строка, содержащая координаты текущего положения клиента через запятую "lat,lng"
     */
    var getNearestOffice = function(coordsStr) {
        var response = DAO.invokeUserEntityMethod('getNearestOffice', coordsStr);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Сохранение аватара
     * @param imageData
     */
    var changePhoto = function(imageData) {
        return DAO.invokeRetailClientEntityMethod('changePhoto', imageData);
    };

    /**
     * Получение настроек пользователя
     */
    var getUserSettings = function() {
        var response = DAO.invokeUserEntityMethod('getUserSettings');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    /**
     * Изменение логина пользователя
     * @param param0    strId действия / смс / кодовая дата
     * @param login     логин
     */
    var changeLogin = function(param0, login) {
        return DAO.invokeUserEntityMethod('changeLogin', param0, login);
    };

    /**
     * Изменение пароля пользователя
     * @param param0   strId действия / смс / кодовая дата
     * @param user     json пользователь
     */
    var changePassword = function(param0, user) {
        return DAO.invokeUserEntityMethod('changePassword', param0, user);
    };

    /**
     * Изменение кодовой даты
     * param param0    strId действия / смс / кодовая дата
     * @param user     json пользователь
     */
    var changeCodeDate = function(param0, user) {
        return DAO.invokeRetailClientEntityMethod('changeCodeDate', param0, user);
    };

    /**
     * Создание новых логина и пароля (восстановление доступа)
     * @param user      json параметры
     * @returns {*}
     */
    var createLoginPassword = function(user) {
        return DAO.invokeUserEntityMethod('createLoginPassword', user);
    };

    /**
     * Изменение пароля, логина и мобильного телефона при авторизации по тех. паролю
     * @param param0   strId действия для подтверждения / смс-пароль
     * @param user      json параметры
     * @returns {*}
     */
    var changeLoginPassword = function(param0, user) {
        return DAO.invokeUserEntityMethod('changeLoginPassword', param0, user);
    };

    /**
     * Регистрация КК
     * @param param0   actionStrId или смс-код или кодовая дата
     * @param user     json пользователь
     */
    var registerShortCode = function(param0, user) {
        return DAO.invokeUserEntityMethod('registerShortCode', param0 ,user);
    };

    /**
     * Регистрация Touch ID
     * @param identifier    идентификатор устройства (сгенерированный для КК)
     * @returns {*}
     */
    var registerTouchID = function(identifier) {
        return DAO.invokeUserEntityMethod('registerTouchID', identifier);
    };

    /**
     * Изменение КК
     * @param user     json пользователь
     */
    var changeShortCode = function(user) {
        return DAO.invokeUserEntityMethod('changeShortCode', user);
    };

    /**
     * Установка настройки отображения закрытых продуктов.
     * @param param0    strId действия / смс / кодовая дата
     * @param mode     режим. включен/выключен.
     */
    var setVisibleCloseProducts = function(mode) {
        return DAO.invokeUserEntityMethod('setVisibleCloseProducts', mode);
    };

    return {
        changeFieldValue: changeFieldValue,
        changeMobileTelephone: changeMobileTelephone,
        changeFactAddress: changeFactAddress,
        createDriverDoc: createDriverDoc,
        changeDriverDoc: changeDriverDoc,
        deleteDriverDoc: deleteDriverDoc,
        createTransportPass: createTransportPass,
        changeTransportPass: changeTransportPass,
        deleteTransportPass: deleteTransportPass,
        createPersonalAccount: createPersonalAccount,
        getNearestOffice: getNearestOffice,
        changePhoto: changePhoto,
        getUserSettings: getUserSettings,
        changeLogin: changeLogin,
        changePassword: changePassword,
        changeCodeDate: changeCodeDate,
        createLoginPassword: createLoginPassword,
        changeLoginPassword: changeLoginPassword,
        registerShortCode: registerShortCode,
        registerTouchID: registerTouchID,
        changeShortCode: changeShortCode,
        setVisibleCloseProducts: setVisibleCloseProducts
    }
})();