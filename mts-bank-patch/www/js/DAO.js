var DAO = (function (CleverClient) {

    var isArray = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };
    var isString = function (obj) {
        return Object.prototype.toString.call(obj) === '[object String]';
    };
    var isObject = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    };
    var isFunction = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Function]';
    };
    var getJsType = function(obj) {
        return Object.prototype.toString.call(obj).match(/^\[object (\w*)\]$/)[1];
    };

    var isPromise = function(obj){
        return isObject(obj) && isFunction(obj.then);
    };

    var responseCode = null;
    var diagMessage = null;
    var cache = {};

    var reference = {'RetailClient': 1,
                     'branch': 1,
                     'currency': 1,
                     'CardProduct': 1,
                     'LoanProduct': 1,
                     'AccountProduct': 1,
                     'DepositProduct': 1,
                     'CardProdSetting': 1,
                     'TariffService': 1,
                     'TariffType': 1,
                     'LogoReference': 1,
                     'RetailPayMethod': 1,
                     'CategoryOperatio': 1,
                     'MapCityBook': 1,
                     'EmbassyInqTariff': 1,
                     'taxpayerstate': 1,
                     'taxpaymentground': 1,
                     'brokertrademarket': 1
    };

    var isReference = function(kindStrId) {
        return reference[kindStrId] ? true : false;
    };
    /**
     * Метод используется для парсинга результата запроса сущностей, который возвращается Клевер-клиентом
     * @param xmlStrResponse
     * @returns JSON-массив сущностей
     */
    /* Из XML строки формирует массив объектов */
    var convertXmlStrToEntityArray = function(xmlStr) {
        responseCode = null;
        diagMessage = null;

        var entityArray = [];
        var entity, fieldName, fieldType, isEntityUuid, fileFieldName;
        var handler = new xmlHandler();

        // Если значение поля - массив, то добавляет новый элемент в этот массив, иначе перезатирает старое значение
        var addFieldValue = function(oldValue, newValue) {
            if (isArray(oldValue)) {
                oldValue.push(newValue);
            } else {
                oldValue = newValue;
            }
            return oldValue;
        };

        // Если значение поля - массив, то изменяет последний элемент в этом массиве, иначе перезатирает старое значение
        var updateFieldValue = function(oldValue, newValue) {
            if (isArray(oldValue)) {
                if (oldValue.length) { 
                    oldValue[oldValue.length - 1] = newValue;
                }
            } else {
                oldValue = newValue;
            }
            return oldValue;
        };

        // Если значение поля типа entity - массив объектов, то изменяет атрибут у последнего объекта, иначе изменяет атрибут у единственного объекта
        var updateEntityFieldAttr = function(entityFieldValue, attrName, newAttrValue) {
            if (!isString(attrName)) {
                return;
            }

            if (isArray(entityFieldValue)) {
                if (entityFieldValue.length && isObject(entityFieldValue[entityFieldValue.length - 1])) {
                    entityFieldValue[entityFieldValue.length - 1][attrName] = newAttrValue;
                }
            } else {
                if (isObject(entityFieldValue)) {
                    entityFieldValue[attrName] = newAttrValue;
                }
            }
        };

        handler.startElement = function (qName, atts) {
            var ft;

            if (qName === 'entity-select-result') {
                entity = {};
                entityArray.push(entity);
            } else if (qName === 'field') {
                if (entity) {
                    fieldName = null;
                    fieldType = null;
                    for (var i = 0; i < atts.getLength(); i++) {
                        if (atts.getName(i) === 'name') {
                            fieldName = atts.getValue(i);
                            break;
                        }
                    }
                    if (fieldName) {
                        entity[fieldName] = null;
                    }
                }
            } else if (ft = qName.match(/^(entity|string|integer|money|date|timestamp|bool|fixed)-value$/)) {
                if (fieldName && entity) {
                    // Если ранее значение уже записывалось в это поле, то мы имеем дело с массивом
                    if (fieldType && !isArray(entity[fieldName])) {
                        entity[fieldName] = [entity[fieldName]];
                    }

                    fieldType = ft[1];
                    if (fieldType === 'entity') { 
                        entity[fieldName] = addFieldValue(entity[fieldName], {}); 
                        for (var i = 0; i < atts.getLength(); i++) {
                            if (atts.getName(i) === 'kindStrId') {
                                updateEntityFieldAttr(entity[fieldName], 'entityKind', atts.getValue(i));
                            }
                            if (atts.getName(i) === 'scope') {
                                updateEntityFieldAttr(entity[fieldName], '$scope', atts.getValue(i));
                            }
                        }
                    } else if (fieldType === 'string') {
                        entity[fieldName] = addFieldValue(entity[fieldName], '');
                    } else if (fieldType === 'file') {
                        entity[fieldName] = addFieldValue(entity[fieldName], {});
                        fileFieldName = fieldName;
                    } else {
                        entity[fieldName] = addFieldValue(entity[fieldName], null);
                    }
                }
            } else if (qName === 'entity-uuid') {
                isEntityUuid = fieldType && fieldName && entity;
            } else if (fileFieldName) {
                fieldName = localName;
                entity[fileFieldName][fieldName] = null;
            } else {
                fieldType = null;
                isEntityUuid = false;

                if (qName === 'response') {
                    for (var i = 0; i < atts.getLength(); i++) {
                        if (atts.getName(i) === 'code') {
                            var responseCodeValue = parseInt(atts.getValue(i));
                            responseCode = isNaN(responseCodeValue) ? null : responseCodeValue;
                            break;
                        }
                    }
                }

                if (qName === 'diag-message') {
                    diagMessage = '';
                }
            }
        };

        handler.characters = function (data, start, length) {
            if (fieldType && fieldName && entity) {
                var ch = data.substr(start, length);
                if (fieldType === 'entity' && isEntityUuid) {
                    updateEntityFieldAttr(entity[fieldName], 'uuid', ch);
                } else if (fieldType === 'integer') {
                    var value = parseInt(ch);
                    entity[fieldName] = updateFieldValue(entity[fieldName], isNaN(value) ? ch : value); 
                } else if (fieldType === 'money') {
                    var value = parseFloat(ch);
                    entity[fieldName] = updateFieldValue(entity[fieldName], isNaN(value) ? ch : value); 
                } else if (fieldType === 'date' || fieldType === 'timestamp') {
                    var value = Date.parse(ch);
                    if (isNaN(value)) {
                        value = Date.parse(ch.replace(/(\d{4}-\d{2}-\d{2})(\+\d{4})/g, '$1'));
                    }
                    entity[fieldName] = updateFieldValue(entity[fieldName], isNaN(value) ? ch : new Date(value)); 
                } else if (fieldType === 'bool') {
                    entity[fieldName] = updateFieldValue(entity[fieldName], ch.match(/^\s*true\s*$/i) ? true : ch.match(/^\s*(false|0+)\s*$/i) ? false : ch.match(/^\s*$/) ? null : ch); 
                } else if (fileFieldName) {
                    entity[fileFieldName][fieldName] = ch;
                } else {
                    entity[fieldName] = updateFieldValue(entity[fieldName], ch); 
                }
            }

            if (diagMessage === '') {
                diagMessage = data.substr(start, length);
            }
        };


        var parser = new SAXDriver();

        parser.setDocumentHandler(handler);
        parser.setErrorHandler(handler);
        parser.setLexicalHandler(handler);

        parser.parse(xmlStr);// start parsing

        return entityArray;
    };

    var entityArrayByXmlStr = function(s, kindStrId) {
        var entityArray = convertXmlStrToEntityArray(s);

        if (responseCode === 0) {
            //console.log('Сущность "' + kindStrId + '":\t Сформирован массив из ' + entityArray.length + ' элем.'); //за', t2 - t1, 'ms');
        } else {
            //console.warn('Сущность "' + kindStrId + '":\t ' + diagMessage);
        }
        return entityArray;
    };

    var parseResponse = function(xmlResponse) {
        var handler = new xmlHandler();
        var code = null;
        var msg = undefined;
        handler.startElement = function (qName, atts) {
            if (qName === 'response') {
                for (var i = 0; i < atts.getLength(); i++) {
                    if (atts.getName(i) === 'code') {
                        code = atts.getValue(i);
                        break;
                    }
                }
            } else if (qName === 'diag-message') {
                msg = null;
            }            
        };

        handler.characters = function (data, start, length) {
            if (code !== null && msg === null) {
                var ch = data.substr(start, length);
                msg = ch;
            }
        };

        var parser = new SAXDriver();

        parser.setDocumentHandler(handler);
        parser.setErrorHandler(handler);
        parser.setLexicalHandler(handler);

        parser.parse(xmlResponse);

        return { code: code, msg: msg ? msg : ''};
    };

    /* Метод для подключения через умного клиента по указанному способу аутентификации (логопас / короткий код) */
    var connect = function(auth_meth, userName, password, deviceinfo) {
        var result = CleverClient.login(auth_meth, userName, password, deviceinfo);
        result.userUuid = CleverClient.getUserUuid();
        return result;
    };

    /* Метод для отключения через умного клиента */
    var disconnect = function() {
        return CleverClient.logout();
    };

    /* Метод для получения массива сущностей / системных сущностей / структур / кодификаторов по kindStrId и ЯОПУС-выражению */
    var getEntitiesByCondition = function(entityKind, kindStrId, condition, orderBy, position, size, callBack) {
        if (cache[kindStrId + ":" + condition]) {
            return wrapResult(cache[kindStrId + ":" + condition]);
        }
        var obj;
        var response;
        if (isFunction(callBack)) {
            obj = CleverClient.getEntities(entityKind, kindStrId, condition, orderBy, position, size, function(response){
                callBack(entityArrayByXmlStr(response, kindStrId));
            });
        } else {
            response = CleverClient.getEntities(entityKind, kindStrId, condition, orderBy, position, size);
            obj = entityArrayByXmlStr(response, kindStrId);
        }
        if (isReference(kindStrId)) {
            cache[kindStrId + ":" + condition] = obj;
        }
        response = xmlResponseToJson(response);
        response.data = obj;
        return response;
    };

    /* Метод для получения массива сущностей / системных сущностей / структур / кодификаторов по kindStrId */
    var getEntitiesByKindStrId = function(entityKind, kindStrId) {
        return getEntitiesByCondition(entityKind, kindStrId, 'true', 'id desc');
    };

    /* Метод для получения первой удовлетворяющей ЯОПУС-условию сущности / системной сущности / структуры / кодификатора по kindStrId и ЯОПУС-выражению */
    var getEntityByCondition = function(entityKind, kindStrId, condition, orderBy, position, size) {
        var response = getEntitiesByCondition(entityKind, kindStrId, condition, orderBy, position, size);
        if (response.data.length > 0) {
            response.data = response.data[0];
        }
        return response;
    };

    /* Метод для получения экземпляра сущности по uuid */
    var getEntityByUuid = function(entityKind, kindStrId, uuid) {
        return getEntityByCondition(entityKind, kindStrId, 'uuid == "' + uuid + '"');
    };

    /* Метод для получения экземпляра сущности по kindStrId и id */
    var getEntityById = function(entityKind, kindStrId, id) {
        return getEntityByCondition(entityKind, kindStrId, 'id == "' + id + '"', 'id desc');
    };

    /* Метод который получает сущность с полным набором атрибутов, из объекта, содержащего entityKind, kindStrId, uuid.
     * Возвращает новый экземпляр сущности, исходный параметр остается неизменным
     */
    var getExpandedEntity = function(obj) {
        if (isObject(obj)
            && (obj.$scope === 'document' || obj.$scope === 'system' || obj.$scope === 'structure' || obj.$scope === 'codifier') 
            && isString(obj.entityKind)  && isString(obj.uuid)) {

            var entityObj = DAO.getEntityByUuid(obj.$scope, obj.entityKind, obj.uuid);
            if (entityObj) {
                entityObj.$scope = obj.$scope;
                entityObj.entityKind = obj.entityKind;
                return entityObj;
            }
        }
        return obj;
    };

    /* Метод, который подтягивает остальные поля для сущности, которая имеет entityKind, kindStrId, uuid. 
     * Входные параметры: сущность, массив сущностей, несколько аргументов
     */
    var expandEntity = function() {
        for (var i = 0; i < arguments.length; i++) {
            var obj = arguments[i];
            if (isObject(obj)
                && (obj.$scope === 'document' || obj.$scope === 'system' || obj.$scope === 'structure' || obj.$scope === 'codifier') 
                && isString(obj.entityKind)  && isString(obj.uuid)) {

                var entityObj = DAO.getEntityByUuid(obj.$scope, obj.entityKind, obj.uuid);
                for (var prop in entityObj) {
                    obj[prop] = entityObj[prop];
                }
            }
            if (isArray(obj)) {
                for (var j = 0; j < obj.length; j++) {
                    expandEntity(obj[j]);
                }
            }
        }
    };

    var getRetailUser = function() {
        return DAO.getEntityByUuid('system', 'User', CleverClient.getRetailUserUuid());
    };

    /* Метод, который возвращает содержимое тега string-value из xml ответа CleverClient */
    var getStringValueData = function(response) {
        var responseDom = xmlResponseToJson(response);
        return (responseDom && responseDom.data) ? responseDom.data : "";
    };

    /* Добавление нового экземпляра сущности */
    var insert = function(entityKind, kindStrId, object, callBack) {
        var result = parseResponse(CleverClient.insertEntity(entityKind, kindStrId, object, callBack));
        //console.log('Вставка сущности "' + kindStrId + '": (', result.code, ') ' + result.msg + '; ', object);
        return result;
    };

    /* Метод вызова запроса-"пустышки", проверяет протухание сессии при выводе из бэкграунда */
    var invokeEmpty = function() {
        return xmlResponseToJson(CleverClient.invokeEmpty());
    };

    /* Вызов метода неавторизованной зоны */
    var invokeMethod = function(method, args) {
        var methodArgs;
        if (!isArray(args)) {
            methodArgs = [];
            for (var i = 1; i < arguments.length; i++) {
                methodArgs.push(arguments[i]);
            }
        } else {
            methodArgs = args;
        }
        return xmlResponseToJson(CleverClient.invokeMethod(method, methodArgs));
    };

    var invokeMethodAsync = function(method, args) {
        var methodArgs;
        if (!isArray(args)) {
            methodArgs = [];
            for (var i = 1; i < arguments.length; i++) {
                methodArgs.push(arguments[i]);
            }
        } else {
            methodArgs = args;
        }
        return CleverClient.invokeMethod(method, methodArgs, true).then(function(response){
            return xmlResponseToJson(response);
        });
    };

    /* Вызов метода сущности */
    var invokeEntityMethod = function(entityKind, kindStrId, method, entityUuid, args) {
        var methodArgs;
        if (!isArray(args)) {
            methodArgs = [];
            for (var i = 4; i < arguments.length; i++) {
                methodArgs.push(arguments[i]);
            }
        } else {
            methodArgs = args;
        }
        return xmlResponseToJson(CleverClient.invokeEntityMethod(entityKind, kindStrId, method, entityUuid, methodArgs));
    };

    var invokeEntityMethodAsync = function(entityKind, kindStrId, method, entityUuid, args) {
        var methodArgs;
        if (!isArray(args)) {
            methodArgs = [];
            for (var i = 4; i < arguments.length; i++) {
                methodArgs.push(arguments[i]);
            }
        } else {
            methodArgs = args;
        }
        return CleverClient.invokeEntityMethod(entityKind, kindStrId, method, entityUuid, methodArgs, true).then(function(response){
            return xmlResponseToJson(response);
        });
    };

    /* Вызов метода экземпляра текущего пользователя User */
    var invokeUserEntityMethod = function(method, args) {
        var methodArgs;
        if (!isArray(args)) {
            methodArgs = [];
            for (var i = 1; i < arguments.length; i++) {
                methodArgs.push(arguments[i]);
            }
        } else {
            methodArgs = args;
        }
        return invokeEntityMethod('system', 'User', method, CleverClient.getUserUuid(), methodArgs);
    };

    var invokeUserEntityMethodAsync = function(method, args) {
        var methodArgs;
        if (!isArray(args)) {
            methodArgs = [];
            for (var i = 1; i < arguments.length; i++) {
                methodArgs.push(arguments[i]);
            }
        } else {
            methodArgs = args;
        }
        return invokeEntityMethodAsync('system', 'User', method, CleverClient.getUserUuid(), methodArgs);
    };

    /* Вызов метода экземпляра текущего клиента RetailClient */
    var invokeRetailClientEntityMethod = function(method, args) {
        var methodArgs;
        if (!isArray(args)) {
            methodArgs = [];
            for (var i = 1; i < arguments.length; i++) {
                methodArgs.push(arguments[i]);
            }
        } else {
            methodArgs = args;
        }
        return invokeEntityMethod('system', 'RetailClient', method, CleverClient.getRetailClientUuid(), methodArgs);
    };

    var invokeRetailClientEntityMethodAsync = function(method, args) {
        var methodArgs;
        if (!isArray(args)) {
            methodArgs = [];
            for (var i = 1; i < arguments.length; i++) {
                methodArgs.push(arguments[i]);
            }
        } else {
            methodArgs = args;
        }
        return invokeEntityMethodAsync('system', 'RetailClient', method, CleverClient.getRetailClientUuid(), methodArgs);
    };

    var cast = function(strValue, type){
        if (strValue == null || strValue == undefined || !type) {
            return strValue;
        } else if (type.match(/^(float|double|BigDecimal|Money|Fixed)$/i)) {
            var value = parseFloat(strValue.replace(/['\s]?/g, '').replace(',', '.'));
            return isNaN(value) ? strValue : value;
        } else if (type.match(/^(integer|int|BigInteger)$/i)) {
            var value = parseInt(strValue.replace(/['\s]?/g, ''));
            return isNaN(value) ? strValue : value;
        } else if (type.match(/^(date|datetime|timestamp)$/i)) {
            var value;
            if (strValue.match(/^\d{1,2}\.\d{1,2}\.(?:\d{2}|\d{4})$/)) {
                var dateParts = strValue.split('.');
                value = dateParts[1] + '.' + dateParts[0] + '.' + dateParts[2];
            } else {
                // С сервера дата timestamp всегда приходит с часовым поясом без ":", напр. +0300 для Москвы
                // однако, webkit не может ее распарсить.
                // webkit требует, чтобы при указании часового пояса часы и минуты разделялись ":", напр., +03:00 вместо +0300
                value = strValue.replace(/(\+|\-)(\d{2})(\d{2})/, '$1$2:$3');
            }
            return isNaN(Date.parse(value)) ? strValue : new Date(value);
        } else if (type.match(/^(bool|boolean)$/i)) {
            return strValue.match(/^\s*(true|\-?\d*[1-9]+\d*)\s*$/i) ? true : strValue.match(/^\s*(false|0+)\s*$/i) ? false : strValue.match(/^\s*$/) ? null : strValue;
        }
        return strValue;
    };

    /* Конвертирует выписку в формате XML строки в JSON объект */
    var convertExtractInfoXmlToJSON = function (xmlStr) {
        var extractInfo;
        var fieldName;
        var operationInfoList = [];
        var countOperations = 0;
        var inOperationInfoList = false;

        var handler = new xmlHandler();

        handler.startElement = function (qName, atts) {
            fieldName = null;
            if (qName === 'extractInfo') {
                extractInfo = {};
            } else if (qName === 'operationInfoList') {
                inOperationInfoList = true;
            } else if (inOperationInfoList) {
                if (qName === 'operationInfo') {
                    ++countOperations;
                    operationInfoList[countOperations - 1] = {};
                    } else {
                    fieldName = qName;
                    operationInfoList[countOperations - 1][fieldName] = null;
                }
            } else {
                fieldName = qName;
                extractInfo[fieldName] = null;
            }
        };

        handler.endElement = function (name) {
            if (name === 'operationInfoList') {
                inOperationInfoList = false;
            }
        };

        handler.characters = function (data, start, length) {
            if (fieldName) {
                var ch = data.substr(start, length);
                if (inOperationInfoList) {
                    operationInfoList[countOperations - 1][fieldName] = ch;
                } else {
                    extractInfo[fieldName] = ch;
                }
            }
        };

        var parser = new SAXDriver();

        parser.setDocumentHandler(handler);
        parser.setErrorHandler(handler);
        parser.setLexicalHandler(handler);

        parser.parse(xmlStr);

        extractInfo["operationInfoList"] = operationInfoList;

        return extractInfo;
    };

    /* Конвертирует XML строку в JSON объект */
    var xmlToJson = function(xmlStr, rootName) {
        var object = null;
        var currentObject = null;
        var parentObjects = [];
        var fields = [];
        var level = 1;

        var contentHandler = new xmlHandler();

        contentHandler.startElement = function(localName, atts) {
            if ((!rootName || localName === rootName) && !object) {
                currentObject = object = {};
            } else if (object) {
                var ft = null;
                for (var i = 0; i < atts.getLength(); i++) {
                    if (atts.getName(i) === 'type') {
                        ft = atts.getValue(i);
                    }
                }

                fields.push({name: localName, type: ft});

                if (fields.length > level) {

                    var curObjFieldName = fields[fields.length - 2].name;
                    if (currentObject[curObjFieldName] !== null) { //Если значение сохранено ранее, то это массив
                        if (!isArray(currentObject[curObjFieldName])) {
                            // Если массив еще не создан, то создаем и помещаем в него ранее сохраненный элемент
                            currentObject[curObjFieldName] = [currentObject[curObjFieldName]];
                        }

                        var newObj = {};
                        currentObject[curObjFieldName].push(newObj);
                        parentObjects.push(currentObject);
                        currentObject = newObj;
                    } else {
                        // Сохраняем как объект
                        //parentObjects.push(currentObject);
                        //currentObject = currentObject[curObjFieldName] = {};

                        // Сохраняем всегда как массив
                        currentObject[curObjFieldName] = [];
                        var newObj = {};
                        currentObject[curObjFieldName].push(newObj);
                        parentObjects.push(currentObject);
                        currentObject = newObj;
                    }

                } else if (fields.length < level) {
                    for(var i = fields.length; i < level; i++) {
                        currentObject = parentObjects.pop();
                    }
                }

                if (!(localName in currentObject)) { // Чтобы избавиться от значений undefined
                    currentObject[localName] = null;
                }

                level = fields.length;
            }
        };

        contentHandler.endElement = function(localName) {
            if (object) {
                fields.pop();
            }
        };

        contentHandler.characters = function(data, start, length) {
            var ch = data.substr(start, length);
            if (currentObject && fields.length) {
                var fieldType = fields[fields.length - 1].type;
                var value = cast(ch, fieldType);

                var fieldName = fields[fields.length - 1].name;
                currentObject[fieldName] = value;
            }
        };

        var parser = new SAXDriver();

        parser.setDocumentHandler(contentHandler);
        parser.setErrorHandler(contentHandler);
        parser.setLexicalHandler(contentHandler);

        parser.parse(xmlStr);

        return object;
    };

    /**
     * Метод используется для парсинга результата выполнения метода, который возвращается Клевер-клиентом
     * @param xmlStrResponse
     * @returns JSON-объект response. Поле data содержит результат метода сущности
     */
    var xmlResponseToJson = function(xmlStrResponse) {
        var response = null;
        var parentObjects = [];

        var getAttValue = function(atts, attsName){
            for (var i = 0; i < atts.getLength(); i++) {
                if (atts.getName(i) === attsName) {
                    return atts.getValue(i);
                }
            }
            return null;
        };

        var pushFieldValue = function(obj, prop, newValue) {
            if (obj[prop]) {
                if (!isArray(obj[prop])) {
                    obj[prop] = [obj[prop]];
                }
                obj[prop].push(newValue);
            } else {
                obj[prop] = newValue;
            }
        };

        var contentHandler = new xmlHandler();

        contentHandler.startElement = function (qName, atts) {

            if (!response) {
                if (qName === 'response') {
                    response = {};
                    response.id = cast(getAttValue(atts, 'id'), 'integer');
                    response.serverSessionId = getAttValue(atts, 'serverSessionId');
                    response.clientSessionId = getAttValue(atts, 'clientSessionId');
                    response.duration = cast(getAttValue(atts, 'duration'), 'integer');
                    response.code = cast(getAttValue(atts, 'code'), 'integer');
                    response.data = undefined;
                    response.ownerEntity = {};
                    parentObjects.push({fieldOwner: response, fieldName: null, fieldType: null});
                }
            } else {
                var parentField = parentObjects[parentObjects.length - 1];
                var newObj = null;
                var newFieldName = null;
                var newFieldType = null;

                if (qName === 'login-result') {
                    response.loginResult = {};
                } else if (qName === 'challenge') {
                    response.loginResult.challenge = getAttValue(atts, 'strId');
                } else if (qName === 'parameter') {
                    response.loginResult.parameter = getAttValue(atts, 'name');
                }
                if (qName === 'entity-method-result') {
                    response.ownerEntity.entityKind = getAttValue(atts, 'kindStrId');
                    response.ownerEntity.$scope = getAttValue(atts, 'scope');
                    /*
                     * Если элемент entity-method-result присутствует,
                     * значит запрос выполнен успешно - изменяем undefined на null для response.data
                     * Если серверный метод возвращает null (без ошибок), то response.data тоже должна содержать null
                     */
                    response.data = null;
                } else if (qName === 'entity-uuid' && parentField.fieldOwner === response) {
                    newObj = response.ownerEntity;
                    newFieldName = 'uuid';
                } else if (qName === 'diag-message') {
                    newFieldName = 'msg';
                } else if (qName === 'retval') {
                    newFieldName = 'data';
                    parentField.fieldOwner[newFieldName] = null;
                } else if (qName === 'entity-uuid') {
                    newFieldName = 'uuid';
                } else if (qName === 'field') {
                    newFieldName = getAttValue(atts, 'name');
                    newFieldType = getAttValue(atts, 'type');
                    parentField.fieldOwner[newFieldName] = null;
                } else if (qName === 'name' && parentField.fieldType === 'file') {
                    newFieldName = 'name';
                    parentField.fieldOwner[newFieldName] = null;
                } else if (qName === 'last-modified' && parentField.fieldType === 'file') {
                    newFieldName = 'lastModified';
                    newFieldType = 'timestamp';
                    parentField.fieldOwner[newFieldName] = null;
                } else if (qName === 'data' && parentField.fieldType === 'file') {
                    newFieldName = 'data';
                    parentField.fieldOwner[newFieldName] = null;
                } else if (qName.match(/^(string|integer|money|fixed|date|timestamp|bool)-value$/)) {
                    newFieldName = parentField.fieldName;
                    newFieldType = parentField.fieldType;
                } else if (qName === 'file-value' || qName === 'entity-value') {
                    newObj = {};
                    newFieldType = parentField.fieldType;

                    if (qName === 'entity-value') {
                        newObj.entityKind = getAttValue(atts, 'kindStrId');
                        newObj.$scope = getAttValue(atts, 'scope');
                    }

                    if (parentField.fieldName) {
                        pushFieldValue(parentField.fieldOwner, parentField.fieldName, newObj);
                    } else {
                        pushFieldValue(parentField, 'fieldOwner', newObj);
                    }
                }

                if (newObj) {
                    parentObjects.push({fieldOwner: newObj, fieldName: newFieldName, fieldType: newFieldType});
                } else {
                    parentObjects.push({fieldOwner: parentField.fieldOwner, fieldName: newFieldName, fieldType: newFieldType});
                }
            }
        };

        contentHandler.endElement = function(name) {
            parentObjects.pop();
        };

        contentHandler.characters = function (data, start, length) {
            if (parentObjects && parentObjects.length && parentObjects[parentObjects.length - 1].fieldName) {
                var parentField =  parentObjects[parentObjects.length - 1];
                var ch = data.substr(start, length);
                var value = cast(ch, parentField.fieldType);
                if (parentField.fieldOwner[parentField.fieldName] == null || parentField.fieldOwner[parentField.fieldName] == undefined) {
                    parentField.fieldOwner[parentField.fieldName] = value;
                } else {
                    if (!isArray(parentField.fieldOwner[parentField.fieldName])) {
                        parentField.fieldOwner[parentField.fieldName] = [parentField.fieldOwner[parentField.fieldName]];
                    }
                    parentField.fieldOwner[parentField.fieldName].push(value);
                }
            }
        };

        var parser = new SAXDriver();

        parser.setDocumentHandler(contentHandler);
        parser.setErrorHandler(contentHandler);
        parser.setLexicalHandler(contentHandler);

        parser.parse(xmlStrResponse);

        return response;
    };

    var objectToArray = function(obj){
        if (!isArray(obj)) {
            obj = [obj];
        }
        return obj;
    };


    var propValueToArray = function(obj, prop){
        if (obj[prop] && !isArray(obj[prop])) {
            obj[prop] = [obj[prop]];
        }
        return obj[prop];
    };

    /**
     * Обернуть данные в объект ответа (данные из кэша)
     * @param data
     */
    var wrapResult = function(data) {
        var result = {};
        result.code = 0;
        result.data = data;
        result.msg = 'Запрос выполнен успешно';
        return result;
    };

    /* Для ответов от сервера, содержащих json строку в data */
    var parseDataJson = function(response){
        if (!response.code && response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    // Public members
    return {
        connect: connect,
        disconnect: disconnect,

        getEntityById: getEntityById,
        getEntityByUuid: getEntityByUuid,
        getEntityByCondition: getEntityByCondition,
        getEntitiesByKindStrId: getEntitiesByKindStrId,
        getEntitiesByCondition: getEntitiesByCondition,

        getExpandedEntity: getExpandedEntity,
        expandEntity: expandEntity,
        getRetailUser: getRetailUser,
        getStringValueData: getStringValueData,
        insert: insert,
        invokeEmpty: invokeEmpty,
        invokeMethod: invokeMethod,
        invokeMethodAsync: invokeMethodAsync,
        invokeEntityMethod: invokeEntityMethod,
        invokeEntityMethodAsync: invokeEntityMethodAsync,
        invokeUserEntityMethod: invokeUserEntityMethod,
        invokeUserEntityMethodAsync: invokeUserEntityMethodAsync,
        invokeRetailClientEntityMethod: invokeRetailClientEntityMethod,
        invokeRetailClientEntityMethodAsync: invokeRetailClientEntityMethodAsync,
        convertXmlStrToEntityArray: convertXmlStrToEntityArray,
        entityArrayByXmlStr: entityArrayByXmlStr,
        isString: isString,
        isObject: isObject,
        isArray: isArray,
        isFunction: isFunction,
        isPromise: isPromise,
        getJsType: getJsType,
        convertExtractInfoXmlToJSON: convertExtractInfoXmlToJSON,
        xmlToJson: xmlToJson,
        parseResponse: parseResponse,
        parseDataJson: parseDataJson,
        xmlResponseToJson: xmlResponseToJson,
        objectToArray: objectToArray,
        propValueToArray: propValueToArray,
        wrapResult: wrapResult
    };

})(CleverClient);