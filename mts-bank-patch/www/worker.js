if (!self.console) {
    self.console = {
        log: function(message) {
            self.postMessage({
                isDebug: true,
                type: 'log',
                message: message
            });
        },
        warn: function(message) {
            self.postMessage({
                isDebug: true,
                type: 'warn',
                message: message
            });
        },
        error: function(message) {
            self.postMessage({
                isDebug: true,
                type: 'error',
                message: message
            });
        }
    };
}

importScripts(
    'lib/jsXMLParser/xmldom.js',
    'lib/DefaultHandler.js',
    'lib/jsXMLParser/xmlsax.js',
    'js/date-formatter.js',
    'js/Config.js',
    'js/crypto_utils.js',
    'js/convert.js',
    'js/CleverClient.js',
    'js/DAO.js',
    'js/system/DAOHelper.js',
    'js/system/DAORetailClientService.js',
    'js/system/DAOBankCardService.js',
    'js/system/DAORetailLoanService.js',
    'js/system/DAORetailAccountService.js',
    'js/system/DAORetailDepositService.js',
    'js/system/DAORetailProductService.js',
    'js/system/DAOPaymentService.js',
    'js/system/DAOInfoServices.js',
    'js/system/DAOLoyaltyService.js',
    'js/system/DAOService.js'
);

self.onmessage = function (event) {
    var errText = '';
    try {
        if (!DAO.isObject(event.data)) {
            throw new Error('Для worker.postMessage() требуется объект. Передано: ' + DAO.getJsType(event.data));
        }

        if (!DAOService) {
            throw new Error('Модуль DAOService не подключен');
        }

        var cmd = event.data.cmd;
        var cmdInfo = event.data.cmdInfo;
        var args = event.data.args;

        if (!DAO.isFunction(DAOService[cmd])) {
            var msgText = 'Метод ' + (DAO.isString(cmd) ? '"' + cmd + '"' : '<' + DAO.getJsType(cmd) + '>') + ' не задан в модуле DAOService';
            throw new Error(msgText);
        }
        var methodName = (cmd.indexOf('invoke') != -1) ? args[0] : cmd; // если вызываем invoke, то реальное название метода лежит в args[0]
        errText = (DAO.isString(cmd) ? 'Метод "' + methodName + '" возвращает ошибку: ' : '');

        var result = DAOService[cmd].apply(this, args);

        var postResult = function(result){
            // Если ошибка происходит в серверном методе, то выдаем только варнинг
            if (result && result.code) {
                console.warn(errText + result.msg);
            }

            self.postMessage({
                cmd: cmd,
                cmdInfo: cmdInfo,
                result: result
            });
        };

        if (DAO.isPromise(result)) {
            result.then(function(result){
                postResult(result);
            });
        } else {
            postResult(result);
        }

    } catch (e) {
        if (errText) {
            console.error(errText, e);
        } else {
            console.error(e);
        }

        self.postMessage({
            cmd: cmd,
            cmdInfo: cmdInfo,
            result: {
                code: 1000,  // ошибка при манипуляции полученными данными на клиенте
                msg: errText + e.message
            }
        });
    }
};

