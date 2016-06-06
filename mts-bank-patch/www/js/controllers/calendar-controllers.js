var app = angular.module('app');

app.controller('CalendarCtrl', ['$scope', 'WebWorker', 'sys', '$timeout', '$ionicModal', '$state', 'paymentSrv', 'calendarSrv', 'utils',
    function($scope, WebWorker, sys, $timeout, $ionicModal, $state, paymentSrv, calendarSrv, utils) {

        $scope.calendar = calendarSrv.getRSCalendar();
        $scope.daysOfWeek = calendarSrv.getDaysOfWeek();

        var fw7App = sys.getFramework7App();
        var $$ = Dom7;

        var weekSwiper;

        $scope.showWeekCalendar = true;
        $scope.showMonthCalendar = false;

        var changeSelectedDay = function(indexWeek) {
            var days = calendarSrv.getWeekByIndex(indexWeek).days;
            for (var i = 0; i < days.length; i++) {
                if (days[i].dayOfWeek == $scope.selectedDay.dayOfWeek) {
                    $scope.selectDay(days[i]);
                    break;
                }
            }
        };

        $scope.nameMonthChanged = function(selectedMonth) {
            $scope.selectedMonth = selectedMonth;

            var y = $scope.selectedMonth.year;
            var m = $scope.selectedMonth.id;
            var d = 1;

            $scope.selectDay(calendarSrv.getDayByYMD(y, m, d));

            $scope.selectedWeek = calendarSrv.getWeekByYMD(y, m, d);
            weekSwiper.slideTo($scope.selectedWeek.index, 200, false);
            $scope.$applyAsync();
        };

        $scope.weekChanged = function(selectedWeekIndex) {
            $scope.selectedWeek = calendarSrv.getWeekByIndex(selectedWeekIndex);
            changeSelectedDay($scope.selectedWeek.index);
            $scope.$applyAsync();
        };

        $scope.selectDay = function(day) {
            calendarSrv.setSelectedDay(day);
            $scope.selectedDay = calendarSrv.getSelectedDay();

            var m = $scope.selectedDay.month;
            if ($scope.selectedMonth && m != $scope.selectedMonth.id) {
                var y = $scope.selectedDay.year;
                $scope.selectedMonth = calendarSrv.getMonthByYM(y, m);
                if (sys.getPlatform() === 'ios') {
                    $$('#calendar-event-name-month-swiper')[0].swiper.slideTo($scope.selectedMonth.index, 200, false);
                }
                if (sys.getPlatform() === 'android' && $scope.showMonthCalendar) {
                    monthSwiper.slideTo($scope.selectedMonth.index, 200, false);
                }
            }

            $scope.$applyAsync();
        };

        var initWeekSwiper = function() {
            var isInit = true;
            weekSwiper = fw7App.swiper('.calendar-event-week-swiper', {
                observer: true,
                direction: 'horizontal',
                centeredSlides: true,
                threshold: 15,
                initialSlide: $scope.selectedWeek.index,
                onSlideChangeEnd: function(swiper) {
                    if (!isInit) {
                        $scope.weekChanged(swiper.activeIndex);
                    }
                    isInit = false;
                }
            });
        };

        var fillCalendarEvents = function() {
            for (var strDay in $scope.calendarEventMap) {
                var date;
                if (angular.isDate(new Date(strDay)) && !isNaN(Date.parse(strDay))) {
                    date = new Date(strDay);
                } else if (/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/.exec(strDay)) { // Строка в формате yyyy-MM-ddTHH:mm:ss.SSSZ
                    date = utils.dateParser(strDay);
                }
                if (date) {
                    var y = date.getFullYear();
                    var m = date.getMonth();
                    var d = date.getDate();
                    var day = calendarSrv.getDayByYMD(y, m, d);
                    if (day) {
                        day["events"] = $scope.calendarEventMap[strDay];
                    }
                }
            }
        };

        function processingResults(data) {
            switch (data.cmdInfo) {
                case 'getCalendarEvents':
                    var result = JSON.parse(data.result.data);
                    $scope.firstDate = result.firstDate;
                    $scope.calendarEventMap = result.calendarEventMap;

                    // a.	Если на 31 день вперед от текущей даты событий в календаре нет, то должна отображаться текущая дата.
                    // b.	Иначе, отображаем день с ближайшим событием.
                    // +    преобразование продукта в объект
                    var selectedDate;
                    for (var strDay in $scope.calendarEventMap) {
                        var eventDayList = $scope.calendarEventMap[strDay];
                        for (var i = 0; i < eventDayList.length; i++) {
                            if (eventDayList[i].product) {
                                eventDayList[i].productObj = JSON.parse(eventDayList[i].product);
                            }
                        }
                        var day;
                        if (angular.isDate(new Date(strDay)) && !isNaN(Date.parse(strDay))) {
                            day = new Date(strDay);
                        } else if (/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/.exec(strDay)) { // Строка в формате yyyy-MM-ddTHH:mm:ss.SSSZ
                            day = utils.dateParser(strDay);
                        }
                        if (day && day >= new Date() && (selectedDate && day < selectedDate || !selectedDate && (parseInt((day - new Date())/(1000 * 24 * 60 * 60)) < 31))) {
                            selectedDate = day;
                        }
                    }

                    selectedDate = selectedDate ? selectedDate : new Date();
                    var y = selectedDate.getFullYear();
                    var m = selectedDate.getMonth();
                    var d = selectedDate.getDate();

                    calendarSrv.setSelectedDay(calendarSrv.getDayByYMD(y, m, d));
                    $scope.selectedDay = calendarSrv.getSelectedDay();

                    $scope.selectedWeek = calendarSrv.getWeekByYMD(y, m, d);
                    $scope.selectedMonth = calendarSrv.getMonthByYM(y, m);
                    fillCalendarEvents();

                    $timeout(function() {
                        initWeekSwiper();
                        if (sys.getPlatform() === 'ios') {
                            $$('#calendar-event-name-month-swiper')[0].swiper.slideTo($scope.selectedMonth.index, 200, false);
                        }
                    });

                    break;
                case 'deleteCalendarEvent':
                    WebWorker.postMessage('invokeUserEntityMethod', 'getCalendarEvents', ['getCalendarEvents']);
                    break;
            }
            $scope.$apply();
        }
        WebWorker.setFunction(processingResults);
        WebWorker.postMessage('invokeUserEntityMethod', 'getCalendarEvents', ['getCalendarEvents']);

        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/calendar/events.html', function($ionicModal) {
            $scope.events = $ionicModal;
        }, {
            scope: $scope
        });

        var eventsSwiper;
        var initEventsSwiper = function() {
            eventsSwiper = fw7App.swiper('.events-swiper', {
                observer: true, // Чтобы слайдер перерендерился при добавлении слайдов или изменения стилей
                direction: 'horizontal',
                centeredSlides: true
            });
        };

        $scope.eventsShow = function() {
            $scope.events.show();
            $('#rootpane').addClass('blur15px');
            $timeout(function() {
                initEventsSwiper();
            });
        };

        $scope.eventsHide = function() {
            $scope.events.hide();
            $('#rootpane').removeClass('blur15px');
        };

        $scope.$on('modal.hidden', function() {
            $('#rootpane').removeClass('blur15px');
        });

        $scope.goLoanPayment = function(event) {
            $scope.eventsHide();
            $state.go('transfer', {paymentParams: {sum: event.sum, sourceProductTo: event.productObj}});
        };

        $scope.goCardPayment = function(event) {
            $scope.eventsHide();
            $state.go('transfer', {paymentParams: {sum: event.sum, sourceProduct: event.productObj}});
        };

        $scope.goPeriodicalPay = function(event) {
            $scope.eventsHide();
            var favouritesList = paymentSrv.getFavouritesList();
            for (var i = 0; i < favouritesList.length; i++) {
                if (favouritesList[i].name === event.name) {
                    redirectToPayment(favouritesList[i]);
                }
            }
        };

        var redirectToPayment = function (favourite) {
            if (!favourite.isGroup) {
                var params = paymentSrv.getParamsToRedirectFromFavourites(favourite.template, favourite, 'Избранные платежи');
                if (params) {
                    $state.go(params.link, params.linkParams);
                }
            }
        };

        $scope.deleteRemind = function(event) {
            $scope.eventsHide();
            WebWorker.postMessage('invokeUserEntityMethod', 'deleteCalendarEvent', ['deleteCalendarEvent', event.type, event.id]);
        };


        var monthSwiper;

        var monthChanged = function(index) {
            $scope.selectedMonth = calendarSrv.getMonthByIndex(index);

            var y = $scope.selectedMonth.year;
            var m = $scope.selectedMonth.id;
            var d = 1;

            $scope.selectDay(calendarSrv.getDayByYMD(y, m, d));

            if (sys.getPlatform() === 'android') {
                $scope.selectedWeek = calendarSrv.getWeekByYMD(y, m, d);
                weekSwiper.slideTo($scope.selectedWeek.index, 200, false);
            }

            $scope.$applyAsync();
        };

        var initMonthSwiper = function() {
            var isInit = true;
            monthSwiper = fw7App.swiper('.calendar-event-month-swiper', {
                observer: true, // Чтобы слайдер перерендерился при добавлении слайдов или изменения стилей
                direction: sys.getPlatform() === 'ios' ? 'vertical' : 'horizontal',
                threshold: 15,
                initialSlide: $scope.selectedMonth.index,
                onSlideChangeEnd: function(swiper) {
                    if (!isInit) {
                        monthChanged(swiper.activeIndex);
                    }
                    isInit = false;
                }
            });
        };

        $scope.openMonthCalendar = function() {
            $scope.showWeekCalendar = false;
            $scope.showMonthCalendar = true;
            $scope.$applyAsync();

            $timeout(function() {
                initMonthSwiper();
            });
        };

        $scope.toggleMonthCalendar = function() {
            if ($scope.showMonthCalendar) {
                $scope.openWeekCalendar($scope.selectedDay);
            } else {
                $scope.openMonthCalendar();
            }

        };

        $scope.openWeekCalendar = function(day) {
            $scope.showWeekCalendar = true;
            $scope.showMonthCalendar = false;

            var y = day.year;
            var m = day.month;
            var d = day.number;

            $scope.selectedMonth = calendarSrv.getMonthByYM(y, m);
            $scope.selectedWeek = calendarSrv.getWeekByYMD(y, m, d);

            $scope.selectDay(day);

            weekSwiper.slideTo($scope.selectedWeek.index, 200, false);

            $scope.$applyAsync();

            $timeout(function() {
                initWeekSwiper();
                if (sys.getPlatform() === 'ios') {
                    $$('#calendar-event-name-month-swiper')[0].swiper.slideTo($scope.selectedMonth.index, 200, false);
                }
            });
        };
    }]);

