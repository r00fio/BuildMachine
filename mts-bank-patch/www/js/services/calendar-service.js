(function () {
    var app = angular.module('app');

    app.factory('calendarSrv', [function () {

        var rsCalendar = null;
        var selectedDay = null;

        var dictMonths = [
            {name: 'Январь', name_format: 'Января'},
            {name: 'Февраль', name_format: 'Февраля'},
            {name: 'Март', name_format: 'Марта'},
            {name: 'Апрель', name_format: 'Апреля'},
            {name: 'Май', name_format: 'Мая'},
            {name: 'Июнь', name_format: 'Июня'},
            {name: 'Июль', name_format: 'Июля'},
            {name: 'Август', name_format: 'Августа'},
            {name: 'Сентябрь', name_format: 'Сентября'},
            {name: 'Октябрь', name_format: 'Октября'},
            {name: 'Ноябрь', name_format: 'Ноября'},
            {name: 'Декабрь', name_format: 'Декабря'}
        ];

        var startYear = new Date().getFullYear();
        var endYear = new Date().getFullYear();

        var getRSCalendar = function() {
            if (!rsCalendar) {
                initRSCalendar();
            }
            return rsCalendar;
        };

        var initRSCalendar = function() {
            var weeks = []; // Календарь это массив недель
            var months = [];
            for (var i = startYear; i <= endYear; i++) {
                addYear(weeks, months, i);
            }
            rsCalendar = {
                weeks: weeks,
                months: months
            }
        };

        var indexWeekInMonth; // Индекс недели в месяце
        var isFirstDayMonth;
        var addYear = function(weeks, months, year) {
            for (var i = 0; i <= 11; i++) {
                indexWeekInMonth = 0; // Индекс недели в месяце
                isFirstDayMonth = true;
                addMonth(weeks, months, year, i);
            }
        };

        var indexMonth = 0; // Номер месяца
        var addMonth = function(weeks, months, year, idMonth) {
            var month = {
                index: indexMonth,
                id: idMonth,
                name: dictMonths[idMonth].name,
                name_format: dictMonths[idMonth].name_format,
                year: year
            };
            months.push(month);
            var Dlast = new Date(year, idMonth + 1, 0).getDate(); // число последнего дня месяца
            for (var i = 1; i <= Dlast; i++) {
                addDay(weeks, months, year, idMonth, i);
            }
            indexMonth++;
        };

        var indexWeek = 0; // Номер недели
        var numberWeek = 0; // Номер недели в году
        var isFirstDay = true;
        var currentYear = startYear;
        var addDay = function(weeks, months, year, month, number) {
            if (currentYear != year) {
                numberWeek = 0; // Перешли к следующему году - недели считаем с 0
                currentYear = year;
            }
            if (weeks[indexWeek] && weeks[indexWeek].days.length == 7) {
                indexWeek++;
                numberWeek++;
            }
            if (!weeks[indexWeek]) {
                weeks[indexWeek] = {
                    index: indexWeek,
                    id: numberWeek,
                    days: []
                };
            }
            if (isFirstDay) {
                var DNfirst = new Date(year, month, number).getDay(); // День недели первого дня в структуре календаря
                if (DNfirst != 1) { // Первый день - не понедельник
                    if (DNfirst == 0) { DNfirst = 7; } // Первый день  - воскресенье
                    for (var i = 1; i < DNfirst; i++) {
                        weeks[indexWeek].days.push(i);
                    }
                }
                isFirstDay = false;
            }
            var day = {
                index: indexWeek,
                year: year,
                month: month,
                number: number,
                isToday: year == new Date().getFullYear() && month == new Date().getMonth() && number == new Date().getDate(),
                dayOfWeek: new Date(year, month, number).getDay(),
                isSelected: false
            };
            weeks[indexWeek].days.push(day);

            if (!months[indexMonth].weeks) {
                months[indexMonth].weeks = [];
            }
            if (months[indexMonth].weeks[indexWeekInMonth] && months[indexMonth].weeks[indexWeekInMonth].days.length == 7) {
                indexWeekInMonth++;
            }
            if (!months[indexMonth].weeks[indexWeekInMonth]) {
                months[indexMonth].weeks[indexWeekInMonth] = {
                    index: indexWeekInMonth,
                    days: []
                };
            }
            if (isFirstDayMonth) {
                var DNfirstDayMonth = new Date(year, month, number).getDay(); // День недели первого дня в структуре календаря
                if (DNfirstDayMonth != 1) { // Первый день - не понедельник
                    if (DNfirstDayMonth == 0) { DNfirstDayMonth = 7; } // Первый день  - воскресенье
                    for (var i = 1; i < DNfirstDayMonth; i++) {
                        months[indexMonth].weeks[indexWeekInMonth].days.push(i);
                    }
                }
                isFirstDayMonth = false;
            }
            months[indexMonth].weeks[indexWeekInMonth].days.push(day);
        };

        var daysOfWeek = [
            {id: 0, format_D: 'П', format_Dd: 'Пн'},
            {id: 1, format_D: 'В', format_Dd: 'Вт'},
            {id: 2, format_D: 'С', format_Dd: 'Ср'},
            {id: 3, format_D: 'Ч', format_Dd: 'Чт'},
            {id: 4, format_D: 'П', format_Dd: 'Пт'},
            {id: 5, format_D: 'С', format_Dd: 'Сб'},
            {id: 6, format_D: 'В', format_Dd: 'Вс'}
        ];

        var getDaysOfWeek = function() {
            return daysOfWeek;
        };

        var getMonthByYM = function(year, month) {
            for (var i = 0; i < rsCalendar.months.length; i++) {
                if (rsCalendar.months[i].year == year && rsCalendar.months[i].id == month) {
                    return rsCalendar.months[i];
                }
            }
        };

        var getMonthByIndex = function(index) {
            return rsCalendar.months[index];
        };

        var getDayByYMD = function(year, month, day) {
            for (var i = 0; i < rsCalendar.weeks.length; i++) {
                for (var j = 0; j < rsCalendar.weeks[i].days.length; j++) {
                    var d = rsCalendar.weeks[i].days[j];
                    if (d.number && d.year == year && d.month == month  && d.number == day) {
                        return rsCalendar.weeks[i].days[j];
                    }
                }
            }
        };

        var getWeekByYMD = function(year, month, day) {
            for (var i = 0; i < rsCalendar.weeks.length; i++) {
                for (var j = 0; j < rsCalendar.weeks[i].days.length; j++) {
                    var d = rsCalendar.weeks[i].days[j];
                    if (d.number && d.year == year && d.month == month  && d.number == day) {
                        return rsCalendar.weeks[i];
                    }
                }
            }
        };

        var getWeekByIndex = function(index) {
            return rsCalendar.weeks[index];
        };

        var getSelectedDay = function() {
            return selectedDay;
        };

        var setSelectedDay = function(day) {
            if (selectedDay) {
                selectedDay["isSelected"] = false;
            }
            selectedDay = day;
            selectedDay["isSelected"] = true;
        };

        return {
            getRSCalendar: getRSCalendar,
            getDaysOfWeek: getDaysOfWeek,
            getMonthByYM: getMonthByYM,
            getMonthByIndex: getMonthByIndex,
            getDayByYMD: getDayByYMD,
            getWeekByYMD: getWeekByYMD,
            getWeekByIndex: getWeekByIndex,
            getSelectedDay: getSelectedDay,
            setSelectedDay: setSelectedDay
        }

    }]);
})();