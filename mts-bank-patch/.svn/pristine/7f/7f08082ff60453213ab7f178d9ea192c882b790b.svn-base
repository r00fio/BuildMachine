/**
 * Контроллеры выписки
 */
var app = angular.module('app');

/**
 * Просмотр выписки за указанный период
 */
app.controller('PaymentBaseCtrl', ['$q', '$scope', '$state', '$stateParams', '$ionicModal', 'sys', 'paymentSrv', 'WebWorker', 'productSrv',
    function ($q, $scope, $state, $stateParams, $ionicModal, sys, paymentSrv, WebWorker, productSrv) {

        $scope.initPayment = function(inheritedInit) {
            if ($scope.globals.dataObjectForSessionTimeout) {
                initBySessionTimeout();
            } else {
                init(inheritedInit);
            }
        };

        function initBySessionTimeout() {
            $scope.payment = angular.copy($scope.globals.dataObjectForSessionTimeout);
            if ($scope.payment.resultValue) {
                $scope.payment.showConfirmButton = true;
            } else {
                $scope.setEditMode();
            }
            delete($scope.globals.dataObjectForSessionTimeout);
        }

        function init(inheritedInit) {
            $scope.payment = {};
            inheritedInit();

            // Шаблон и регулярные платежи
            $scope.payment.paymentModeParams = paymentSrv.getDefaultPaymentModeStruct();
            $scope.payment.periodicalPayStruct = paymentSrv.getDefaultPeriodicalPayStruct();
            $scope.currentDate = new Date();

            $scope.payment.viewMode = $stateParams.viewMode ? $stateParams.viewMode : 'EDIT';
            $scope.payment.paymentTitle = $stateParams.title ? $stateParams.title : 'Перевод';

            $scope.payment.favorite = $stateParams.favorite ? $stateParams.favorite : null;
            if ($scope.payment.favorite) {
                $scope.payment.fromTemplate = true;
                $scope.payment.paymentModeParams.fromTemplate = true;
                $scope.payment.paymentModeParams.isVisibleTemplateFields = true;
                $scope.payment.paymentModeParams.visibleRegularFields = $scope.payment.favorite.isPeriodic;
                $scope.payment.paymentModeParams.templateName = $scope.payment.favorite.name;
                $scope.payment.paymentModeParams.templateId = $scope.payment.favorite.templateId;
            }

            $scope.template = $stateParams.template ? $stateParams.template : null;
            if ($scope.template) {
                $scope.payment.paymentModeParams.isRepeated = true;
                $scope.clone($scope.payment, $scope.template);
                if ($scope.payment.agreementDate) {
                    var dateParts = $scope.payment.agreementDate.split('.');
                    $scope.payment.agreementDate = dateParts[1] + '.' + dateParts[0] + '.' + dateParts[2];
                    $scope.payment.agreementDate = new Date($scope.payment.agreementDate);
                }
            }
            $scope.payment.paymentSourceList = undefined;
            $scope.payment.paymentSourceToList = undefined;
            $scope.extractDateFrom = $scope.isSingle() ? $scope.payment.periodicalPayStruct.payDay : $scope.payment.periodicalPayStruct.beginDay;
            $scope.extractDateTo = $scope.payment.periodicalPayStruct.endDay;
            $scope.initRegularPayJs();
        }

        $scope.getElementById = function(elements, id) {
            if (elements && id) {
                for (var i = 0; i < elements.length; ++i) {
                    if (elements[i].id == id) {
                        return elements[i];
                    }
                }
            }
            return null;
        };

        /**
         * Поиск клиента по номеру счёта, карты, телефона
         * НАВЕШАН НА keyUp, onChange СРАБАТЫВАЕТ ИЗ-ЗА МАСКИ, КОГДА ВСТАВЛЯЕТСЯ ЗНАЧЕНИЕ ПРИ ПОВТОРЕ ОПЕРАЦИИ
         */
        $scope.searchPayeeBaseName = function() {
            $scope.payment.payeeNameBase = undefined;
            $scope.saveDataForSessionTimeout($scope.payment);
            searchPayeeData($scope.payment.payType, $scope.payment.searchNumber).then(function(data) {
                $scope.clone($scope.payment, data);
            }).catch(function(errText){
                $scope.payment.payeeNameBase = errText;
            });
        };

        /**
         * Поиск клиента по номеру счёта, карты, телефона
         * @param type      toAccount | toBankCard | toPhone | не заполнен - карта
         * @param number    номер счёта, карты, телефона
         */
        function searchPayeeData(type, number) {
            var deferred = $q.defer();

            var emptyType = angular.isUndefined(type);
            if (number && ((type == 'toBankCard' && number.length == 16)
                || (type == 'toAccount' && number.length == 20)
                || (type == 'toPhone' && number.length == 10))
                || (emptyType && number.length == 16)) {

                return WebWorker.invoke('searchPayeeBaseName', type, number).then(function(result) {
                    if (angular.isObject(result.data) && 'payeeNameBase' in result.data) {
                        $scope.isMyCard = ((type == 'toBankCard' || emptyType) && result.data.isMe);
                        return result.data;
                    } else {
                        return $q.reject(emptyType ? '': 'Клиент не найден');
                    }
                });
            } else {
                deferred.reject('');
            }
            return deferred.promise;
        }

        /**
         * Отображение счета карты вместо номера карты запрос 095146: MTS.Карты.Подмена номера карты
         * При определенном статусе блокировки
         * или при переводе на брокерский счет
         * или при переводе на свой счет если отличаются валюты счетов списания/зачисления
         * или при переводе на свою карту по номеру карты
         */
        $scope.showCardAccount = function(sourceProduct, destinationProduct) {
            if ($scope.isViewMode() && sourceProduct && sourceProduct.entityKind == 'BankCard') {
                var srcProdState = sourceProduct.state && sourceProduct.state.value || null;
                var srcProdCurrency = sourceProduct.currency || null;

                var destProduct = angular.isObject(destinationProduct) ? destinationProduct : null;
                var destProdCurrency = destProduct && destProduct.currency || null;

                var destProdAccount = (angular.isObject(destinationProduct) ? destinationProduct.account : destinationProduct) || null;
                var destCardMaskNumber = (angular.isObject(destinationProduct) ? destinationProduct.maskNumber : destinationProduct) || null;

                return /^(BLOCKED|REPLENISHMENT|DELIVERY)$/i.test(srcProdState) /* требуемые статусы */
                    || /^3060\d*$/.test(destProdAccount) /* брокерский счет зачисления */
                    || destProduct && srcProdCurrency !== destProdCurrency /* отличаются валюты */
                    || $scope.isMyCard;
            }

            return false;
        };

        // <состояния документа>
        $scope.isCopyMode = function () {
            return $scope.payment.viewMode === 'COPY';
        };

        $scope.isViewMode = function () {
            return $scope.payment.viewMode === 'VIEW';
        };

        $scope.isEditMode = function () {
            return $scope.payment.viewMode === 'EDIT';
        };

        $scope.isTemplateMode = function () {
            return $scope.payment.viewMode === 'TEMPLATE';
        };

        $scope.isNotFromTemplateAndVisibleFields = function() {
            return $scope.payment.paymentModeParams.isVisibleTemplateFields && !$scope.payment.fromTemplate;
        } ;
        // </состояния документа>

        $scope.getActionStrId = function () {
            return $scope.payment.paymentModeParams.actionStrId == 'saveTemplate'
                ? "RetailConfirmCreateTemplateAction"
                : "RetailConfirmPaymentOperationAction";
        };

        $scope.isSingle = function () {
            return "SINGLE" == $scope.payment.periodicalPayStruct.periodicityValue;
        };

        $scope.isEveryday = function () {
            return "EVERYDAY" == $scope.payment.periodicalPayStruct.periodicityValue;
        };

        $scope.isWeekly = function () {
            return "WEEKLY" == $scope.payment.periodicalPayStruct.periodicityValue;
        };

        $scope.isMonthly = function () {
            return "MONTHLY" == $scope.payment.periodicalPayStruct.periodicityValue;
        };

        $scope.isYearly = function () {
            return "YEARLY" == $scope.payment.periodicalPayStruct.periodicityValue;
        };

        $scope.isPercentTypeSum = function () {
            return "PERCENT" == $scope.payment.periodicalPayStruct.typeSumValue;
        };

        $scope.hideDatePickers = function () {
            $scope.$broadcast('close-ios-datepickers');
        };

        $scope.hideAndroidDatePickers = function () {
            $scope.$broadcast('close-android-datepickers');
        };

        $scope.setCalendarDateTo = function(newDate) {
            $scope.extractDateTo = newDate;
        };

        // <Панель для выбора кодификатора>
        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/payments/select.periodical.codifier.html', function ($ionicModal) {
            $scope.selectPeriodicCodifierPanel = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.onSelectPeriodicCodifierPanel = function (codifiers, codifierStrId, codifierField) {
            $scope.codifiers = codifiers ? codifiers : paymentSrv.getCodifierListByStrId(codifierStrId);
            $scope.codifierStrId = codifierStrId;
            $scope.codifierField = codifierField;
            $scope.selectedCodifier = {value: $scope.payment.periodicalPayStruct[codifierField]};

            $scope.selectPeriodicCodifierPanel.show()
        };

        $scope.clickPeriodicCodifier = function (codifier) {
            $scope.selectPeriodicCodifierPanel.hide();
            if ($scope.codifierField) {
                $scope.payment.periodicalPayStruct[$scope.codifierField] = codifier.value;
            }

            $scope.codifiers = [];
            $scope.codifierStrId = '';
            $scope.selectedCodifier = null;
            $scope.codifierField = null;
            $scope.updateNextPayDate();
        };

        $scope.getCodifierDescByValue = function (codifierStrId, codifierField) {
            if (!codifierStrId || !codifierField) {
                return '';
            }
            var temList = paymentSrv.getCodifierListByStrId(codifierStrId);
            if (!temList) {
                return '';
            }
            for (var i = 0; i < temList.length; ++i) {
                if (temList[i].value == $scope.payment.periodicalPayStruct[codifierField]) {
                    return temList[i].desc;
                }
            }
            return '';
        };
        // </Панель для выбора кодификатора>

        $scope.preparePeriodicalFields = function () {
            if ($scope.payment.paymentModeParams.visibleRegularFields) {
                if ($scope.payment.periodicalPayStruct.periodicityValue == 'SINGLE') {
                    $scope.payment.periodicalPayStruct.payDay = $scope.extractDateFrom;

                    $scope.payment.periodicalPayStruct.beginDay = null;
                    $scope.payment.periodicalPayStruct.endDay = null;
                } else {
                    $scope.payment.periodicalPayStruct.beginDay =$scope.extractDateFrom;
                    $scope.payment.periodicalPayStruct.endDay = $scope.extractDateTo;

                    $scope.payment.periodicalPayStruct.payDay = null;
                }
            }
        };

        $scope.setEditTemplateMode = function (event) {
            $scope.payment.paymentTitle = $scope.payment.favorite.name;
            $scope.payment.fromTemplate = false;
        };

        $scope.deleteTemplate = function() {
            WebWorker.postMessage('invokeUserEntityMethod', 'deleteTemplate', ['deleteTemplate', {type:'integer', value:$scope.payment.favorite.templateId}]);
            paymentSrv.setFavouritesList(undefined);
            $scope.goBack();
        };

        $scope.setViewMode = function() {
            $scope.payment.viewMode = 'VIEW';
        };

        $scope.setEditMode = function() {
            $scope.payment.viewMode = 'EDIT';
        };

        $scope.redirectToOperationFromPayment = function(operation) {
            if (operation) {
                productSrv.setCurrentOperation(operation);
                $state.go('homeoperation', null, {location: 'replace'});
            }
        };

        $scope.initRegularPayJs = function () {
            $scope.regularPay_oldValues = {
                regularPay_periodicity: $scope.payment.periodicalPayStruct.periodicityValue,
                regularPay_beginDay: $scope.payment.periodicalPayStruct.beginDay,
                regularPay_payDay: $scope.payment.periodicalPayStruct.payDay,
                regularPay_isOnlyWorkDay: $scope.payment.periodicalPayStruct.isOnlyWorkDay,
                regularPay_dayOfWeek: $scope.payment.periodicalPayStruct.dayOfWeekValue,
                regularPay_dayOfMonth: $scope.payment.periodicalPayStruct.dayOfMonth,
                regularPay_month: $scope.payment.periodicalPayStruct.monthValue
            };

            $scope.updateNextPayDate();

            /*jQuery('#picker-date-to').on('change', function () {
                $scope.updateNextPayDate();
            });

            jQuery('#picker-date-from').on('change', function () {
                $scope.updateNextPayDate();
            });*/
        };

        $scope.updateNextPayDate = function() {
            $scope.preparePeriodicalFields();
            $scope.setNextPayDate();
        };

        $scope.clearWrongDayOfMonth = function() {
            if ($scope.payment.periodicalPayStruct.monthValue && $scope.payment.periodicalPayStruct.dayOfMonth && $scope.payment.periodicalPayStruct.dayOfMonth > 29) {
                var months31 = [1,3,5,7,8,10,12];
                var months30 = [2,4,6,9,11];
                if ($scope.payment.periodicalPayStruct.dayOfMonth > 31 && months31.indexOf($scope.payment.periodicalPayStruct.monthValue)>=0) {
                    $scope.payment.periodicalPayStruct.dayOfMonth = undefined;
                } else {
                    if ($scope.payment.periodicalPayStruct.dayOfMonth > 30 && months30.indexOf($scope.payment.periodicalPayStruct.monthValue)>=0) {
                        $scope.payment.periodicalPayStruct.dayOfMonth = undefined;
                    } else if ($scope.payment.periodicalPayStruct.dayOfMonth > 29 && $scope.payment.periodicalPayStruct.monthValue == 2) {
                        $scope.payment.periodicalPayStruct.dayOfMonth = undefined;
                    }
                }
            }
            if (!$scope.payment.periodicalPayStruct.monthValue && $scope.payment.periodicalPayStruct.dayOfMonth && $scope.payment.periodicalPayStruct.dayOfMonth > 31) {
                $scope.payment.periodicalPayStruct.dayOfMonth = undefined;
            }
        };

        $scope.setNextPayDate = function() {
            var nextPayDate;
            var compareDate;

            var zeroDate = $scope.getDateZero();
            var endDay = $scope.payment.periodicalPayStruct.endDay;
            if ($scope.payment.periodicalPayStruct.periodicityValue) {
                if ($scope.payment.periodicalPayStruct.isNotEnoughMoney && !$scope.areInfluencingDateParamsChanged()) {
                    $scope.payment.periodicalPayStruct.nearlyPayDay = $scope.getDateZero(1).format('dd.mm.yyyy');
                } else if ($scope.payment.periodicalPayStruct.periodicityValue == "SINGLE") {

                    $scope.payment.periodicalPayStruct.nearlyPayDay = new Date(
                        (zeroDate < $scope.payment.periodicalPayStruct.payDay)
                            ? $scope.payment.periodicalPayStruct.payDay
                            : zeroDate
                    ).format('dd.mm.yyyy');

                } else if ($scope.payment.periodicalPayStruct.periodicityValue == "EVERYDAY") {
                    // для ежедневного платежа, в случае установки рабочего дня, для субботы и воскресенье берем ближайший пн-к
                    nextPayDate = new Date (zeroDate < $scope.payment.periodicalPayStruct.beginDay ? $scope.payment.periodicalPayStruct.beginDay : zeroDate);
                    var dayOfWeek = nextPayDate.getDay();
                    if ($scope.payment.periodicalPayStruct.isOnlyWorkDay) {
                        if (dayOfWeek == 0) {
                            nextPayDate.setDate(nextPayDate.getDate() + 1);
                        } else if (dayOfWeek == 6) {
                            nextPayDate.setDate(nextPayDate.getDate() + 2);
                        }
                    }
                    if (endDay && endDay < nextPayDate) {
                        $scope.payment.periodicalPayStruct.endDay = nextPayDate;
                        $scope.setCalendarDateTo($scope.payment.periodicalPayStruct.endDay);
                    }
                    $scope.payment.periodicalPayStruct.nearlyPayDay = nextPayDate.format('dd.mm.yyyy');
                } else if ($scope.payment.periodicalPayStruct.periodicityValue == "WEEKLY") {
                    // для еженедельного варианта, ищем ближайший день совпадающий в выбранным днём недели
                    if ($scope.payment.periodicalPayStruct.beginDay && $scope.payment.periodicalPayStruct.dayOfWeekValue) {
                        nextPayDate = new Date (zeroDate < $scope.payment.periodicalPayStruct.beginDay ? $scope.payment.periodicalPayStruct.beginDay : zeroDate);
                        while ($scope.payment.periodicalPayStruct.dayOfWeekValue != nextPayDate.getDay()) {
                            nextPayDate.setDate(nextPayDate.getDate() + 1)
                        }
                        if (endDay && endDay < nextPayDate) {
                            $scope.payment.periodicalPayStruct.endDay = nextPayDate;
                            $scope.setCalendarDateTo($scope.payment.periodicalPayStruct.endDay);
                        }
                        $scope.payment.periodicalPayStruct.nearlyPayDay = nextPayDate.format('dd.mm.yyyy');
                    } else {
                        $scope.payment.periodicalPayStruct.nearlyPayDay = "";
                    }
                } else if ($scope.payment.periodicalPayStruct.periodicityValue == "MONTHLY") {
                    // для ежемесячного варианта, проставляем число месяца, если получившая дата меньше даты отсчета
                    // до берем дату следующего месяца
                    if ($scope.payment.periodicalPayStruct.dayOfMonth && $scope.payment.periodicalPayStruct.dayOfMonth > 31) {
                        $scope.payment.periodicalPayStruct.dayOfMonth = undefined;
                    }
                    if ($scope.payment.periodicalPayStruct.beginDay && $scope.payment.periodicalPayStruct.dayOfMonth) {
                        compareDate = zeroDate < $scope.payment.periodicalPayStruct.beginDay ? $scope.payment.periodicalPayStruct.beginDay : zeroDate;
                        nextPayDate = new Date(compareDate);
                        var month = nextPayDate.getMonth();
                        nextPayDate.setDate($scope.payment.periodicalPayStruct.dayOfMonth);
                        //если месяц изменился, то необходио, проставить последний день месяца
                        if (nextPayDate.getMonth() != month) {
                            var day = new Date(compareDate);
                            nextPayDate = new Date(day.getFullYear(), day.getMonth(), new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate());
                        }
                        nextPayDate.setHours(0);
                        nextPayDate.setMinutes(0);
                        nextPayDate.setSeconds(0);
                        nextPayDate.setMilliseconds(0);

                        if (nextPayDate < compareDate) {
                            nextPayDate.setMonth(nextPayDate.getMonth() + 1);
                        }
                        if (endDay && endDay < nextPayDate) {
                            $scope.payment.periodicalPayStruct.endDay = nextPayDate;
                            $scope.setCalendarDateTo($scope.payment.periodicalPayStruct.endDay);
                        }
                        $scope.payment.periodicalPayStruct.nearlyPayDay = nextPayDate.format('dd.mm.yyyy');
                    } else {
                        $scope.payment.periodicalPayStruct.nearlyPayDay =  "";
                    }
                } else if ($scope.payment.periodicalPayStruct.periodicityValue == "YEARLY") {
                    $scope.clearWrongDayOfMonth();
                    // для ежегодного варианта, проставляем число месяца и месяц, если получившая дата меньше даты отсчета
                    // до берем дату следующего года
                    if ($scope.payment.periodicalPayStruct.beginDay && $scope.payment.periodicalPayStruct.dayOfMonth && $scope.payment.periodicalPayStruct.monthValue) {
                        nextPayDate = new Date();
                        nextPayDate.setMonth($scope.payment.periodicalPayStruct.monthValue - 1);
                        nextPayDate.setDate($scope.payment.periodicalPayStruct.dayOfMonth);
                        nextPayDate.setHours(0);
                        nextPayDate.setMinutes(0);
                        nextPayDate.setSeconds(0);
                        nextPayDate.setMilliseconds(0);
                        compareDate = zeroDate < $scope.payment.periodicalPayStruct.beginDay ? $scope.payment.periodicalPayStruct.beginDay : zeroDate;
                        if (nextPayDate < compareDate) {
                            nextPayDate.setFullYear(nextPayDate.getFullYear() + 1);
                            nextPayDate.setMonth($scope.payment.periodicalPayStruct.monthValue - 1);
                            nextPayDate.setDate($scope.payment.periodicalPayStruct.dayOfMonth);
                        }
                        if (endDay && endDay < nextPayDate) {
                            $scope.payment.periodicalPayStruct.endDay = nextPayDate;
                            $scope.setCalendarDateTo($scope.payment.periodicalPayStruct.endDay);
                        }
                        $scope.payment.periodicalPayStruct.nearlyPayDay = nextPayDate.format('dd.mm.yyyy');
                    } else {
                        $scope.payment.periodicalPayStruct.nearlyPayDay = "";
                    }
                }
            }
            $scope.$applyAsync();
        };

        $scope.getDateZero = function(addDay) {
            var nextDate = new Date();
            nextDate.setHours(0);
            nextDate.setMinutes(0);
            nextDate.setSeconds(0);
            nextDate.setMilliseconds(0);
            if (addDay) {
                nextDate.setDate(nextDate.getDate() + addDay);
            }
            return nextDate;
        };

        $scope.areInfluencingDateParamsChanged = function() {
            if ($scope.regularPay_oldValues.regularPay_periodicity != $scope.payment.periodicalPayStruct.periodicityValue) {
                return true;
            }
            if ("SINGLE" == $scope.regularPay_oldValues.regularPay_periodicity) {
                if ($scope.regularPay_oldValues.regularPay_payDay != $scope.payment.periodicalPayStruct.payDay) {
                    return true;
                }
            }
            if ("EVERYDAY" == $scope.regularPay_oldValues.regularPay_periodicity) {
                if ($scope.regularPay_oldValues.regularPay_isOnlyWorkDay != $scope.payment.periodicalPayStruct.isOnlyWorkDay) {
                    return true;
                }
            }
            if ("WEEKLY" == $scope.regularPay_oldValues.regularPay_periodicity) {
                if ($scope.regularPay_oldValues.regularPay_dayOfWeek != $scope.payment.periodicalPayStruct.dayOfWeekValue) {
                    return true;
                }
            }
            if ("MONTHLY" == $scope.regularPay_oldValues.regularPay_periodicity) {
                if ($scope.regularPay_oldValues.regularPay_dayOfMonth != $scope.payment.periodicalPayStruct.dayOfMonth) {
                    return true;
                }
            }
            if ("YEARLY" == $scope.regularPay_oldValues.regularPay_periodicity) {
                if ($scope.regularPay_oldValues.regularPay_dayOfMonth != $scope.payment.periodicalPayStruct.dayOfMonth
                    && $scope.regularPay_oldValues.regularPay_month != $scope.payment.periodicalPayStruct.monthValue) {
                    return true;
                }
            }
            // если никакой другой параметр не изменился, то проверим дату начала (только в том случае если она установлена
            // и больше текущей)
            return $scope.payment.periodicalPayStruct.beginDay > new Date() && $scope.payment.periodicalPayStruct.beginDay != $scope.regularPay_oldValues.regularPay_beginDay;
        };

        $scope.isEmptyField = function(fieldValue) {
            return !(fieldValue && fieldValue.length > 0);
        };

        $scope.validateSourceField = function(source) {
            if (!source) {
                throw new Error('Поле "Источник средств" должно быть заполнено');
            }
        };

        $scope.validateSumField = function(sum) {
            if (!(sum && sum >= 0.01)) {
                throw new Error('Сумма должна быть не меньше 0.01');
            }
        };
    }
]);