app.controller('CreateCalendarEventCtrl', ['$scope', 'WebWorker', 'sys', '$ionicModal', '$ionicLoading', function($scope, WebWorker, sys, $ionicModal, $ionicLoading) {
    $scope.eventTypeList = [{kindStrId: 'RetailCliRemind', name: 'Напоминание'}];
    $scope.calendarEvent = {};      // создаваемый объект события, поля в html НЕ ПЕРЕИМЕНОВЫВАТЬ! - соответствуют базе
    $scope.display = {};
    $scope.calendarEvent.currency = 'RUB';
    $scope.startDateChange = function(newVal) {
        $scope.display.startDate = newVal;
    }
    $scope.endDateChange = function(newVal) {
        $scope.display.endDate = newVal;
    }

    $scope.daysOfWeek = [
        {value: 1, desc: 'Понедельник'},
        {value: 2, desc: 'Вторник'},
        {value: 3, desc: 'Среда'},
        {value: 4, desc: 'Четверг'},
        {value: 5, desc: 'Пятница'},
        {value: 6, desc: 'Суббота'},
        {value: 0, desc: 'Воскресенье'}
    ];

    $scope.daysOfMonth = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];

    $scope.months = [
        {value: 1, desc: 'Январь'},
        {value: 2, desc: 'Февраль'},
        {value: 3, desc: 'Март'},
        {value: 4, desc: 'Апрель'},
        {value: 5, desc: 'Май'},
        {value: 6, desc: 'Июнь'},
        {value: 7, desc: 'Июль'},
        {value: 8, desc: 'Август'},
        {value: 9, desc: 'Сентябрь'},
        {value: 10, desc: 'Октябрь'},
        {value: 11, desc: 'Ноябрь'},
        {value: 12, desc: 'Декабрь'}
    ];

    $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/select.html', function($ionicModal) {
        $scope.select = $ionicModal;
    }, {
        scope: $scope
    });

    $scope.selectShow = function(listForSelect, resultId, headerText, fieldId) {
        $scope.listForSelect = listForSelect;
        $scope.resultId = resultId;
        $scope.headerText = headerText;
        $scope.fieldId = fieldId;
        $scope.select.show();
    };

    $scope.selectHide = function() {
        $scope.select.hide();
    };

    $scope.clickItem = function(item) {
        $scope.select.hide();
        if ($scope.resultId === 'display.regular') {
            $scope.display.regular = item;
        } else if ($scope.resultId === 'calendarEvent.dayOfWeek') {
            $scope.calendarEvent.dayOfWeek = item;
        } else if ($scope.resultId === 'calendarEvent.dayOfMonth') {
            $scope.calendarEvent.dayOfMonth = item;
        } else if ($scope.resultId === 'calendarEvent.month') {
            $scope.calendarEvent.month = item;
        } else if ($scope.resultId === 'display.eventType') {
            $scope.display.eventType = item;
        }
    };

    function processingResults(data) {
            switch (data.cmdInfo) {
                case 'getCalendarEvents':
                    var result = JSON.parse(data.result.data);
                    $scope.firstDate = result.firstDate;
                    $scope.calendarEventMap = result.calendarEventMap;
                    break;
                case 'getRegularPeriod':
                    $scope.iterationList = data.result.data;
                    break;
                case 'createCalendarEvent':
                    $ionicLoading.hide();
                    $scope.goBack();
                    break;
            }
            $scope.$apply();
    }
    WebWorker.setFunction(processingResults);
    WebWorker.postMessage('getEntitiesByCondition', 'getRegularPeriod', ['codifier', 'RetailRegularPeriod']);

    $scope.createCalendarEvent = function() {
        if (!$scope.display.startDate) {
            alert('Заполните дату события');
            return;
        }
        if (!$scope.display.regular) {
            alert('Укажите периодичность');
            return;
        }
        if ($scope.display.regular.value === 'WEEKLY' && !$scope.calendarEvent.dayOfWeek) {
            alert('Укажите день недели');
            return;
        }
        if ($scope.display.regular.value === 'MONTHLY' && !$scope.calendarEvent.dayOfMonth) {
            alert('Выберите число');
            return;
        }
        if ($scope.display.regular.value === 'YEARLY' && !$scope.calendarEvent.month) {
            alert('Укажите месяц');
            return;
        }
        if ($scope.display.regular && $scope.display.regular.value !== 'SINGLE' && !$scope.display.endDate) {
            alert('Заполните дату окончания');
            return;
        }
        if (!$scope.display.eventType) {
            alert('Укажите тип события');
            return;
        }
        if (!$scope.calendarEvent.sum) {
            alert('Введите сумму');
            return;
        }
        if (!$scope.calendarEvent.name) {
            alert('Заполните наименование события');
            return;
        }

        $scope.calendarEvent.startDate = Date.parse($scope.display.startDate);
        if ($scope.display.endDate) {
            $scope.calendarEvent.endDate = Date.parse($scope.display.endDate);
        }
        $scope.calendarEvent.regular = $scope.display.regular.value;
        $scope.calendarEvent.kindStrId = $scope.display.eventType.kindStrId;

        $ionicLoading.show({
            templateUrl: 'templates/' + sys.getPlatform() + '/loading.html'
        });

        WebWorker.postMessage('invokeUserEntityMethod', 'createCalendarEvent', ['createCalendarEvent', JSON.stringify($scope.calendarEvent)]);
    }
}]);