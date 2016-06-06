/*
 * Clever Client Utility
 */
var CleverClient = (function (config) {

    var URL = config.cleverClientUrl || 'http://217.174.99.209:10802/ib6/ib6/clever/client/request.xml';
    var APP_UID = config.cleverClientAppUuid || '201109051146483120000-f38a8bfa5fcffe28';

    var isArray = function(obj) { return Object.prototype.toString.call(obj) === '[object Array]'; };
    var isString = function(obj) { return Object.prototype.toString.call(obj) === '[object String]'; };
    var isObject = function(obj) { return Object.prototype.toString.call(obj) === '[object Object]'; };
    var isFunction = function(obj) { return Object.prototype.toString.call(obj) === '[object Function]'; };
    var isIntVal = function(obj) { return !isNaN(parseInt(obj)); };

    // TODO - временная подмена урла для Вологодского стенда
    var setVologdaURL = function() {
        URL = 'http://172.16.34.180:8081/IBRSWebTomcatWAR/clever/client/request.xml';
    };

    var createPromise = function() {
        var impl = {};
        return {
            then: function(callback){
                impl.promise = createPromise();

                if (isFunction(callback)) {
                    if ('resolved' in impl) {
                        impl.promise.resolve(callback(impl.resolved));
                    } else {
                        impl.callback = callback;
                    }
                }

                return impl.promise;
            },
            resolve: function(obj) {
                if (!('resolved' in impl)) {
                    impl.resolved = obj;
                    if ('callback' in impl) {
                        impl.promise.resolve(impl.callback(obj));
                    }
                }
            }
        };
    };

    /* Для WebWorker используем только синхронный запрос */
    var httpResponse = function (method, url, data, async) {
        var request = new XMLHttpRequest();
        request.withCredentials = true;
        request.open(method, url, !!async);
        request.setRequestHeader("Content-type", "text/plain");

        /* При недоступности сервера подсовываем псевдо-ответ для корректности дальнейших действий парсера */
        /* Если статус не 200, сервер присылает код страницы веб-фреймворка, поэтому подсовываем псевдо-ответ */
        var errorResponse = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><response code="-1"><diag-message></diag-message></response>';

        var getResponseData = function(request) {
            if (request.status == 200) {
                return request.responseText;
            } else {
                return errorResponse;
            }
        };

        if (async) {
            // Асинхронная отправка
            var promise = createPromise();

            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    promise.resolve(getResponseData(request));
                }
            };
            request.send(data);

            return promise;
        } else {
            // Синхронная отправка
            try {
                request.send(data);
                return getResponseData(request);
            } catch(e) {
                return errorResponse;
            }
        }
    };

    var getResponse = function (requestStr, async) {
        return httpResponse('POST', URL, requestStr, async);
    };

    function parseXML(data) {
        if (!data || typeof data !== "string") {
            return null;
        }

        try {
            var objDom = new XMLDoc(data, function (e) {
                // TODO: сделать логер: console.debug('parse error:', e);
            });
            return objDom.docNode;
        } catch (e) {
            return undefined;
        }
    }

    var serverSessionId = null;
    var uniquenessParam = null;
    var clientSessionId = null;
    var requestId = 0;
    var userUuid = null;
    var retailClientUuid = null;

    var getResponseResult = function(responseAsXml) {
        if (!responseAsXml) {
            return;
        }
        var code = parseInt(responseAsXml.getAttribute('code'));
        var responseTag = responseAsXml.getElements('diag-message')[0];
        return {
            code: isNaN(code) ? -1 : code,
            msg: responseTag.getText(),
            userMsg: responseTag.getText()
        };
    };

    var selectApplication = function(deviceinfo) {
        var clientInfo = getProtocolClientInfo(deviceinfo, config);
        var requestStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
                            + '<request atomic="false" id="' + ++requestId + '">'
                                + '<login application="' + APP_UID + '" client="' + clientInfo + '" challengeStrId="prepare" language="ru"/>'
                            + '</request>';

        var response = getResponse(requestStr);
        var responseDom = parseXML(response);
        var result = getResponseResult(responseDom);
        serverSessionId = responseDom.getAttribute('serverSessionId');
        return result;
    };

    var httpSelectApplication = function () {
        var requestStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
            + '<request atomic="false" id="' + ++requestId + '">'
            + '<login application="' + APP_UID + '" challengeStrId="prepare" language="ru"/>'
            + '</request>';

        return httpResponse('POST', URL, {dataType: 'text', data: requestStr});
    };

    var selectAuthMethod = function(auth_meth) {
        var requestStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
                        + '<request atomic="false" id="' + ++requestId + '" serverSessionId="' + serverSessionId + '">'
                            + '<login application="' + APP_UID + '" challengeStrId="select" language="ru">'
                                + '<selection>' + auth_meth + '</selection>'
                            + '</login>'
                        + '</request>';

        var response = getResponse(requestStr);
        var responseDom = parseXML(response);
        var result = getResponseResult(responseDom);
        try {
            uniquenessParam = ((responseDom.getElements('login-result')[0]).getElements('challenge')[0]).getElements('parameter')[0].getText();
        } catch (e) {
            //console.log('app.error ' + e);
        }
        return result;
    };

    var verifyAuthData = function(auth_meth, name, pass) {
        var loginB64 = fn_b64_encode(name);
        var passwordB64 = fn_b64_encode(pass);
        clientSessionId = CryptoUtils.HASH.GOST.SB.calc(auth_meth + uniquenessParam + loginB64 + '$' + passwordB64);

        var requestStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
                        + '<request atomic="false" id="' + ++requestId + '" serverSessionId="' + serverSessionId + '" clientSessionId="' + clientSessionId + '">'
                            + '<login application="' + APP_UID + '" challengeStrId="verify" language="ru">'
                                + '<authdata1>' + loginB64 + '</authdata1>'
                                + '<authdata2>' + passwordB64 + '</authdata2>'
                            + '</login>'
                        + '</request>';

        var response = getResponse(requestStr);
        var responseDom = parseXML(response);
        var result = getResponseResult(responseDom);

        var loginResult = responseDom.getElements('login-result')[0];
        if (loginResult) {
            var challenge = loginResult.getElements('challenge')[0];
            if (challenge) {
                var strId = challenge.getAttribute('strId');

                /* выбор источника одноразовых паролей */
                if (strId === 'select') {
                    var parameter = challenge.getElements('parameter');

                    /* берём первый попавшийся источник, по бизнес-логике он только один и будет */
                    result.deviceUuid = challenge.getElements('parameter')[0].getAttribute('name');
                    return result;
                }

                /* подтверждение кодовой датой */
                if (strId === 'codeDate') {
                    result.codeDateConfirm = true;
                    result.codeDateHint = challenge.getAttribute('codeDateHint');
                    return result;
                }
            }
            var user = (loginResult).getElements('user')[0];
            if (user) {
                userUuid = user.getElements('entity-uuid')[0].getText();
                result.codeDateHint = user.getAttribute('codeDateHint') ? user.getAttribute('codeDateHint') : '';
                result.changePassword = user.getAttribute('changePassword') ? user.getAttribute('changePassword') === 'true' : false;
                result.changeMobileTelephone = user.getAttribute('changeMobileTelephone') ? user.getAttribute('changeMobileTelephone') === 'true' : false;
                if (result.changePassword) {
                    result.changeLogin = user.getAttribute('changeLogin') ? user.getAttribute('changeLogin') === 'true' : false;
                    result.requireOldPassword = user.getAttribute('requireOldPassword') ? user.getAttribute('requireOldPassword') === 'true' : false;
                    result.hasMobileTelephone = user.getAttribute('hasMobileTelephone') ? user.getAttribute('hasMobileTelephone') === 'true' : false;
                } else if (result.changeMobileTelephone) {
                    result.hasMobileTelephone = user.getAttribute('hasMobileTelephone') ? user.getAttribute('hasMobileTelephone') === 'true' : false;
                }
            }
        }
        return result;
    };

    /**
     * Запрос на выбор источника одноразовых паролей
     */
    var selectOTPDevice = function(deviceUuid) {
        var requestStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
                       + '<request atomic="false" id="' + ++requestId + '" serverSessionId="' + serverSessionId + '" clientSessionId="' + clientSessionId + '">'
                           + '<login application="' + APP_UID + '" challengeStrId="select" language="ru">'
                               + '<selection>' + deviceUuid + '</selection>'
                           + '</login>'
                       + '</request>';

        var response = getResponse(requestStr);
        var responseDom = parseXML(response);
        var result = getResponseResult(responseDom);

        var loginResult = responseDom.getElements('login-result')[0];
        if (loginResult) {
            var challenge = loginResult.getElements('challenge')[0];
            if (challenge) {
                var strId = challenge.getAttribute('strId');

                /* подтверждение смс-кодом */
                if (strId === 'password') {
                    result.otpConfirm = true;
                    return result;
                }
            }
        }
        return result;
    };

    /**
     * Отправить повторно смс-код (ТОЛЬКО для авторизации и восстановлении доступа)
     */
    var generateOneTimePasswordForAuth = function() {
        var requestStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
                       + '<request atomic="false" id="' + ++requestId + '" serverSessionId="' + serverSessionId + '" clientSessionId="' + clientSessionId + '">'
                           + '<login application="' + APP_UID + '" challengeStrId="password" language="ru"/>'
                       + '</request>';

        getResponse(requestStr);
    };

    /**
     * Подтверждение авторизации
     * @param confirmCode   смс-код / кодовая дата
     */
    var confirmLoginAction = function(confirmCode) {
        var requestStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
                       + '<request atomic="false" id="' + ++requestId + '" serverSessionId="' + serverSessionId + '" clientSessionId="' + clientSessionId + '">'
                           + '<login application="201109051146483120000-f38a8bfa5fcffe28" challengeStrId="verify" language="ru">'
                               + '<authdata1>' + confirmCode + '</authdata1>'
                           + '</login>'
                       + '</request>';

        var response = getResponse(requestStr);
        var responseDom = parseXML(response);
        var result = getResponseResult(responseDom);

        var loginResult = responseDom.getElements('login-result')[0];
        if (loginResult) {
            var challenge = loginResult.getElements('challenge')[0];
            if (challenge) {
                var strId = challenge.getAttribute('strId');

                /* неправильный пароль - с сервера приходит снова предыдущий ответ */
                if (strId === 'password') {
                    result.otpFalse = true;
                    return result;
                }

                /* неправильная кодовая дата - аналогично с сервера приходит снова предыдущий ответ */
                if (strId === 'codeDate') {
                    result.remainCountErrors = challenge.getAttribute('remainCountErrors');
                    result.codeDateFalse = true;
                    return result;
                }
            }
            var user = (loginResult).getElements('user')[0];
            if (user) {
                userUuid = user.getElements('entity-uuid')[0].getText();
            }
        }
        return result;
    };

    /**
     * Подтверждение восстановления доступа (метод тот же самый, что для авторизации, только название другое для ConfirmationCtrl)
     * @param confirmCode   смс-код / кодовая дата
     */
    var confirmRestoreAccess = function(confirmCode) {
        return confirmLoginAction(confirmCode);
    };

    // Получение протоколируемой информации об устройстве и включенных сервисах
    var getProtocolClientInfo = function(deviceinfo, config) {
        var result = {};
        if (deviceinfo) {
            for (var info in deviceinfo.data) {
                result[info] = deviceinfo.data[info];
            }
        }
        // TODO: закомменчено до внятного объяснения как журнализировать сервисы
        //for (var serviceName in config.clientServices) {
        //    if (config.clientServices[serviceName]) {
        //        result[serviceName] = true;
        //    }
        //}
        return JSON.stringify(result).replace(/"/g, '&quot;').replace(/,/g, ', ');
    };

    var logout = function() {
        var requestStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
                    + '<request atomic="false" id="' + ++requestId + '" serverSessionId="' + serverSessionId + '" clientSessionId="' + clientSessionId +'">'
                        + '<logout batchId="0" reason="0">'
                            + '<diag-message>Штатное отключение от системы</diag-message>'
                        + '</logout>'
                    + '</request>';

        var response = getResponse(requestStr);
        var responseDom = parseXML(response);
        var result = getResponseResult(responseDom);
        if (result.code) {
            return result.msg;
        }
        return getResponseResult(responseDom);
    };

    var login = function(auth_meth, name, pass, deviceinfo) {
        var result;

        /* ------------ 1 этап ------------ */
        result = selectApplication(deviceinfo);
        if (result.code) {
            return result;
        }

        /* ------------ 2 этап ------------ */
        result = selectAuthMethod(auth_meth, deviceinfo);
        if (result.code) {
            return result;
        }

        /* ------------ 3 этап ------------ */
        result = verifyAuthData(auth_meth, name, pass, deviceinfo);
        if (result.code) {
            return result;
        }

        /* Если пришло требование подтверждения, то сразу зашлём запрос на выбор источника генерации паролей */
        if (result.deviceUuid) {
            result = selectOTPDevice(result.deviceUuid);
            if (result.code) {
                return result;
            }
        }
        return result;
    };

    var getUserUuid = function() {
        return userUuid;
    };

    var getRetailClientUuid = function() {
        return retailClientUuid;
    };

    var orderByToXml = function(orderBy) {
        if (isObject(orderBy)) {
            var result = '';
            for (var orderField in orderBy) {
                result += '<order descending="' 
                    + (orderBy[orderField] == true || (isString(orderBy[orderField]) && orderBy[orderField].match(/^desc$/i) != null)) 
                    + '"><expression>' + orderField + '</expression></order>';
            }
            return result;
        } else if (isString(orderBy)) {
            var result = '';
            var orderFields = orderBy.split(/\s*,\s*/);
            for (var i = 0; i < orderFields.length; i++) {
                var matchRes;
                if (matchRes = orderFields[i].match(/^(\w+)\s*(\w*).*$/)) {
                    result += '<order descending="' + (matchRes[2].match(/^(desc|true|1)$/i) != null) + '"><expression>' + matchRes[1] + '</expression></order>';
                }
            }
            return result;
        } else {
            return '';
        }
    };

    /**
      * Получить данные по всем сущностям заданного типа (entityKind: document, system, structure, codifier) и вида (kindStrId)
      * с использованием выражения ЯОПУС (condition). Результат сортировать полям в orderBy.
      * Формат orderBy: строка - 'id, name asc, birthdate desc'; или объект - {id: 0, name: null, birthdate: true, age: 'desc'}
      * 'asc'|false|0|null|undefined - по возрастанию, 'desc'|true|1 - по убыванию
      * Возвращает XML строку.
      */
    var getEntities = function(entityKind, kindStrId, condition, orderBy, position, size, callback) {
        if (!isString(kindStrId)) {
            //console.warn('Параметр kindStrId должен содержать строку. Передано:', kindStrId);
        }

        if (!isString(entityKind) || !entityKind.match(/^(document|system|structure|codifier|dba)$/)) {
            /*console.warn(
                'В запросе на сущность "' + kindStrId + '" параметр entityKind(scope) содержит недопустимое значение:', entityKind,
                '\n(Допустимые значения: ["document"|"system"|"structure"|"codifier"|"dba"]'
            );*/
        }

        condition = condition ? condition : 'true';
        position = isIntVal(position) ? ' position="' + position + '"' : '';
        size = isIntVal(size) ? ' size="' + size + '"' : '';

        var requestStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
                + '<request id="' + ++requestId + '" atomic="false" serverSessionId="' + serverSessionId + '" clientSessionId="' + clientSessionId + '">'
                    + '<entities-select kindStrId="' + kindStrId + '" scope="' + entityKind + '" batchId="0" stuffing="full"' + position + size + '>'
                        + orderByToXml(orderBy)
                        + '<condition><![CDATA[' + condition + ']]></condition>'
                    + '</entities-select>'
                + '</request>';
        return getResponse(requestStr, callback);
    };

    var getXmlFieldsFromObject = function(obj){
        var result = '';
        for (var fieldName in obj) {
            if (isString(obj[fieldName])) {
                result += '<field name="' + fieldName + '" type="string">' + 
                              (obj[fieldName] ? '<string-value>' + obj[fieldName] + '</string-value>' : '<string-value/>') + 
                          '</field>';
            }
        }
        return result;
    };

    var insertEntity = function(entityKind, kindStrId, object, callback){
        var requestStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
                + '<request id="' + ++requestId + '" atomic="false" serverSessionId="' + serverSessionId + '" clientSessionId="' + clientSessionId + '">'
                    + '<entity-insert kindStrId="' + kindStrId + '" scope="' + entityKind + '" batchId="0">'
                        + getXmlFieldsFromObject(object)
                    + '</entity-insert>'
                + '</request>';
        return getResponse(requestStr, callback);
    };

    var getEntityInfo = function(entityKind, kindStrId) {
        var requestStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
                + '<request id="' + ++requestId + '" atomic="false" serverSessionId="' + serverSessionId + '" clientSessionId="' + clientSessionId + '">'
                    + '<entity-kinds-select scope="' + entityKind + '" batchId="0"><condition><![CDATA[strid=="' + kindStrId + '"]]></condition></entity-kinds-select>'
                + '</request>';
        return getResponse(requestStr);
    };

    var xmlEscape = function(str){
        return isString(str)
            ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
            : str;
    };

    /* Преобразует массив параметров в строку тег argument */
    var getArgumentsString = function(args) {
        var argumentsStr = '';
        if (isArray(args)) {
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                var type, value;
                if (isArray(arg)) {
                    type = arg.length > 0 ? arg[0] : 'string';
                    value = arg.length > 1 ? arg[1] === 0 ? 0 : arg[1] === false ? false : arg[1] : '';
                } else if (isObject(arg)) {
                    type = arg.type || 'string';
                    value = arg.value === 0 ? 0 : arg.value === false ? false : arg.value || '';
                } else {
                    type = 'string';
                    value = arg === 0 ? 0 : arg === false ? false : arg ? arg.toString() : '';
                }

                // Экранируем спец. символы
                value = xmlEscape(value);

                argumentsStr += '<argument type="' + type + '" position="' + i + '"><' + type + '-value>' + value + '</' + type + '-value></argument>';
            }
        }

        if (isString(args)) {
            argumentsStr = args;
        }
        return argumentsStr;
    };

    /**
     * Метод вызова метода вида объекта на серверной стороне
     * @param entityKind - document, system, structure, codifier
     * @param kindStrId - наименование вида объекта
     * @param method - метод вида объекта
     * @param entityUuid - uuid объекта
     * @param args - строка вида: <argument type="string" position="0"><string-value>123</string-value></argument>
     * либо массив массивов с парами значений: [тип значения, значение], напр., [['string', 'строка'] ['money', 123]]
     * либо массив объектов вида [{type: 'string', value: 'текст'}, {type: 'money', value: 123}]
     * @returns {*}
     */
    var invokeEntityMethod  = function(entityKind, kindStrId, method, entityUuid, args, async) {
        var argumentsStr = getArgumentsString(args);

        var requestStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
                + '<request id="' + ++requestId + '" atomic="false" serverSessionId="' + serverSessionId + '" clientSessionId="' + clientSessionId + '">'
                    + '<entity-method-invoke kindStrId="' + kindStrId + '" method="' + method + '" scope="' + entityKind + '" batchId="0" stuffing="full">'
                        + '<entity-uuid>' + entityUuid + '</entity-uuid>'
                        + argumentsStr
                    + '</entity-method-invoke>'
                + '</request>';

        var assignRetailClient = function(response){
            if (method == 'getRetailClient') {
                var jsonString = DAO.getStringValueData(response);
                if (jsonString) {
                    retailClientUuid = JSON.parse(jsonString).uuid;
                }
            }
        };

        if (async) {
            return getResponse(requestStr, true).then(function(response){
                assignRetailClient(response);
                return response;
            });
        } else {
            var response = getResponse(requestStr);
            assignRetailClient(response);
            return response;
        }
    };

    /**
     * Метод вызова методов неавторизованной зоны на серверной стороне
     * @param method - метод класса UnauthorizedMethods.java
     * @param args - строка вида: <argument type="string" position="0"><string-value>123</string-value></argument>
     * либо массив массивов с парами значений: [тип значения, значение], напр., [['string', 'строка'] ['money', 123]]
     * либо массив объектов вида [{type: 'string', value: 'текст'}, {type: 'money', value: 123}]
     * @returns {*}
     */
    var invokeMethod = function(method, args, async) {
        var argumentsStr = getArgumentsString(args);

        var requestStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
                       + '<request id="' + ++requestId + '" atomic="false">'
                           + '<method-invoke method="' + method + '" scope="unauth" batchId="0">'
                               + argumentsStr
                           + '</method-invoke>'
                       + '</request>';
        return getResponse(requestStr, async);
    };

    /**
     * Метод вызова запроса-"пустышки", проверяет протухание сессии при выводе из бэкграунда
     */
    var invokeEmpty = function() {
        var requestStr = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
                        + '<request id="' + ++requestId + '" atomic="false" serverSessionId="' + serverSessionId + '" clientSessionId="' + clientSessionId + '">'
                            + '<empty></empty>'
                        + '</request>';
        return getResponse(requestStr);
    };

    var clearSession = function() {
        serverSessionId = null;
        uniquenessParam = null;
        clientSessionId = null;
        requestId = 0;
        userUuid = null;
        retailClientUuid = null;
    };

    // Public members
    return {
        login: login,
        logout: logout,
        clearSession: clearSession,
        getEntities: getEntities,
        insertEntity: insertEntity,
        getUserUuid: getUserUuid,
        getRetailClientUuid: getRetailClientUuid,
        getEntityInfo: getEntityInfo,
        invokeEmpty: invokeEmpty,
        invokeMethod: invokeMethod,
        invokeEntityMethod: invokeEntityMethod,
        generateOneTimePasswordForAuth: generateOneTimePasswordForAuth,
        confirmLoginAction: confirmLoginAction,
        confirmRestoreAccess: confirmRestoreAccess,
        setVologdaURL: setVologdaURL,

        httpResponse: httpResponse,
        httpSelectApplication: httpSelectApplication,
        parseXML: parseXML
    };

})(AppConfig);