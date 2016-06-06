/*
 * Регистрация фильтров для модуля app
 */
(function () {
    var app = angular.module('app');

    /**
     * Заменитель английских наименований месяцев на русские
     * @param input
     * @returns {*}
     */
    var replaceMonth = function(input) {
        input = input.replace('January', 'января');
        input = input.replace('February', 'февраля');
        input = input.replace('March', 'марта');
        input = input.replace('April', 'апреля');
        input = input.replace('May', 'мая');
        input = input.replace('June', 'июня');
        input = input.replace('July', 'июля');
        input = input.replace('August', 'августа');
        input = input.replace('September', 'сентября');
        input = input.replace('October', 'октября');
        input = input.replace('November', 'ноября');
        input = input.replace('December', 'декабря');
        return input;
    };

    app.filter('capitalize', ['$filter', function($filter) {
        return function(input) {
            if (angular.isString(input)) {
                var matchRes = input.match(/^(\s*)([А-ЯЁ\w])(.*)$/i);
                if (matchRes && matchRes.length > 3) {
                    return matchRes[1] + matchRes[2].toUpperCase() + matchRes[3];
                }
            }
            return input;
        };
    }]);

    app.filter('orderByProperty', ['$filter', function($filter) {
        return function(input, props) {
            if (!angular.isArray(input)) { return input; }

            var nestedProps = props.split(/\s*\.\s*|\s*\[\s*|\s*\]\s*\.\s*|\s*\]\s*/);
            input.sort(function (a, b) {
                for(var i = 0; (i < nestedProps.length) && (nestedProps[i] !== ''); i++){
                    a = a[nestedProps[i]];
                    b = b[nestedProps[i]];
                }

                return b - a;
            });

            return input;
        }
    }]);

    /**
     * Параметры для фильтрации обязательно оборачивать в массив []
     * Отдельные объекты проверяются на 'ИЛИ': {param1,true}, {param2:false}                        param1 && param2
     * Внутри одного объекта параметры проверяются на 'И': {param1:true, param2:false}              param1 || param2
     * Для более глубоких параметров необходимо задавать в '' через точку: {'param1.param2':true}
     */
    app.filter('objectArrayFilter', ['$filter', function($filter) {
        var selector = function(arrayOfCriteria){
            return function(item) {
                var result = false;
                for (var i = 0; angular.isArray(arrayOfCriteria) && i < arrayOfCriteria.length; i++) {
                    var innerResult = true;
                    for (var prop in arrayOfCriteria[i]) {
                        var props = prop.split('.');
                        var propResult = item[props[0]];
                        for (var j = 1; j < props.length; j++) {
                            propResult = propResult[props[j]];
                        }
                        innerResult &= (propResult === arrayOfCriteria[i][prop]);
                        if (!innerResult) { break; }
                    }
                    result |= innerResult;
                    if (result) { break; }
                }
                return result;
            };
        };

        return function(input, params) {
            return $filter('filter')(input, selector(params));
        };
    }]);

    /**
     * Фильтр для списка видимых продуктов (не под катом) в моих финансах
     */
    app.filter('visibleProducts', ['$filter', function($filter) {
        return function(input) {
            return $filter('objectArrayFilter')(input, [{isFavourite: true, isClosed: false}]);
        };
    }]);

    /**
     * Фильтр для списка продуктов, скрываемых под катом в моих финансах
     */
    app.filter('hiddenProducts', ['$filter', function($filter) {
        return function(input) {
            return $filter('objectArrayFilter')(input, [{isFavourite: false}, {isClosed: true}]);
        };
    }]);

    /**
     * Фильтр для списка продуктов, кот. можно использовать для платежей (не под катом)
     */
    app.filter('visibleForPayments', ['$filter', function($filter) {
        return function(input) {
            return $filter('objectArrayFilter')(input, [{disabled: false}]);
        };
    }]);

    /**
     * Фильтр для списка продуктов (под катом), кот. не нужно использовать для платежей
     */
    app.filter('hiddenForPayments', ['$filter', function($filter) {
        return function(input) {
            return $filter('objectArrayFilter')(input, [{disabled: true}]);
        };
    }]);

    /**
     * Форматтер для дат с переводом в GMT+0300 (Московское время)
     * Переопределяет стандартный фильтр date, дополнительный параметр - timezone UTC/GMT строка ('+0300')
     * TODO: При обновлении Angular до текущей версии нужно удалить.
     */
    app.filter('date', ['$filter', '$locale', function($filter, $locale) {
        function padNumber(num, digits, trim) {
            var neg = '';
            if (num < 0) {
                neg =  '-';
                num = -num;
            }
            num = '' + num;
            while (num.length < digits) num = '0' + num;
            if (trim) {
                num = num.substr(num.length - digits);
            }
            return neg + num;
        }


        function dateGetter(name, size, offset, trim) {
            offset = offset || 0;
            return function(date) {
                var value = date['get' + name]();
                if (offset > 0 || value > -offset) {
                    value += offset;
                }
                if (value === 0 && offset == -12) value = 12;
                return padNumber(value, size, trim);
            };
        }

        function dateStrGetter(name, shortForm) {
            return function(date, formats) {
                var value = date['get' + name]();
                var get = angular.uppercase(shortForm ? ('SHORT' + name) : name);

                return formats[get][value];
            };
        }

        function timeZoneGetter(date, formats, offset) {
            var zone = -1 * offset;
            var paddedZone = (zone >= 0) ? "+" : "";

            paddedZone += padNumber(Math[zone > 0 ? 'floor' : 'ceil'](zone / 60), 2) +
            padNumber(Math.abs(zone % 60), 2);

            return paddedZone;
        }

        function getFirstThursdayOfYear(year) {
            // 0 = index of January
            var dayOfWeekOnFirst = (new Date(year, 0, 1)).getDay();
            // 4 = index of Thursday (+1 to account for 1st = 5)
            // 11 = index of *next* Thursday (+1 account for 1st = 12)
            return new Date(year, 0, ((dayOfWeekOnFirst <= 4) ? 5 : 12) - dayOfWeekOnFirst);
        }

        function getThursdayThisWeek(datetime) {
            return new Date(datetime.getFullYear(), datetime.getMonth(),
                // 4 = index of Thursday
                datetime.getDate() + (4 - datetime.getDay()));
        }

        function weekGetter(size) {
            return function(date) {
                var firstThurs = getFirstThursdayOfYear(date.getFullYear()),
                    thisThurs = getThursdayThisWeek(date);

                var diff = +thisThurs - +firstThurs,
                    result = 1 + Math.round(diff / 6.048e8); // 6.048e8 ms per week

                return padNumber(result, size);
            };
        }

        function ampmGetter(date, formats) {
            return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1];
        }

        function eraGetter(date, formats) {
            return date.getFullYear() <= 0 ? formats.ERAS[0] : formats.ERAS[1];
        }

        function longEraGetter(date, formats) {
            return date.getFullYear() <= 0 ? formats.ERANAMES[0] : formats.ERANAMES[1];
        }

        function toInt(str) {
            return parseInt(str, 10);
        }

        var DATE_FORMATS = {
            yyyy: dateGetter('FullYear', 4),
            yy: dateGetter('FullYear', 2, 0, true),
            y: dateGetter('FullYear', 1),
            MMMM: dateStrGetter('Month'),
            MMM: dateStrGetter('Month', true),
            MM: dateGetter('Month', 2, 1),
            M: dateGetter('Month', 1, 1),
            dd: dateGetter('Date', 2),
            d: dateGetter('Date', 1),
            HH: dateGetter('Hours', 2),
            H: dateGetter('Hours', 1),
            hh: dateGetter('Hours', 2, -12),
            h: dateGetter('Hours', 1, -12),
            mm: dateGetter('Minutes', 2),
            m: dateGetter('Minutes', 1),
            ss: dateGetter('Seconds', 2),
            s: dateGetter('Seconds', 1),
            // while ISO 8601 requires fractions to be prefixed with `.` or `,`
            // we can be just safely rely on using `sss` since we currently don't support single or two digit fractions
            sss: dateGetter('Milliseconds', 3),
            EEEE: dateStrGetter('Day'),
            EEE: dateStrGetter('Day', true),
            a: ampmGetter,
            Z: timeZoneGetter,
            ww: weekGetter(2),
            w: weekGetter(1),
            G: eraGetter,
            GG: eraGetter,
            GGG: eraGetter,
            GGGG: longEraGetter
        };

        var DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZEwG']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z|G+|w+))(.*)/,
            NUMBER_STRING = /^\-?\d+$/;

        var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
                            // 1        2       3         4          5          6          7          8  9     10      11
        function jsonStringToDate(string) {
            var match;
            if (match = string.match(R_ISO8601_STR)) {
                var date = new Date(0),
                    tzHour = 0,
                    tzMin  = 0,
                    dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear,
                    timeSetter = match[8] ? date.setUTCHours : date.setHours;

                if (match[9]) {
                    tzHour = toInt(match[9] + match[10]);
                    tzMin = toInt(match[9] + match[11]);
                }
                dateSetter.call(date, toInt(match[1]), toInt(match[2]) - 1, toInt(match[3]));
                var h = toInt(match[4] || 0) - tzHour;
                var m = toInt(match[5] || 0) - tzMin;
                var s = toInt(match[6] || 0);
                var ms = Math.round(parseFloat('0.' + (match[7] || 0)) * 1000);
                timeSetter.call(date, h, m, s, ms);
                return date;
            }
            return string;
        }

        function timezoneToOffset(timezone, fallback) {
            var requestedTimezoneOffset = Date.parse('Jan 01, 1970 00:00:00 ' + timezone) / 60000;
            return isNaN(requestedTimezoneOffset) ? fallback : requestedTimezoneOffset;
        }


        function addDateMinutes(date, minutes) {
            date = new Date(date.getTime());
            date.setMinutes(date.getMinutes() + minutes);
            return date;
        }


        function convertTimezoneToLocal(date, timezone, reverse) {
            reverse = reverse ? -1 : 1;
            var timezoneOffset = timezoneToOffset(timezone, date.getTimezoneOffset());
            return addDateMinutes(date, reverse * (timezoneOffset - date.getTimezoneOffset()));
        }

        function concat(array1, array2, index) {
            return array1.concat(slice.call(array2, index));
        }

        slice = [].slice;

        return function(date, format, timezone) {
            var text = '',
                parts = [],
                fn, match;

            format = format || 'mediumDate';
            format = $locale.DATETIME_FORMATS[format] || format;
            if (isString(date)) {
                date = NUMBER_STRING.test(date) ? toInt(date) : jsonStringToDate(date);
            }

            if (angular.isNumber(date)) {
                date = new Date(date);
            }

            if (!angular.isDate(date) || !isFinite(date.getTime())) {
                return date;
            }

            while (format) {
                match = DATE_FORMATS_SPLIT.exec(format);
                if (match) {
                    parts = concat(parts, match, 1);
                    format = parts.pop();
                } else {
                    parts.push(format);
                    format = null;
                }
            }

            var dateTimezoneOffset = date.getTimezoneOffset();
            if (timezone) {
                dateTimezoneOffset = timezoneToOffset(timezone, date.getTimezoneOffset());
                date = convertTimezoneToLocal(date, timezone, true);
            }
            angular.forEach(parts, function(value) {
                fn = DATE_FORMATS[value];
                text += fn ? fn(date, $locale.DATETIME_FORMATS, dateTimezoneOffset)
                    : value.replace(/(^'|'$)/g, '').replace(/''/g, "'");
            });

            return text;
        };
    }]);


    /**
     * Дефолтный форматер для дат. Использование: {{myDate | defaultDate}}
     */
    app.filter('defaultDate', ['$filter', function($filter) {
        return function(input) {
            if (angular.isDate(input) && !isNaN(input.getTime())) {
                return $filter('date')(input, 'dd.MM.yyyy', '+0300');
            } else if (!isNaN(new Date(input).getTime())) {
                return $filter('date')(new Date(input), 'dd.MM.yyyy', '+0300');
            } else if (/^\d{2}-\d{2}-\d{2}.*$/.test(input)) {
                return $filter('date')(input.substring(0, 8), 'dd.MM.yyyy', '+0300');
            } else if (/^\d{4}-\d{2}-\d{2}.*$/.test(input)) {
                return $filter('date')(input.substring(0, 10), 'dd.MM.yyyy', '+0300');
            } else {
                return input;
            }
        };
    }]);

    app.filter('dbDate', ['$filter', function($filter) {
        return function(input) {
            return $filter('date')(input, 'yyyy-MM-dd', '+0300');
        }
    }]);

    function dateParser(key, value) {
        var a;
        if (typeof value === 'string') {
            a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/.exec(value);
            if (a) {
                return new Date(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]);
            }
        }
        return value;
    }

    app.filter('time', ['$filter', 'utils', function($filter, utils) {
        return function(input) {
            if (angular.isDate(input)) {
                return $filter('date')(input, 'HH:mm', '+0300');
            } else if (angular.isDate(new Date(input)) && !isNaN(Date.parse(input))) {
                return $filter('date')(new Date(input), 'HH:mm', '+0300');
            } else if (/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/.exec(input)) { // Строка в формате yyyy-MM-ddTHH:mm:ss.SSSZ
                return $filter('date')(utils.dateParser(input), 'HH:mm');
            } else {
                return input;
            }
        };
    }]);

    /**
     * Дефолтный форматер для дат. Использование: {{myDate | defaultDate}}
     */
    app.filter('dateWithMonthName', ['$filter', function($filter) {
        return function(input) {
            input = $filter('date')(input, 'dd MMMM yyyy', '+0300');
            return replaceMonth(input);
        };
    }]);

    /**
     * Форматер дат операций (вид: 22 июня, сегодня / вчера). Использование: {{myDate | dateOperation}}
     * примеры: 11 июля, сегодня
     *          10 июля, вчера
     *          9 июля
     */
    app.filter('dateOperation', ['$filter', function($filter) {
        return function(input) {
            if (!input) {
                return '';
            }
            input = $filter('date')(input, 'dd MMMM', '+0300');
            input = replaceMonth(input);
            var date = new Date(input);
            var now = new Date();
            now = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if ((now.valueOf() - date.valueOf() > 0) && (now.valueOf() - date.valueOf() < 86400000)) { // 24*60*60*1000
                input += ", вчера";
            }
            if (date.valueOf() == now.valueOf()) {
                input += ", сегодня";
            }
            return input;
        };
    }]);

    /**
     * Дефолтный форматер для дат с указанием времени. Использование: {{myDate | defaultDateTime}}
     */
    app.filter('defaultDateTime', ['$filter', function($filter) {
        return function(input) {
            return $filter('date')(input, 'dd.MM.yyyy HH:mm', '+0300');
        };
    }]);

    /**
     * Формат номера счета. Использование: {{myAccountNumber | accountNumber}}
     * Формат отображения «ХХХХХХХХХ…ХХХХ», где Х – это цифра от 0 до 9.
     */
    app.filter('accountNumber', ['$filter', function($filter) {
        return function(input, beginLength, endLength) {
            if (input.length < 20) {
                return input;
            }
            beginLength = angular.isDefined(beginLength) && !isNaN(parseInt(beginLength)) ? parseInt(beginLength) : 9;
            return input.substring(0, beginLength) + "..." + input.substring(16);
        };
    }]);

    /**
     * Формат суммы:
     * значения должны быть разделены на разряды
     * копейки отделяться запятой
     * если копейки отсутствуют (00 копеек), то копейки не должны указываться
     * если копейки присутствуют, то должно отображаться два символа после запятой
     *
     * На входе - float число
     *
     * Использование: {{mySum| defaultSum}}
     */
    app.filter('defaultSum', ['utils', function(utils) {
        return function(input, zeroForEmpty) {
            var floatValue = parseFloat(input);

            if (isNaN(floatValue)) {
                if (input) {
                    return input;
                } else {
                    if (angular.isUndefined(zeroForEmpty) || zeroForEmpty) {
                        return 0;
                    } else {
                        return '';
                    }

                }
            }

            var fixed = floatValue.toFixed(2);
            var split = fixed.split('.');
            var intPart = split[0];
            var fractionPart = split[1];
            intPart = intPart.replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
            if (fractionPart === '00') {
                return intPart;
            }
            return intPart + ',' + fractionPart;
        };
    }]);

    /**
     * Регистронезависимый поиск операции по наименованию, категории и сумме (transactionSum)
     */
    app.filter('searchOperation', ['$filter', function($filter) {
        var searchText = '';
        var sign = '';
        var checkOperation = function(operation) {
            var result = true;
            if (searchText) {
                result = operation.operationName.toLowerCase().indexOf(searchText) !== -1
                    || (operation.category && operation.category.toLowerCase().indexOf(searchText) !== -1)   // у онлайн платежей пока нет категории!
                    || (operation.transactionSum && $filter('defaultSum')(operation.transactionSum).indexOf(searchText) !== -1);
            }
            if (sign) {
                result = result && operation.sign === sign;
            }
            return result;
        };

        return function(input, _searchText) {
            var tmp = _searchText || {};
            searchText = tmp.name ? tmp.name.toLowerCase() : tmp.name;
            sign = tmp.sign;
            return $filter('filter')(input, checkOperation);
        };
    }]);

    /**
     * Преобразование паспорта в строку
     */
    app.filter('passport', ['$filter', function($filter) {
        return function(passport) {
            return passport.series + ' ' + passport.number + ', Выдан ' + passport.organization + ' ' + $filter('defaultDate')(passport.deliveryDate);
        };
    }]);

    /**
     * Преобразование адреса в строку вида: 160029, Вологодская обл., Вологодский р-н, г. Вологда, ул. Петина, д. 1, кв. 1
     */
    app.filter('address', [function() {
        return function(address) {
            var result = '';
            if (address.index) result += address.index + ', ';
            if (address.region) result += address.region + ', ';
            if (address.area) result += address.area + ', ';
            if (address.city) result += address.city + ', ';
            if (address.locality) result += address.locality + ', ';
            if (address.street) result += address.street + ', ';
            if (address.house) result += 'д. ' + address.house + ', ';
            if (address.struct) result += 'корп. ' + address.struct + ', ';
            if (address.build) result += 'стр. ' + address.build + ', ';
            if (address.flat) result += 'кв. ' + address.flat + ', ';
            result.slice(0, -2);
            return result;
        };
    }]);

    /**
     * Преобразование лицевого счёта типа "ФСПП" в строку вида: Фамилия, Имя, Дата рождения
     */
    app.filter('accountFSPP', [function() {
        return function(accountFSPP) {
            return accountFSPP.LAST_NAME_FEDERAL_BAILIFF_SERVICE + ' '
                + accountFSPP.FIRST_NAME_FEDERAL_BAILIFF_SERVICE + ' '
                + accountFSPP.BIRTHDAY_FEDERAL_BAILIFF_SERVICE;
        };
    }]);

    /**
     * Преобразование лицевого счёта типа "Штраф ГИБДД" в строку вида: номер ВУ и ТС, либо номер ВУ, либо номер ТС
     */
    app.filter('accountFine', [function() {
        return function(accountFine) {
            if (accountFine.NUMBER_VEHICLE_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL
                    && accountFine.DRIVER_DOC_NUMBER_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL) {
                return accountFine.NUMBER_VEHICLE_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL
                    + ' ' + accountFine.DRIVER_DOC_NUMBER_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL;
            } else if (accountFine.NUMBER_VEHICLE_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL) {
                return accountFine.NUMBER_VEHICLE_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL;
            } else if (accountFine.DRIVER_DOC_NUMBER_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL) {
                return accountFine.DRIVER_DOC_NUMBER_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL;
            }
        };
    }]);

    /**
     * Фильтрация пустых строк (на null проверка не требуется)
     */
    app.filter('isNotEmpty', ['$filter', function($filter) {
        var field = '';
        var checkString = function(object) {
            return object[field] != '';
        };

        return function(input, param) {
            field = param;
            return $filter('filter')(input, checkString);
        };
    }]);

    /**
    * Фильтрация персональных счетов. Лицевые счета.
    */
    app.filter('personalAccounts', ['$filter', function($filter) {
        var field = 'type';
        var checkString = function(object) {
            switch(object[field]) {
                case 'DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL':
                    /* FALLS THROUGH */
                case 'FEDERAL_BAILIFF_SERVICE':
                    return false;
            }
            return true;
        };

        return function(input) {
            return $filter('filter')(input, checkString);
        };
    }]);

    /**
     * Фильтрация персональных счетов. Счета начислений и штрафов.
     */
    app.filter('chargesAndFinesAccounts', ['$filter', function($filter) {
        var field = 'type';
        var checkString = function(object) {
            switch(object[field]) {
                case 'DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL':
                /* FALLS THROUGH */
                case 'FEDERAL_BAILIFF_SERVICE':
                /* FALLS THROUGH */
                case 'INN':
                    return true;
            }
            return false;
        };

        return function(input) {
            return $filter('filter')(input, checkString);
        };
    }]);

    /**
     * Фильтрация элементов с уникальными значениями заданного поля, для отсеивания дубляжей
     * Код взят из angular-ui.js, фильтр unique
     * Именован rsUnique, чтобы не было конфликтов при необходимости подключения angular-ui.js
     */
    app.filter('rsUnique', function () {

        return function (items, filterOn) {

            if (filterOn === false) {
                return items;
            }

            if ((filterOn || angular.isUndefined(filterOn)) && angular.isArray(items)) {
                var hashCheck = {}, newItems = [];

                var extractValueToCompare = function (item) {
                    if (angular.isObject(item) && angular.isString(filterOn)) {
                        return item[filterOn];
                    } else {
                        return item;
                    }
                };

                angular.forEach(items, function (item) {
                    var valueToCheck, isDuplicate = false;

                    for (var i = 0; i < newItems.length; i++) {
                        if (angular.equals(extractValueToCompare(newItems[i]), extractValueToCompare(item))) {
                            isDuplicate = true;
                            break;
                        }
                    }
                    if (!isDuplicate) {
                        newItems.push(item);
                    }
                });
                items = newItems;
            }
            return items;
        };
    });

    /**
     * Представление элемента адреса в списке выбора в зависимости от типа запроса
     */
    app.filter('addressElement', [function() {
        return function(addressElement, type) {
            var result = '';
            switch(type) {
                case 'index':
                    result += addressElement.region ? addressElement.region + ', ' : '';
                    result += addressElement.area ? addressElement.area + ', ' : '';
                    result += addressElement.city ? addressElement.city + ', ' : '';
                    result += addressElement.locality ? addressElement.locality + ', ' : '';
                    result += addressElement.street ? addressElement.street + ', ' : '';
                    break;
                case 'street':
                    result += addressElement.region ? addressElement.region + ', ' : '';
                    result += addressElement.area ? addressElement.area + ', ' : '';
                    result += addressElement.city ? addressElement.city + ', ' : '';
                    result += addressElement.locality ? addressElement.locality + ', ' : '';
                    break;
                case 'locality':
                    result += addressElement.region ? addressElement.region + ', ' : '';
                    result += addressElement.area ? addressElement.area + ', ' : '';
                    result += addressElement.city ? addressElement.city + ', ' : '';
                    break;
                case 'city':
                    result += addressElement.region ? addressElement.region + ', ' : '';
                    result += addressElement.area ? addressElement.area + ', ' : '';
                    break;
                case 'area':
                    result += addressElement.region ? addressElement.region + ', ' : '';
                    break;
            }
            result = result.slice(0, -2);
            return result;
        };
    }]);

    /**
     * Преобразование способа подтверждения в читаемую форму
     */
    app.filter('confirmation', ['$filter', function($filter) {
        return function(input) {
            if (input && input !== '') {
                return input === 'SMS' ? 'Смс-коды' : 'Кодовая дата';
            }
            return null;
        };
    }]);

    /**
     * Маскировка смс/кодовой даты
     */
    app.filter('maskedCode', [function() {
        return function(input) {
            if (!input) {
                return '';
            }
            var result = '',
                symbol = '●';//•
            var maskCode = input.replace(/\d/g, symbol);
            if (maskCode.length > 4)
                maskCode = maskCode.slice(0, 2) + '—' + maskCode.slice(2, 4) + '—' + maskCode.slice(4);
            else if (maskCode.length > 2) {
                maskCode = maskCode.slice(0, 2) + '—' + maskCode.slice(2);
            }
            result = maskCode;
            return result;
        };
    }]);

    /**
     * ФИО клиента с учётом отсутствия отчества
     */
    app.filter('clientFIO', [function() {
        return function(client) {
            return client && (client.clientSurname + ' ' + client.clientName + (client.clientSecondName ? (' ' + client.clientSecondName) : ''));
        };
    }]);

    /**
     * НЕ ИСПОЛЬЗУЕТСЯ, ФИЛЬТР ВЫНЕСЕН НА СЕРВЕР (оставил, чтобы было, вдруг что :)
     * Поиск операции по наименованию и категории
     */
    app.filter('operationHistoryFilter', ['$filter', function($filter) {
        var productList;
        var operationType;

        var containsElemtInArray = function(elements, id) {
            if (elements && id) {
                for (var i = 0; i < elements.length; ++i) {
                    if (elements[i].id == id) {
                        return true;
                    }
                }
            }
            return false;
        };

        var applyFilter = function(operation) {
            var result = true;
            if (productList) {
                result = operation.template.sourceProductId && containsElemtInArray(productList, operation.template.sourceProductId);

                if (!result) {
                    result = operation.template.sourceProductToId && containsElemtInArray(productList, operation.template.sourceProductToId)
                }
            }

            if (operationType && operationType != 'Все') {
                result = operation.operationName == operationType;
            }

            return result;
        };

        return function(input, products, type) {
            productList = products;
            operationType = type;
            return $filter('filter')(input, applyFilter);
        };
    }]);

    /**
     * Подпись под услугой/опцией продукта в зависимости от состояния подключения/отключения
     * Например, описание, подключена, подключение, отключение, телефон (для смс-инфо)
     */
    app.filter('productOptionState', [function() {
        return function(option) {
            return option.isInProcessing
                 ? option.orderStateValue
                 : option.isActive
                 ? option.description
                 : '';
        };
    }]);

    /**
     * Фильтр для массива геообъектов банкоматов МТС, работающих круглосуточно
     */
    app.filter('allDayBankAtmOnly', ['$filter', function($filter) {
        var is24Hours = /круглосуточн/i;
        return function(input) {
            return $filter('filter')(input, function(item){
                return item && item.properties && is24Hours.test(item.properties.hours);
            });
        };
    }]);

    /**
     * Фильтр для массива геообъектов банкоматов МТС, работающих без выходных
     */
    app.filter('allWeekBankAtmOnly', ['$filter', function($filter) {
        var includesWeekend = /выходн/i;
        return function(input) {
            return $filter('filter')(input, function(item){
                return item && item.properties && !includesWeekend.test(item.properties.hours);
            });
        };
    }]);

    /**
     * Фильтр для массива геообъектов банкоматов МТС, выполняющих прием наличных
     */
    app.filter('cashInBankAtmOnly', ['$filter', function($filter) {
        return function(input) {
            return $filter('filter')(input, {properties: {cashIn: true}});
        };
    }]);

}());