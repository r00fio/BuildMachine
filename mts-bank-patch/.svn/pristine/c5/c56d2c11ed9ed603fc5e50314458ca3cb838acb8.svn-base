/* Директивы для модуля app */
(function(config) {
    var app = angular.module('app');

    app.directive('rsIdea', ['$rootScope', function($rootScope) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                date: '=',
                subject: '=',
                desc: '=',
                isNew: '=',
                posAnswers: '=',
                negAnswers: '=',
                myAnswer: '=',
                foto: '=',
                proClick: '&',
                contraClick: '&'
            },
            link: function (scope, element, attrs) {
                if (scope.foto) {
                    scope.fotoUrl = $rootScope.getLogoUrl(scope.foto.url);
                }
            },
            template: '<div class="rs-idea-container" ng-click="isBodyExpanded = !isBodyExpanded">' +
                        '<div class="rs-idea-container-avatar"><img ng-if="foto" style="width: 100%; height: 100%;" ng-src="{{fotoUrl}}"/></div>' +
                        '<div class="rs-idea-container-header flex flex-middle">' +
                            '<div class="rs-idea-container-date">{{date | dateWithMonthName}}</div>' +
                            '<div class="rs-idea-container-new" ng-show="isNew"></div>' +
                        '</div>' +
                        '<div class="rs-idea-container-title">{{subject}}</div>' +
                        '<div class="rs-idea-container-body" ng-class="{\'rs-idea-container-body-expanded\': isBodyExpanded}">{{desc}}</div>' +
                        '<div class="rs-idea-container-footer flex flex-middle">' +
                            '<div class="rs-idea-container-footer-pro" ng-class="{\'rs-idea-my-answer\': myAnswer===true}" ng-click="proClick(); $event.stopPropagation()">{{posAnswers}}</div>' +
                            '<div class="rs-idea-container-footer-contra" ng-class="{\'rs-idea-my-answer\': myAnswer===false}" ng-click="contraClick(); $event.stopPropagation()">{{negAnswers}}</div>' +
                            '<div class="rs-idea-container-footer-more" ng-class="{\'rs-idea-container-footer-more-rotate\': isBodyExpanded}"></div>' +
                        '</div>' +
                    '</div>'
        };
    }]);

    app.directive('rsNews', [function() {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                date: '@',
                subject: '@',
                text: '@',
                isNew: '=',
                type: '@' // default - обычная новость | important - важная новость | promo - акция банка
            },
            template: '<div class="rs-news-container">' +
                        '<div class="rs-news-icon-container">' +
                            '<img ng-if="type == \'default\' || !type" style="width: 100%; height: 100%;" ng-src="img/ios/news-regular.svg"/>' +
                            '<img ng-if="type == \'important\'" style="width: 100%; height: 100%;" ng-src="img/ios/news-important.svg"/>' +
                            '<img ng-if="type == \'promo\'" style="width: 100%; height: 100%;" ng-src="img/ios/news-bank-promo.svg"/>' +
                        '</div>' +
                        '<div class="rs-news-container-header flex flex-middle">' +
                            '<div class="rs-news-container-date">{{date | dateWithMonthName}}</div>' +
                            '<div class="rs-news-container-new" ng-show="isNew"></div>' +
                        '</div>' +
                        '<div class="rs-news-container-title">{{subject}}</div>' +
                        '<div class="rs-news-container-body">{{text}}</div>' +
                    '</div>'
        };
    }]);

    app.directive('rsNotice', [function() {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                notice: '='
            },
            template: '<div ng-style="{background: \'white\'}" class="rs-notice flex flex-column">' +
                        '<div class="rs-notice-date">' +
                            '{{notice.date | dateWithMonthName}}' +
                            '<div ng-hide="notice.isRead" class="operation-category-point" style="background-color: #e0001b; float: right;"/>' +
                        '</div>' +
                        '<div class="rs-notice-type">{{notice.typeDesc}}</div>' +
                        '<div class="rs-notice-message">{{notice.message}}</div>' +
                        '<div ng-if="notice.result != null" class="rs-notice-result" ng-class="{\'rs-notice-success\': notice.result == \'SUCCESS\', \'rs-notice-failure\': notice.result ==  \'NOTSUCCESS\'}">{{notice.resultDesc}}</div>' +
                    '</div>'
        };
    }]);

    app.directive('rsChat', [function () {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {
                onSendClick: '&',
                onPhotoClick: '&',
                onPullToRefresh: '&'
            },
            controller: ['$scope', '$window', '$timeout', 'sys', function ($scope, $window, $timeout, sys) {
                var $$ = $window.Dom7;
                var myApp = sys.getFramework7App();

                // Init Chat
                var myMessages = myApp.messages('.messages', {autoLayout: true});

                // Init Messagebar
                var myMessagebar = myApp.messagebar('.messagebar');
                // Постоянный фокус на поле ввода сообщения
                var blurHandler = function (evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    if ($('#link-send').hasClass('activated')) {
                        myMessagebar.textarea.focus();
                    }
                };

                $$('.messagebar textarea').on('blur', blurHandler);
                $scope.messageText = '';

                this.doLayout = function () {
                    myMessages.layout();
                };
                this.scrollToNewMsg = function () {
                    myMessages.scrollMessages();
                };

                // Handle send click
                var photoLinkHandler = function(evt){
                    $scope.onPhotoClick({$event: evt});
                };

                $$('.messagebar #link-photo').on('click', photoLinkHandler);

                // Handle send click
                var sendLinkHandler = function(evt){
                    var result = $scope.onSendClick({text: myMessagebar.value()});
                    if (result) {
                        myMessagebar.clear();
                    }
                };

                $$('.messagebar #link-send').on('click', sendLinkHandler);

                $scope.destroyChat = function(){
                    $$('.messagebar #link-photo').off('click', photoLinkHandler);
                    $$('.messagebar #link-send').off('click', sendLinkHandler);
                    $$('.messagebar textarea').off('blur', blurHandler);
                    myMessages.destroy();
                    myMessagebar.destroy();
                };

                $timeout(function(){
                    var ptrContent = $$('.pull-to-refresh-content');
                    myApp.initPullToRefresh(ptrContent);
                    ptrContent.on('refresh', function (evt) {
                        $scope.onPullToRefresh({$event: evt});
                    });
                    if (!$$('.messages .message').length) {
                        myApp.pullToRefreshTrigger(ptrContent);
                    }
                });
            }],
            link: function (scope, element, attrs, ctrls, transclude) {
                var onKeyboardShow = function() {
                    scope.$root.showIosTabbar = false;
                    scope.$apply();
                };
                var onKeyboardHide = function() {
                    scope.$root.showIosTabbar = true;
                    scope.$apply();
                };
                var scrollToTop = function() {
                    window.Dom7('.page-content').scrollTop(0, 500);
                };
                window.addEventListener('statusTap', scrollToTop, false);
                var header = angular.element('ion-header-bar');
                ionic.on('tap', scrollToTop, header[0]);
                scope.$on('$destroy', function() {
                    window.removeEventListener('statusTap', scrollToTop, false);
                    ionic.off('tap', scrollToTop, header[0]);
                });
                if (scope.$root.platform == 'ios') {
                    window.addEventListener('keyboardWillHide', onKeyboardHide, false);
                    window.addEventListener('keyboardWillShow', onKeyboardShow, false);
                    scope.$on('$destroy', function() {
                        window.removeEventListener('keyboardWillHide', onKeyboardHide, false);
                        window.removeEventListener('keyboardWillShow', onKeyboardShow, false);
                    });
                }
                element.on('$destroy', function() {
                    scope.destroyChat();
                });
            },
            template: '<div class="page has-header rs-online-chat">' +
                        '<div class="toolbar messagebar">' +
                            '<div class="toolbar-inner">' +
                                '<a href="#" id="link-photo" class="link" ng-click="$event.preventDefault()"></a>' +
                                '<textarea ng-model="messageText" placeholder="Сообщение"></textarea>' +
                                '<a href="#" id="link-send" class="link" ng-disabled="messageText == \'\'" ng-click="$event.preventDefault()">Отпр.</a>' +
                            '</div>' +
                        '</div>' +
                        '<div class="page-content messages-content pull-to-refresh-content">' +
                            '<div class="pull-to-refresh-layer"><div class="preloader"></div></div>' +
                            '<div class="messages">' +
                                '<transclude-replace></transclude-replace>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
        };
    }]);

    app.directive('rsChatMessage', ['$timeout', '$filter', 'sys', function($timeout, $filter, sys) {
        return {
            restrict: 'EA',
            require: '^rsChat',
            replace: true,
            scope: {
                text: '=',
                attachments: '=',
                isMyMsg: '=',
                time: '='
            },
            link: function(scope, element, attrs, chatCtrl){
                scope.platform = sys.getPlatform();
                $timeout(function () {
                    chatCtrl.doLayout();
                });
                if (!element[0].nextElementSibling) {
                    // Если сообщение последнее (внизу контейнера), то нужна прокрутка
                    $timeout(function () {
                        chatCtrl.scrollToNewMsg();
                    });
                }

                var imgRegExp = /^.*\.(jpg|jpeg|gif|png|bmp)\s*$/i;

                var imgAttms;
                scope.extractImages = function(){
                    return imgAttms
                        || ( imgAttms = $filter('filter')(scope.attachments, function(attachment){ return imgRegExp.test(attachment && attachment.name); }) );
                };

                var customAttms;
                scope.extractCustomFiles = function(){
                    return customAttms
                        || ( customAttms = $filter('filter')(scope.attachments, function(attachment){ return !imgRegExp.test(attachment && attachment.name); }) );
                };

                scope.extractFileName = function(nameWithExt) {
                    nameWithExt = angular.isString(nameWithExt) ? nameWithExt : '';
                    var result = /(.*)\..*/.exec(nameWithExt);
                    return result ? result[1] : nameWithExt;
                };

                scope.extractFileExt = function(nameWithExt) {
                    var result = /.*\.(.*)/.exec(nameWithExt);
                    return result ? result[1] : '';
                };

                var getHumainFileSizeDesc = function(fileSize){
                    fileSize = Math.floor(fileSize);
                    var n = Math.floor((fileSize + '').length / 3) - ((fileSize + '').length % 3 ? 0 : 1);
                    n = n > 3 ? 3 : n;
                    var unitName;
                    switch(n) {
                        case 1: unitName = ' KB'; break;
                        case 2: unitName = ' MB'; break;
                        case 3: unitName = ' GB'; break;
                        default: unitName = ' B';
                    }
                    var result;
                    if (n > 0) {
                        result = (fileSize / Math.pow(1024, n)).toFixed(1) + unitName;
                    } else {
                        result = fileSize + unitName;
                    }

                    return result;
                };

                scope.getFileSize = function(base64Data) {
                    var fileSize;
                    try {
                        // Точный размер
                        //fileSize = CryptoUtils.BYTEBUFF.create().decodeFromBase64(base64Data).unpack().length;

                        // Приблизительный размер
                        fileSize = base64Data.length * 0.7501875468867217;
                    } catch(e) {}

                    return fileSize ? getHumainFileSizeDesc(fileSize) : '';
                };

            },
            template: '<div class="transcluded-chat-message">' +
                        '<div ng-if="platform===\'ios\'" class="messages-date">{{time.format(\'dd mmmm\')}},<span>{{time.format(\'HH:MM\')}}</span></div>' +
                        '<div class="message" ng-class="{\'message-sent\': isMyMsg, \'message-received\': !isMyMsg}">' +
                            '<div class="message-text">' +
                                '<div ng-repeat="f in extractCustomFiles()" class="message-text-inner" ' +
                                        'ng-class="{\'message-has-attachments\': extractCustomFiles().length}" ng-bind="extractFileName(f.name)">' +
                                '</div>' +
                                '<div ng-if="text.trim()" class="message-text-inner" ng-style="{height: text.trim() ? \'auto\' : \'18px\'}" ng-bind="text"></div>' +
                                '<img ng-repeat="attm in extractImages()" ng-src="data:image/jpeg;base64,{{attm.data}}"/>' +
                            '</div>' +
                            '<div ng-if="platform!==\'ios\'" class="message-label" ng-bind="time.format(\'dd mmmm, HH:MM\')"></div>' +
                            '<div ng-if="platform===\'ios\' && extractCustomFiles().length" class="message-label">{{extractFileExt(extractCustomFiles()[0].name).toUpperCase()}} {{getFileSize(extractCustomFiles()[0].data)}}</div>' +
                        '</div>' +
                    '</div>'
        };
    }]);

    app.directive('rsHeader', ['$window', '$rootScope', function($window, $rootScope) {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {
                lbtnClass: '@',
                lbtnAction: '&',
                rbtnClass: '@',
                rbtnAction: '&'
            },
            link: function (scope, element, attrs) {
                scope.platform = $rootScope.platform;
                if (angular.isUndefined(attrs.lbtnClass)) {
                    switch($rootScope.platform) {
                        case 'ios':
                            scope.lbtnDefaultClass = 'icon-back';
                            break;
                        case 'android':
                            scope.lbtnDefaultClass = 'ion-android-menu';
                            break;
                        default:
                            scope.lbtnDefaultClass = '';
                    }
                }
                if (angular.isUndefined(attrs.lbtnAction)) {
                    switch($rootScope.platform) {
                        case 'ios':
                            scope.lbtnDefaultAction = function() { $window.history.back(); };
                            break;
                        case 'android':
                            scope.lbtnDefaultAction = function() { $rootScope.openPanel() };
                            break;
                        default:
                            scope.lbtnDefaultAction = function() {};
                    }
                }
            },
            templateUrl: 'templates/' + $rootScope.platform + '/header.html'
        };
    }]);

    app.directive('rsWaiter', ['$compile', '$timeout', 'sys', function($compile, $timeout, sys) {
        return {
            restrict: 'A',
            priority: 1001,
            link: function (scope, element, attrs) {
                if (!('ngIf' in attrs) || scope.$eval(attrs.ngIf)) {
                    var spinnerIcon = sys.getPlatform() == 'android' ? 'android' : (/^big$/i.test(attrs.rsWaiterSize)) ? 'ios' : 'ios-small';
                    var waiterMask = angular.element('<ion-spinner icon="' + spinnerIcon + '" class="flex flex-center flex-middle padding-5px"></ion-spinner>');
                    if ('rsWaiterClass' in attrs) {
                        waiterMask.addClass(attrs.rsWaiterClass);
                    }

                    var styleObj = scope.$eval(attrs.rsWaiterStyle);
                    var rsWaiterStyle = angular.isObject(styleObj) ? styleObj : {};

                    var startWatch = function(){
                        scope.$watch(attrs.rsWaiter, function (newValue) {
                            if (angular.isUndefined(newValue)) {
                                waiterMask.show();
                            } else {
                                waiterMask.hide();
                            }
                        });
                    };

                    // Если на элементе задан ng-repeat, то нужно добавлять прелоадер к родителю
                    if (attrs.ngRepeat) {
                        ($compile(waiterMask)(scope)).insertBefore(element);
                        waiterMask.css(rsWaiterStyle);
                        startWatch();
                    } else {
                        $timeout(function(){
                            waiterMask.css({ display: 'none', position: 'absolute', 'z-index': 1 });
                            element.append($compile(waiterMask)(scope));

                            waiterMask.css({
                                display: 'block',
                                'margin-left': (element.width() - waiterMask.outerWidth()) / 2,
                                'margin-top': (element.height() - waiterMask.outerHeight()) / 2
                            });

                            waiterMask.css(rsWaiterStyle);

                            startWatch();
                        });
                    }
                }
            }
        };
    }]);

    /**
     * stop-ion-content-scroll используется для запрета вертикальной прокрутки ion контента при старте
     * горизонтального дрэггинга элемента списка fw7 со свайпами в этом контенте
     *
     * Для безусловного запрета прокрутки ion контента используется директива data-tap-disabled="true" на любом контейнере
     */
    app.directive('stopIonContentScroll', ['$ionicGesture', '$ionicScrollDelegate', function ($ionicGesture, $ionicScrollDelegate) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                $ionicGesture.on('dragstart', function(event) {
                    var direction = event.gesture.direction;
                    if (direction == 'left' || direction == 'right') {
                        $ionicScrollDelegate.freezeScroll(true);
                    }
                }, element);

                $ionicGesture.on('dragend', function(event){
                    $ionicScrollDelegate.freezeScroll(false);
                }, element);
            }
        };
    }]);

    app.directive('rsPanel', [function() {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {
                headerText: '@'
            },
            template: '<div class="rs-content-panel">' +
                        '<div class="rs-content-panel-header" ng-bind="headerText" ng-show="headerText"></div>' +
                        '<div class="rs-content-panel-body"><transclude-replace></transclude-replace></div>' +
                    '</div>'
        };
    }]);

    app.directive('rsThermometer', [function() {
        return {
            restrict: 'EA',
            replace: true,
            transclude: false,
            scope: {
                progress: '@',
                bgClass: '@',
                fgClass: '@',
                bgStyle: '@',
                fgStyle: '@'
            },
            template: '<div ng-style="{overflow:\'hidden\'}" class="rs-thermometer-bg{{bgClass ? \' \' + bgClass : \'\'}}" ng-style="{{bgStyle}}">' +
                        '<div style="height:100%;" ng-style="{width: progress > 0 ? \'{{progress}}%\' : \'0\', {{fgStyle}} }" class="rs-thermometer-fg{{fgClass ? \' \' + fgClass : \'\'}}"></div>' +
                    '</div>'
        };
    }]);

    app.directive('fw7Li', [function() {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {
                title: '@',
                itemClass: '@',
                multiline: '@'
            },
            template: '<li class="item-content" ng-class="{\'{{itemClass}}\': itemClass}">' +
                            '<div class="item-inner">' +

                                '<div ng-if="!multiline" class="fw7-li item-title width100pc">{{title}}</div>' +
                                '<div ng-if="!multiline" class="fw7-li item-after"><transclude-replace></transclude-replace></div>' +

                                '<div ng-if="multiline" class="fw7-li-multiline table-fixed-width100pc min-height-33px">' +
                                    '<div class="table-row">' +
                                        '<div class="item-title">{{title}}</div>' +
                                    '</div>' +
                                    '<div class="table-row fw7-li-content-text">' +
                                        '<transclude-replace></transclude-replace>' +
                                    '</div>' +
                                '</div>' +

                            '</div>' +
                        '</li>'
        };
    }]);

    app.directive('fw7LiSelect', [function() {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {
                title: '@',
                itemClass: '@',
                link: '@'
            },
            template: '<li class="item-content fw7-li-select" ng-class="{\'{{itemClass}}\': itemClass, \'item-link\': link}">' +
                            '<div class="item-inner">' +
                                '<div class="table-fixed-width100pc">' +
                                    '<div class="table-row">' +
                                        '<div class="table-cell text-valign-middle">' +
                                            '<div class="item-title">{{title}}</div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="table-row">' +
                                        '<div class="table-cell text-valign-middle fw7-li-content-text">' +
                                            '<transclude-replace></transclude-replace>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</li>'
        };
    }]);

    app.directive('rsCut', [function() {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                elements: '@',
                isHidden: '='
            },
            link: function(scope, element, attrs){
                attrs.$observe('elements', function(newVal){
                    var elems = scope.$eval(newVal);
                    scope.hiddenElements = angular.isArray(elems) ? elems : [];
                });
            },
            template: '<li class="list-group-title item-inner no-background" ng-show="hiddenElements.length" ng-click="isHidden = !isHidden && hiddenElements.length" ng-class="{\'expandable\':isHidden, \'not-expandable\':!isHidden}">' +
                            '{{hiddenElements.length}} {{\'скрыты\' + (hiddenElements.length == 1 ? \'й\': \'х\')}}' +
                            '<div class="expandable-icon" ng-class="{\'rotate-180\': !isHidden}"></div>' +
                        '</li>'
        };
    }]);

app.directive('depositComparisonItem', ['$sce', '$rootScope', function($sce, $rootScope) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                deposit: '=',
                depInfoSref: '@',
                allowComparison: '='
            },
            link: function(scope){
                scope.trustedDepositInfo = $sce.trustAsHtml(scope.deposit.addInfo);
                scope.logoUrl = $rootScope.getLogoUrl(scope.deposit.logo.url);
            },
            template: '<div class="list-block" ng-style="{margin: \'0 0 15px 0\'}">' +
                        '<ul ui-sref="{{depInfoSref}}">' +
                            '<li class="item-content deposit-comparison-info">' +
                                '<div class="item-inner flex-start">' +
                // style="background-image: data:image/jpeg;base64,{{deposit.logo}}"
                                    '<img ng-src="{{logoUrl}}" class="deposit-comparison-avatar"/>' +
                                    '<div class="item-title">' +
                                        '<div class="deposit-comparison-header">{{deposit.desc}}</div>' +
                                        '<div class="deposit-comparison-desc">' +
                                            '<div ng-bind-html="trustedDepositInfo" class="select-deposit-info"></div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="item-after">{{deposit.rate}} %</div>' +
                                '</div>' +
                            '</li>' +
                            '<li class="item-content deposit-comparison-expected-amount" ng-show="deposit.depositedAmount && deposit.finalAmount">' +
                                '<div class="item-inner">' +
                                    '<span>Ожидаемая сумма: {{deposit.finalAmount | defaultSum}}<span currency="{{deposit.depositedCurrency}}"></span> (+{{(deposit.finalAmount - deposit.depositedAmount) | defaultSum}})</span>' +
                                '</div>' +
                            '</li>' +
                            '<li class="item-content deposit-comparison-toggling" ng-show="allowComparison" ng-click="$event.stopPropagation()">' +
                                '<div class="item-inner">' +
                                    '<div class="item-title width100pc">Добавить к сравнению</div>' +
                                    '<div class="item-after">' +
                                        '<rs-toggle ng-model="deposit.isSelected"></rs-toggle>' +
                                    '</div>' +
                                '</div>' +
                            '</li>' +
                        '</ul>' +
                    '</div>'

        };
    }]);

    app.directive('dynamic', function ($compile) {
        return {
            restrict: 'A',
            replace: true,
            link: function (scope, ele, attrs) {
                scope.$watch(attrs.dynamic, function(html) {
                    ele.html(html);
                    $compile(ele.contents())(scope);
                });
            }
        };
    });

    app.directive('currency', [function() {
        return {
            restrict: 'A',
            link: function (scope, elem, attrs) {
                attrs.$observe('currency', function() {
                    var innerHtml = '',
                        currency = attrs.currency.toUpperCase();

                    switch(currency) {
                        case 'RUB':
                            innerHtml = '<span class="currency">&nbsp;&#8381;</span>';
                            break;
                        case 'USD':
                            innerHtml = '<span class="currency">&nbsp;$</span>';
                            break;
                        case 'EUR':
                            innerHtml = '<span class="currency">&nbsp;&euro;</span>';
                            break;
                        case 'GBP':
                            innerHtml = '<span class="currency">&nbsp;&pound;</span>';
                            break;
                        case 'CHF':
                            innerHtml = '<span class="currency">&nbsp;&#8355;</span>';
                            break;
                        case 'AUD':
                            innerHtml = '<span class="currency">&nbsp;A$</span>';
                            break;
                        case 'CAD':
                            innerHtml = '<span class="currency">&nbsp;C$</span>';
                            break;
                        case 'JPY':
                        case 'CNY':
                            innerHtml = '<span class="currency">&nbsp;&yen;</span>';
                            break;
                        default:
                            innerHtml = '&nbsp;' + currency;
                    }

                    elem.html(innerHtml);
                });
            }
        };
    }]);

    /**
     * Элемента списка с переходом на другую страницу
     *
     * Пример:
     * <rs-select header-text="Способ оплаты" value-text="значение" ui-sref="your.link"></rs-select>
     */
    app.directive('rsSelect', ['sys', function(sys) {
        return {
            restrict: 'AE',
            replace: true,
            scope: {
                headerText: '@',
                headerClass: '@',
                valueText: '@',
                valueClass: '@'
            },
            link: function(scope){
                scope.platform = sys.getPlatform();
            },
            template:
            '<li class="item-content payment-field-height" ng-class="{\'item-link\': platform == \'ios\'}">' +
                '<div ng-if="platform == \'ios\'" class="item-inner">' +
                    '<div class="{{\'item-title \' + (headerClass ? headerClass : \'\')}}" ' +
                        'ng-bind="headerText"></div>' +
                    '<div class="{{\'item-after \' + (valueClass ? valueClass : \'\')}}" ' +
                        'ng-bind="valueText"></div>' +
                '</div>' +
                '<div ng-if="platform != \'ios\'" class="item-inner">' +
                    '<div class="table-fixed-width100pc">' +
                        '<div class="table-row">' +
                            '<div class="{{\'table-cell \' + (headerClass ? headerClass : \'text-gray title-simple-item \')}}" ' +
                                'ng-bind="headerText"></div>' +
                        '</div>' +
                        '<div class="table-row">'+
                            '<span class="{{\'table-cell text-15px title-simple-value \' + (valueClass ? valueClass : \'white-space-pre-line\')}}" ' +
                                'ng-bind="valueText"></span>'+
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</li>'
        };
    }]);

    /**
     *  Директива для инициализации FW7 Picker (iOS)
     */
    app.directive('rsDatePickerIos', ['$timeout', 'sys', function($timeout, sys) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                valueDate: '=',
                title: '@',
                fieldId: '@',
                lowerBound: '&',
                upperBound: '&',
                onChangeDate: '&',
                placeholder: '@',
                hideDate: '='
            },
            link: function (scope, element, attrs) {
                scope.isOpen = false;
                scope.checkBoundaries = function() {
                    var newDate = new Date(scope.valueDate.getFullYear(), scope.valueDate.getMonth(), scope.valueDate.getDate());
                    var bound = scope.upperBound();
                    if (bound && newDate > bound.setHours(0,0,0,0)) {
                        scope.valueDate.setFullYear(bound.getFullYear(), bound.getMonth(), bound.getDate());
                        return false;
                    }
                    bound = scope.lowerBound();
                    if (bound && newDate < bound.setHours(0,0,0,0)) {
                        scope.valueDate.setFullYear(bound.getFullYear(), bound.getMonth(), bound.getDate());
                        return false;
                    }
                    return true;
                };
                scope.$watch('valueDate', function(newVal, oldVal) {
                    if (newVal !== oldVal && scope.picker) {
                        scope.picker.value = [newVal.getDate(), newVal.getMonth(), newVal.getFullYear()];
                        scope.picker.setValue([newVal.getDate(), newVal.getMonth(), newVal.getFullYear()]);
                    }
                });
                scope.containerId = scope.fieldId + '-container';
                scope.initPicker = function() {
                    var fw7App = sys.getFramework7App();
                    var initialValue = scope.valueDate ? [
                        scope.valueDate.getDate(),
                        scope.valueDate.getMonth(),
                        scope.valueDate.getFullYear()
                    ] : [];
                    jQuery('#' + scope.containerId).attr('style', 'display: block !important');
                    scope.picker = fw7App.picker({
                        input: '#' + scope.fieldId,
                        container: '#' + scope.containerId,
                        toolbar: false,
                        rotateEffect: true,
                        value: initialValue,
                        onChange: function (picker, values, displayValues) {
                            var daysInMonth = new Date(picker.value[2], picker.value[0] * 1 + 1, 0).getDate();
                            if (values[1] > daysInMonth) {
                                picker.cols[1].setValue(daysInMonth);
                            }
                            scope.valueDate.setFullYear(values[2], values[1], values[0]);
                            if (!scope.checkBoundaries()) {
                                picker.setValue([
                                    scope.valueDate.getDate(),
                                    scope.valueDate.getMonth(),
                                    scope.valueDate.getFullYear()
                                ]);
                            }
                            if (scope.isOpen) {
                                scope.valueChanged = true;
                                scope.$applyAsync();
                            }
                        },

                        formatValue: function (p, values, displayValues) {
                            if (scope.hideDate) {
                                return '**.**.****';
                            } else {
                                return new Date(values[2], values[1], values[0]).format("dd.mm.yyyy");
                            }
                        },

                        cols: [
                            // Days
                            {
                                values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
                            },
                            // Months
                            {
                                values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                                displayValues: ('января февраля марта апреля мая июня июля августа сентября октября ноября декабря').split(' '),
                                textAlign: 'left'
                            },
                            // Years
                            {
                                values: (function () {
                                    var arr = [];
                                    for (var i = 1950; i <= 2030; i++) {
                                        arr.push(i);
                                    }
                                    return arr;
                                })()
                            }
                        ]
                    });
                    //Инициализация не работает нормально в fw7
                    scope.picker.value = initialValue;
                    jQuery('#' + scope.containerId).attr('style', '');
                };
                if (!scope.picker) {
                    $timeout(function() {
                        scope.initPicker();
                    });
                    if (scope.valueDate) {
                        jQuery('#' + scope.fieldId).val(scope.valueDate.format('dd.mm.yyyy'));
                    }
                }
                scope.$on('value-changed-datepicker-ios', function(event, id) {
                    if (scope.isOpen) {
                        scope.valueChanged = true;
                    }
                });
                scope.$on('close-ios-datepickers', function(event, id) {
                    if (scope.isOpen) {
                        if (id) {
                            if (id != scope.fieldId) {
                                scope.isOpen = false;
                                if (scope.valueChanged) {
                                    scope.valueChanged = false;
                                    scope.$root.$broadcast('value-changed-datepicker-ios');
                                }
                            }
                        } else {
                            scope.isOpen = false;
                        }
                    }
                });

                //Скрытые FW7 пикеры ломаются при открытии модального окна ionic
                scope.$on('modal.hidden', function() {
                    if (scope.picker && !scope.isOpen) {
                        $timeout(function() {
                            scope.picker.destroy();
                            jQuery('#' + scope.containerId).children().remove();
                            scope.initPicker();
                        });
                    }
                });
                scope.togglePicker = function() {
                    if (scope.isOpen) {
                        scope.isOpen = false;
                        if (scope.valueChanged) {
                            scope.valueChanged = false;
                            scope.onChangeDate();
                        }
                    } else {
                        if (!scope.valueDate) {
                            scope.valueDate = new Date();
                        }
                        scope.isOpen = true;
                        scope.$root.$broadcast('close-ios-datepickers', scope.fieldId);
                    }
                };
            },
            template:
                '<div class="rs-datepicker-ios">'
                    + '<div class="item-content" ng-click="togglePicker()">'
                        + '<div class="item-inner">'
                            + '<div class="item-title" style="width: 40%" ng-bind="title"></div>'
                            + '<div class="item-input" style="width: 60%">'
                                + '<input type="text" readonly id="{{fieldId}}" ng-style="{color: isOpen ? \'#24A7B3\' : \'#000\'}" style="text-align: right;" placeholder="{{placeholder}}">'
                            + '</div>'
                        + '</div>'
                    + '</div>'
                    + '<div id="{{containerId}}" ng-show="isOpen"></div>'
                + '</div>'
        };
    }]);

    /**
     *  Директива для инициализации FW7 Calendar (Android)
     */
    app.directive('rsDatePickerAndroid', ['$timeout', '$ionicPlatform', 'sys',
                    function($timeout, $ionicPlatform, sys) {
        return {
            restrict: 'A',
            scope: {
                valueDate: '=?',
                dateFormat: '@',
                lowerBound: '&',
                upperBound: '&',
                onChangeDate: '&'
            },
            link: function (scope, element, attrs) {
                scope.checkBoundaries = function() {
                    var newDate = new Date(scope.valueDate.getFullYear(), scope.valueDate.getMonth(), scope.valueDate.getDate());
                    var bound = scope.upperBound();
                    if (bound && newDate > bound.setHours(0,0,0,0)) {
                        scope.valueDate.setFullYear(bound.getFullYear(), bound.getMonth(), bound.getDate());
                        return false;
                    }
                    bound = scope.lowerBound();
                    if (bound && newDate < bound.setHours(0,0,0,0)) {
                        scope.valueDate.setFullYear(bound.getFullYear(), bound.getMonth(), bound.getDate());
                        return false;
                    }
                    return true;
                };

                scope.close = function() {
                    if (scope.picker && scope.picker.opened) {
                        scope.picker.close();
                    }
                }
                scope.$on('close-android-datepickers', function() {
                    scope.close();
                });
                scope.$on('$destroy', function() {
                    scope.close();
                    if (scope.unregister) {
                        scope.unregister();
                    }
                });
                scope.$watch('valueDate', function(newVal, oldVal) {
                    if (newVal !== oldVal && scope.picker) {
                        scope.picker.value = [newVal];
                        scope.picker.setValue([newVal]);
                    }
                });
                if (!scope.picker) {
                    $timeout(function() {
                        var fw7App = sys.getFramework7App();
                        scope.picker = fw7App.calendar({
                            input: '#' + attrs.id,
                            //value: [scope.valueDate],
                            toolbar: true,
                            dateFormat: scope.dateFormat? scope.dateFormat : 'd M yyyy',
                            weekHeader: true,
                            onChange: function (picker, value) {
                                var newVal = new Date(value[0]);
                                scope.valueDate.setFullYear(newVal.getFullYear(), newVal.getMonth(), newVal.getDate());
                                if (!scope.checkBoundaries()) {
                                    picker.value = [scope.valueDate];
                                }
                                scope.$apply();
                                scope.onChangeDate({ 'newVal': scope.valueDate });
                            },
                            onOpen: function(picker) {
                                scope.unregister = $ionicPlatform.registerBackButtonAction(function() {
                                    scope.close();
                                }, 401);
                            },
                            onClose: function() {
                                if (scope.unregister) {
                                    scope.unregister();
                                    scope.unregister = null;
                                }
                            },
                            closeOnSelect: true,
                            monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
                            dayNamesShort: ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'],
                            monthNamesShort: ['января', 'февраля', 'марта', 'апреля', 'май', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
                            toolbarTemplate: '<div class="toolbar calendar-custom-toolbar">' +
                            '<div style="position: absolute; height: 205px; background: #24A7B3; left: 0; right: 0; top: -205px; z-index: 11501; display: block;">' +
                            '<div style="height: 35px; width: 100%; background-color: #168E99; text-align: center; display: table;">' +
                            '<div style="color: #FFF; text-align: center; font-size: 14px; display: table-cell; vertical-align: middle;">' + ((new Date()).format("dddd")) + '</div>' +
                            '</div>' +
                            '<div style="color: #FFF; height: 30px;text-align: center; font-size: 26px;">' + ((new Date()).format("mmmm")).toUpperCase() + '</div>' +
                            '<div style="color: #FFF; height: 100px;text-align: center; font-size: 90px;">' + ((new Date()).format("d")) + '</div>' +
                            '<div style="color: #FFF; height: 30px;text-align: center; font-size: 26px; opacity: 0.5;">' + ((new Date()).format("yyyy")) + '</div>' +
                            '</div>' +
                            '<div class="toolbar-inner">' +
                            '<div class="left"></div>' +
                            '<div class="center" style="text-align: center;"><span class="current-month-value"></span>, <span class="current-year-value"></span></div>' +
                            '<div class="right"></div>' +
                            '</div>' +
                            '</div>'
                        });
                        //Инициализация не работает нормально в fw7
                        if (scope.valueDate) {
                            scope.picker.value = [scope.valueDate];
                            jQuery('#' + attrs.id).val(scope.valueDate.format('d') + ' ' + scope.picker.params.monthNamesShort[scope.valueDate.getMonth()] + ' ' + scope.valueDate.format('yyyy'));
                        } else {
                            scope.valueDate = new Date();
                            jQuery('#' + attrs.id).val('');
                        }
                    });
                }
            }
        };
    }]);



    /**
     *  Ещё одна реализация пикера дат на основе FW7 Calendar, на этот раз работающая с ngModel
     */
    app.directive('rsDatePicker', ['$timeout', 'sys', '$ionicPlatform', '$parse', function($timeout, sys, $ionicPlatform, $parse) {
        var isIOS = sys.getPlatform() == 'ios';
        var initAndroid = function(attrs, scope, element) {
            var fw7App = sys.getFramework7App();
            scope.picker = fw7App.calendar({
                input: element[0],
                toolbar: true,
                weekHeader: true,
                dateFormat: scope.dateFormat? scope.dateFormat : 'd M yyyy',
                onOpen: function (picker) {
                    scope.unregister = $ionicPlatform.registerBackButtonAction(function () {
                        if (picker) {
                            picker.close();
                        }
                    }, 401);
                },
                onClose: function () {
                    if (scope.unregister) {
                        scope.unregister();
                        scope.unregister = null;
                    }
                },
                closeOnSelect: true,
                monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
                dayNamesShort: ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'],
                monthNamesShort: ['января', 'февраля', 'марта', 'апреля', 'май', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
                toolbarTemplate: '<div class="toolbar calendar-custom-toolbar">' +
                '<div style="position: absolute; height: 205px; background: #24A7B3; left: 0; right: 0; top: -205px; z-index: 11501; display: block;">' +
                '<div style="height: 35px; width: 100%; background-color: #168E99; text-align: center; display: table;">' +
                '<div style="color: #FFF; text-align: center; font-size: 14px; display: table-cell; vertical-align: middle;">' + ((new Date()).format("dddd")) + '</div>' +
                '</div>' +
                '<div style="color: #FFF; height: 30px;text-align: center; font-size: 26px;">' + ((new Date()).format("mmmm")).toUpperCase() + '</div>' +
                '<div style="color: #FFF; height: 100px;text-align: center; font-size: 90px;">' + ((new Date()).format("d")) + '</div>' +
                '<div style="color: #FFF; height: 30px;text-align: center; font-size: 26px; opacity: 0.5;">' + ((new Date()).format("yyyy")) + '</div>' +
                '</div>' +
                '<div class="toolbar-inner">' +
                '<div class="left"></div>' +
                '<div class="center" style="text-align: center;"><span class="current-month-value"></span>, <span class="current-year-value"></span></div>' +
                '<div class="right"></div>' +
                '</div>' +
                '</div>'
            });
        };

        var initIOS = function(attrs, scope, element, value) {
            var fw7App = sys.getFramework7App();
            var parent =  element.parents('.item-content').eq(0);
            var container = angular.element('<div/>');
            container.insertAfter(parent);
            parent.off('click');
            var defaultColor = element.css('color');
            parent.on('click', function () {
                container.toggle();
                element.css('color', (container.css('display') == 'block') ? '#24A7B3' : defaultColor);
            });
            container.show();
            var init = true;
            if (value) {
                init = false;
            } else {
                value = new Date();
            }
            var initialValue = [value.getDate(), value.getMonth(), value.getFullYear()];
            scope.picker = fw7App.picker({
                input: element[0],
                value: initialValue,
                container: container[0],
                toolbar: false,
                rotateEffect: true,
                formatValue: function (p, values, displayValues) {
                    if (init) {
                        init = false;
                        return '';
                    }
                    return new Date(values[2], values[1], values[0]).format("dd.mm.yyyy");
                },
                onChange: function (picker, values, displayValues) {
                    var daysInMonth = new Date(picker.value[2], picker.value[0] * 1 + 1, 0).getDate();
                    if (values[1] > daysInMonth) {
                        picker.cols[1].setValue(daysInMonth);
                    }
                },

                cols: [
                    // Days
                    {
                        values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
                    },
                    // Months
                    {
                        values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                        displayValues: ('января февраля марта апреля мая июня июля августа сентября октября ноября декабря').split(' '),
                        textAlign: 'left'
                    },
                    // Years
                    {
                        values: (function () {
                            var arr = [];
                            for (var i = 1950; i <= 2030; i++) {
                                arr.push(i);
                            }
                            return arr;
                        })()
                    }
                ]
            });

            container.hide();

        };

        return {
            restrict: 'A',
            require: '?ngModel',
            priority: 1,
            scope: {
                dateFormat: '@'
            },
            link: function (scope, element, attrs, ngModelCtrl) {
                ngModelCtrl.$parsers.push(function() {
                    if (!scope.picker) {
                        return ngModelCtrl.$modelValue;
                    }
                    if (isIOS) {
                        var values = scope.picker.value;
                        return new Date(values[2], values[1], values[0]);
                    }
                    return new Date(scope.picker.value[0]);
                });

                scope.$on('$destroy', function() {
                   if (scope.unregister) {
                       scope.unregister();
                       scope.unregister = null;
                   }
                });

                if (isIOS) {
                    var value = $parse(attrs.ngModel)(scope.$parent);
                    ngModelCtrl.$modelValue = value;
                    initIOS(attrs, scope, element, value);
                } else {
                    initAndroid(attrs, scope, element);
                }

                scope.setModelValue = function(newValue) {
                    if (ngModelCtrl) {
                        ngModelCtrl.$setViewValue(newValue);
                    }
                };

                var setPickerValue = function(date) {
                    if (angular.isUndefined(date)) {
                        return;
                    }
                    if (isIOS) {
                        scope.picker.value = [date.getDate(), date.getMonth(), date.getFullYear()];
                        scope.picker.updateValue();
                    } else {
                        scope.picker.open();
                        scope.picker.close();
                        scope.picker.value = [date];
                        scope.picker.updateValue();
                    }

                };

                if (ngModelCtrl) {
                    // Update the date picker when the model changes
                    ngModelCtrl.$render = function () {
                        var date = ngModelCtrl.$modelValue;
                        if (angular.isDefined(date) && angular.isDate(date)) {
                            setPickerValue(date);
                        }
                    };
                }

                //Скрытые FW7 пикеры ломаются при открытии модального окна ionic
                if (isIOS) {
                    scope.$on('modal.hidden', function () {
                        if (scope.picker) {
                            $timeout(function () {
                                scope.picker.destroy();
                                initIOS(attrs, scope, element);
                            });
                        }
                    });
                }
            }
        }
    }]);

    /**
     * Элемента списка - Карта
     *
     * Пример:
     * <rs-card product="myCard"></rs-card>
     *
     */
    app.directive('rsCard', ['sys', '$rootScope', function(sys, $rootScope) {
        return {
            restrict: 'AE',
            replace: true,
            scope: {
                product: '=',
                hiddenProduct: '=',
                showCardAccount: '@'
            },
            link: function(scope, element, attrs) {
                scope.platform = sys.getPlatform();
                if (scope.product.paymentSystemLogo) {
                    scope.paymentSystemLogoUrl = $rootScope.getLogoUrl(scope.product.paymentSystemLogo.url);
                }
                attrs.$observe('showCardAccount', function(newVal){
                    scope.showAccount = scope.$eval(newVal);
                    scope.$applyAsync();
                });
            },
            template:
            '<div class="card-finance-block">' +
                '<div ng-if="platform === \'ios\'" class="flex flex-middle">' +
                    '<div class="flex flex-middle">' +
                        '<div class="product-name-list">' +
                            '{{showAccount ? "Счет к карте " + product.name : product.name}}' +
                        '</div>' +
                        '<div class="fade"/>' +
                        '<div ng-class="{' +
                            '\'icon-status-product icon-blocked\': product.isBlocked || product.isForbidden,' +
                            '\'icon-status-product icon-reissued\': product.isReissued,' +
                            '\'icon-status-product icon-closed\': product.isClosed,' +
                            '\'icon-status-product icon-hidden\': hiddenProduct && !product.isBlocked && !product.isReissued && !product.isClosed && !product.isForbidden' +
                        '}"/>' +
                    '</div>' +
                    '<div class="right-item-product flex flex-middle">' +
                        '<img ng-if="paymentSystemLogoUrl" ng-src="{{paymentSystemLogoUrl}}" class="card-type-image-product"/>' +
                    '</div>' +
                '</div>' +
                '<div ng-if="platform === \'android\'" class="flex flex-middle flex-between">' +
                    '<div class="product-name-list" style="width: 100%;">' +
                        '{{showAccount ? "Счет к карте " + product.name : product.name}}' +
                    '</div>' +
                    '<div class="icon-card-type">' +
                        '<div class="flex flex-middle">' +
                            '<div ng-class="{' +
                                '\'icon-status-product icon-blocked\': product.isBlocked || product.isForbidden,' +
                                '\'icon-status-product icon-reissued\': product.isReissued,' +
                                '\'icon-status-product icon-closed\': product.isClosed,' +
                                '\'icon-status-product icon-hidden\': hiddenProduct && !product.isBlocked && !product.isReissued && !product.isClosed && !product.isForbidden' +
                            '}"/>' +
                            '<img ng-if="paymentSystemLogoUrl" ng-src="{{paymentSystemLogoUrl}}" class="card-type-image-product"/>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="flex flex-between flex-middle">' +
                    '<div class="text-gray text-13px number-card-finance-block">' +
                        '{{showAccount ? product.account : product.number}}' +
                    '</div>' +
                    '<div class="balance-card-finance-block">' +
                        '<span ng-bind="(product.balance | defaultSum)" class="text-15px"/>' +
                        '<span currency="{{product.currency}}" class="text-15px"/>' +
                    '</div>' +
                '</div>' +
            '</div>'
        };
    }]);

    /**
     * Элемента списка - Кредит
     *
     * Пример:
     * <rs-loan product="myLoan"></rs-loan>
     *
     */
    app.directive('rsLoan', ['sys', function(sys) {
        return {
            restrict: 'AE',
            replace: true,
            scope: {
                product: '=',
                hiddenProduct: '='
            },
            link: function(scope){
                scope.platform = sys.getPlatform();
            },
            template:
            '<div class="credit-finance-block">' +
                '<div ng-if="platform === \'ios\'" class="flex flex-middle product-tbl-right-summ">' +
                    '<div class="flex flex-middle product-tbl-right-summ-sell">' +
                        '<div class="product-name-list">' +
                            '{{product.name}}' +
                        '</div>' +
                        '<div class="fade"/>' +
                        '<div ng-class="{' +
                            '\'icon-status-product icon-closed\': product.isClosed,' +
                            '\'icon-status-product icon-hidden\': hiddenProduct && !product.isClosed' +
                        '}"/>' +
                    '</div>' +
                    '<div class="right-item-product-summ flex product-tbl-right-summ-sell" ng-show="product.state !== \'CLOSED\'">' +
                        '<span ng-bind="(product.currentDebt | defaultSum)" class="text-15px"/>' +
                        '<span currency="{{product.currency}}" class="text-15px"/>' +
                    '</div>' +
                '</div>' +
                '<div ng-if="platform === \'android\'">' +
                    '<div  class="flex flex-middle flex-between">' +
                        '<div class="product-name-list" style="width: 100%;">' +
                            '{{product.name}}' +
                        '</div>' +
                        '<div ng-class="{' +
                            '\'icon-status-product icon-closed\': product.isClosed,' +
                            '\'icon-status-product icon-hidden\': hiddenProduct && !product.isClosed' +
                        '}"/>' +
                        '<div class="credit-summ-list">' +
                            '<span ng-show="product.state !== \'CLOSED\'" ng-bind="(product.currentDebt | defaultSum)" class="text-15px"/>' +
                            '<span ng-show="product.state !== \'CLOSED\'" currency="{{product.currency}}" class="text-15px"/>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="flex flex-between flex-middle">' +
                    '<div class="credit-thermometer">' +
                        '<rs-thermometer progress="{{product.state===\'CLOSED\' ? 0 : product.restPay}}" bg-class="bg-D6DEE1" fg-class="bg-seagreen"></rs-thermometer>' +
                    '</div>' +
                    '<div ng-show="product.state !== \'CLOSED\'" class="loan-rest-product">осталось {{product.restPay}} %</div>' +
                '</div>' +
                '<div class="flex flex-middle plan-pay-credit">' +
                    '<span ng-show="product.state !== \'CLOSED\'" class="text-gray text-13px">{{platform===\'android\' ? \'Плановый платеж\' : \'Платеж\'}}:</span>' +
                    '<span class="text-gray text-13px" ng-show="product.state === \'CLOSED\'">Кредит закрыт</span>' +
                    '<span class="padding-left-5px" ng-show="product.state !== \'CLOSED\'">' +
                        '<span ng-show="product.monthlyPaymentAmount" ng-bind="(product.monthlyPaymentAmount | defaultSum)" class="text-13px"/>' +
                        '<span ng-show="product.monthlyPaymentAmount" currency="{{product.currency}}" class="text-13px"/>' +
                        '<span class="text-13px"> до {{product.monthlyPaymentDate | defaultDate}}</span>' +
                    '</span>' +
                '</div>' +
            '</div>'
        };
    }]);

    /**
     * Элемента списка - Счет
     *
     * Пример:
     * <rs-account product="myAccount"></rs-account>
     *
     */
    app.directive('rsAccount', ['sys', function(sys) {
        return {
            restrict: 'AE',
            replace: true,
            scope: {
                product: '=',
                hiddenProduct: '='
            },
            link: function(scope){
                scope.platform = sys.getPlatform();
            },
            template:
            '<div class="account-finance-block">' +
                '<div ng-if="platform === \'ios\'" class="flex flex-middle">' +
                    '<div class="product-name-list">Счет "{{product.name}}"</div>' +
                    '<div class="fade"/>' +
                    '<div ng-class="{' +
                        '\'icon-status-product icon-blocked\': product.isLocked,' +
                        '\'icon-status-product icon-closed\': product.isClosed,' +
                        '\'icon-status-product icon-hidden\': hiddenProduct && !product.isLocked && !product.isClosed' +
                    '}"/>' +
                '</div>' +
                '<div ng-if="platform === \'android\'" class="flex flex-middle flex-between">' +
                    '<div class="product-name-list" style="width: 100%;">Счет "{{product.name}}"</div>' +
                    '<div ng-class="{' +
                        '\'icon-status-product icon-blocked\': product.isLocked,' +
                        '\'icon-status-product icon-closed\': product.isClosed,' +
                        '\'icon-status-product icon-hidden\': hiddenProduct && !product.isLocked && !product.isClosed' +
                    '}"/>' +
                '</div>' +
                '<div class="flex flex-between flex-middle">' +
                    '<div class="text-gray text-13px number-account-finance-block">' +
                        '{{product.number}}' +
                    '</div>' +
                    '<div class="balance-account-finance-block">' +
                        '<span ng-bind="(product.availableBalance | defaultSum)" class="text-15px"/>' +
                        '<span currency="{{product.currency}}" class="text-15px"/>' +
                    '</div>' +
                '</div>' +
            '</div>'
        };
    }]);

    /**
     * Элемента списка - Вклад
     *
     * Пример:
     * <rs-deposit product="myDeposit"></rs-deposit>
     */
    app.directive('rsDeposit', ['sys', '$timeout', function(sys, $timeout) {
        var usageCounter = 0;
        return {
            restrict: 'AE',
            replace: true,
            scope: {
                product: '=',
                hiddenProduct: '='
            },
            link: function(scope){
                scope.platform = sys.getPlatform();
            },
            controller: function($scope) {
                /**
                 * Инициализация каруселей для вкладов (если у вклада один счёт - карусель просто статичная)
                 * Вкладу добавляется свойство swiperRateId и swiperAmountId, которые устанавливаются div'ам в качестве id
                 * swiper-deposit-rate-98765 и swiper-deposit-amount-98765
                 *
                 * @param deposit   вклад
                 * @param type      тип карусели Rate / Amount
                 */
                $scope.initSwiperDeposit = function (type) {
                    $timeout(function () {
                        sys.getFramework7App().swiper('#swiper-deposit-' + type.toLowerCase() + '-' + $scope.product.id, {
                            observer: true,
                            direction: 'vertical',
                            speed: 1000,
                            autoplay: 3000,
                            onlyExternal: true      // запрет внешнего взаимодействия
                        });
                    });
                };
            },
            template:
            '<div class="deposit-finance-block">' +
                '<div ng-if="platform === \'ios\'" class="flex flex-middle">' +
                    '<div class="product-name-list">Вклад "{{product.name}}"</div>' +
                    '<div class="fade"/>' +
                    '<div ng-class="{' +
                        '\'icon-status-product icon-blocked\': product.isLocked,' +
                        '\'icon-status-product icon-closed\': product.isClosed,' +
                        '\'icon-status-product icon-hidden\': hiddenProduct && !product.isLocked && !product.isClosed' +
                    '}"/>' +
                    '<div ng-init="initSwiperDeposit(\'Rate\')" class="rate-item-product">' +
                        '<div id="swiper-deposit-rate-{{product.id}}" class="swiper-container swiper-vertical">' +
                            '<div class="swiper-wrapper">' +
                                '<span class="swiper-slide text-gray text-13px" ng-repeat="account in product.accountList">{{account.interestRate}}%</span></span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div ng-if="platform === \'android\'" class="flex flex-middle">' +
                    '<div class="product-name-list" style="width: 100%;">Вклад "{{product.name}}"</div>' +
                    '<div class="percent-value">' +
                        '<div class="flex flex-middle">' +
                            '<div ng-class="{' +
                                '\'icon-status-product icon-blocked\': product.isLocked,' +
                                '\'icon-status-product icon-closed\': product.isClosed,' +
                                '\'icon-status-product icon-hidden\': hiddenProduct && !product.isLocked && !product.isClosed' +
                            '}"/>' +
                            '<div ng-init="initSwiperDeposit(\'Rate\')" class="rate-deposit-finance-block">' +
                                '<div id="swiper-deposit-rate-{{product.id}}" class="swiper-container swiper-vertical">' +
                                    '<div class="swiper-wrapper">' +
                                         '<span class="swiper-slide text-gray text-13px" ng-repeat="account in product.accountList">{{account.interestRate}}%</span></span>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="flex flex-between flex-middle">' +
                    '<div class="text-gray text-13px deposit-end-date-finance-block" ng-if="product.endDate">' +
                        'до {{product.endDate | defaultDate}}' +
                    '</div>' +
                    '<div ng-init="initSwiperDeposit(\'Amount\')" class="balance-deposit-finance-block">' +
                        '<div id="swiper-deposit-amount-{{product.id}}" class="swiper-container swiper-vertical">' +
                            '<div class="swiper-wrapper">' +
                                '<span class="swiper-slide text-15px" ng-repeat="account in product.accountList">{{account.availableBalance | defaultSum}}<span class="text-15px" currency="{{account.currency}}"></span></span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        };
    }]);

    /**
     * Элемента списка - Продукт
     *
     * Пример:
     * <rs-product product="myProduct"></rs-product>
     *
     */
    app.directive('rsProduct', function() {
        return {
            restrict: 'AE',
            replace: true,
            scope: {
                product: '=',
                showCheckBox: '@',
                hiddenProduct: '=',
                showCardAccount: '@'
            },
            template:
            '<div class="item-content item-inner flex flex-middle"> ' +
                '<div ng-if="showCheckBox" class="margin-right-15px">' +
                    '<label class="label-checkbox">' +
                        '<input type="checkbox" ng-model="product.selected">' +
                        '<div class="item-media">' +
                            '<i class="icon icon-form-checkbox"></i>' +
                        '</div>' +
                    '</label>' +
                '</div>' +
                '<div class="child-flex-1">' +
                    <!-- Если продукт карта -->
                    '<rs-card product="product" hidden-product="hiddenProduct" show-card-account="{{showCardAccount}}" ng-if="product.entityKind == \'BankCard\'"></rs-card>' +
                    <!-- Если продукт кредит -->
                    '<rs-loan product="product" ng-if="product.entityKind == \'RetailLoan\'"></rs-loan>' +
                    <!-- Если продукт счет -->
                    '<rs-account product="product" ng-if="product.entityKind == \'RetailAccount\'"></rs-account>' +
                    <!-- Если продукт вклад -->
                    '<rs-deposit product="product" ng-if="product.entityKind == \'RetailDeposit\'"></rs-deposit>' +
                '</div>' +
            '</div>'
        };
    });

    app.directive('depositComparisonSheet', ['$document', '$timeout', '$ionicScrollDelegate',
                    function($document, $timeout, $ionicScrollDelegate) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                depositList: '=',
                compareParams: '='
            },
            controller: ['$scope', '$sce', function($scope, $sce) {
                var getValuesForCurrencies = function(value){
                    if (angular.isObject(value)) {
                        var result = [];
                        for (var prop in value) {
                            var prefix;
                            switch(prop){
                                case 'RUB':
                                    prefix = 'В руб.:'; break;
                                case 'USD':
                                    prefix = 'В долл.:'; break;
                                case 'EUR':
                                    prefix = 'В евро:'; break;
                                default: prefix = prop + ': ';
                            }

                            var fromVal = value[prop] && value[prop][0] && value[prop][0].min || '';
                            var toVal = value[prop] && value[prop][0] && value[prop][0].max || '';
                            result.push(prefix + ' от ' + fromVal + ' до ' + toVal);
                        }
                        return result;
                    } else {
                        return value;
                    }
                };

                $scope.getProperValue = function(deposit, param) {
                    var value = deposit[param];

                    if (typeof value === 'boolean') {
                        return value ? 'Да' : 'Нет';
                    }

                    if (param == 'currency' && angular.isArray(value)) {
                        var curValue = '';
                        for (var i = 0; i < value.length; i++) {
                            if (curValue) { curValue += '\n'; }
                            switch(value[i]) {
                                case 'RUB': curValue+= 'Рубли'; break;
                                case 'USD': curValue+= 'Доллары'; break;
                                case 'EUR': curValue+= 'Евро'; break;
                                default: curValue+= value[i];
                            }
                        }
                        return curValue;
                    }

                    if (param == 'amounts'){
                        value = getValuesForCurrencies(value);
                        return angular.isArray(value) ? value.join('\n') : value;
                    }

                    if (param == 'terms'){
                        value = getValuesForCurrencies(value);
                        if (angular.isArray(value)) {
                            for (var i = 0; i < value.length; i++) {
                                value[i] += ' дн.';
                            }
                            return value.join('\n');
                        } else {
                            return value;
                        }
                    }

                    if (param == 'addInfo' && value) {
                        return $sce.trustAsHtml(value);
                    }

                    return value;
                }
            }],
            link: function (scope, element, attrs) {

                // $timeout нужен чтобы работать с уже отрендеренным контейнером
                $timeout(function() {
                    $ionicScrollDelegate.resize();
                    var parentEl = element.closest('ION-CONTENT');
                    parentEl = parentEl.length ? parentEl : $document;

                    element.height(parentEl.height()); // document height as default

                    var defaultColWidth = parentEl.width() / 3; // минимально на экране будет видна одна колонка с параметрами и две колонки вкладов

                    var fixedCols = angular.element(element[0].getElementsByClassName('iscroll-fixed-col'));
                    fixedCols.width(defaultColWidth);
                    angular.forEach(fixedCols, function(fixedCol){
                        angular.element(fixedCol.getElementsByClassName('iscroll-cell')).outerWidth('100%');
                    });

                    var scrollableArea = angular.element(element[0].getElementsByClassName('iscroll-scrollable-col'));
                    scrollableArea.offset({left: fixedCols.width()});
                    scrollableArea.width(parentEl.width() - fixedCols.width());
                    angular.forEach(scrollableArea, function(scrollableCol){
                        angular.element(scrollableCol.getElementsByClassName('iscroll-cell')).outerWidth(defaultColWidth);
                    });

                    // TODO: доработка по автоматическому подбору высоты строки заголовка с позиционированием скроллируемой области
                    // Если высота строк в фиксированном и скроллируемом заголовке отличаются, то синхронизируем высоту
                    /*var fixedHeaderCell = angular.element(angular.element(element[0].getElementsByClassName('iscroll-fixed-col iscroll-fixed-row'))[0].getElementsByClassName('iscroll-cell'));
                    var scrollableHeaderCells = angular.element(angular.element(element[0].getElementsByClassName('iscroll-scrollable-col iscroll-fixed-row'))[0].getElementsByClassName('iscroll-cell'));
                    var maxHeaderCellHeight = fixedHeaderCell.height();
                    window.fixedHeaderCell = fixedHeaderCell;
                    angular.forEach(scrollableHeaderCells, function(scrollableHeaderCell){
                        var scrollableHeaderCellEl = angular.element(scrollableHeaderCell);
                        if (maxHeaderCellHeight < scrollableHeaderCellEl.height()) { maxHeaderCellHeight = scrollableHeaderCellEl.height(); }
                    });
                    var headerCells = angular.element(element[0].getElementsByClassName('iscroll-header'));
                    headerCells.height(maxHeaderCellHeight);

                    var scrollableRows = angular.element(element[0].getElementsByClassName('iscroll-scrollable-row'));
                    console.log(maxHeaderCellHeight, scrollableRows);
                    scrollableRows.offset({top: maxHeaderCellHeight});*/

                    // Если высота строк в фиксированной и скроллируемой части отличаются, то синхронизируем высоту
                    var fixedContent = angular.element(angular.element(element[0].getElementsByClassName('iscroll-fixed-col iscroll-scrollable-row'))[0].getElementsByClassName('iscroll-row'));
                    var scrollableContent = angular.element(angular.element(element[0].getElementsByClassName('iscroll-scrollable-col iscroll-scrollable-row'))[0].getElementsByClassName('iscroll-row'));

                    for (var i = 0; i < fixedContent.length && i < scrollableContent.length; i++) {
                        var fixedContentEl = angular.element(fixedContent[i]);
                        var scrollableContentEl = angular.element(scrollableContent[i]);

                        var fixedContentHeight = fixedContentEl.height();
                        var scrollableContentHeight = scrollableContentEl.height();

                        if (fixedContentHeight == scrollableContentHeight) { continue; }

                        if (fixedContentHeight > scrollableContentHeight) {
                            scrollableContentEl.height(fixedContentHeight);
                        } else {
                            fixedContentEl.height(scrollableContentHeight);
                        }
                    }

                    var headerScroll = new iScroll('depositHeaderScroll', {
                        useTransition:true,
                        hScrollbar:false,
                        vScrollbar:false
                    });
                    var fixedColumnScroll = new iScroll('depositFixedColumnWrapper', {
                        useTransition:true,
                        hScrollbar: false,
                        vScrollbar: false
                    });
                    var tableDataScroll = new iScroll('depositTableDataWrapper', {
                            hScrollbar: false,
                            vScrollbar: false,
                            useTransition: true,
                            scrollX:true,
                            scrollY:true,
                            //topOffset: pullDownOffset,
                            onRefresh: function () {},
                            onScrollMove: function () {},
                            onScrollEnd: function () {}
                        },
                        fixedColumnScroll, //!!! fix
                        headerScroll //fix
                    );

                    fixedColumnScroll.vSyncDestScroll = tableDataScroll;
                    headerScroll.hSyncDestScroll = tableDataScroll;
                }, 500);

            },
            templateUrl: 'templates/deposit-comparison-sheet.html'
        };
    }]);

    /**
     *  Директива для кастомного представления выбора опций на основе $ionicModal
     *  rs-options содержит массив обектов-опций
     *  TODO: rs-disabled-options содержит массив опций, кот. входят в rs-options и кот. нельзя выбрать
     *  rs-options-header заголовок
     *  rs-options-show поле объекта опции, которое будет видеть пользователь, если не указать, выведет JSON представление объекта
     *  rs-options-tpl ссылается на файл шаблона представления опций,
     *     в скоупе которого доступны переменные options (массив из rs-options), header (текст из rs-options-header)
     *     а также методы select(option), isSelected(option), getLabel(option), save(), closeMe()
     *  ng-model будет содержать выбранную опцию (элемент из массива rs-options)
     */
    app.directive('rsOptions', ['$ionicModal', 'sys', function($ionicModal, sys) {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: function(scope, element, attrs, ngModelCtrl) {
                // Если не указана ng-model в директиве
                ngModelCtrl = ngModelCtrl || {$setViewValue: angular.noop};

                scope = scope.$new(true);

                /*attrs.$observe('rsOptions', function(rsOptions) {
                    scope.options = scope.$eval(rsOptions);
                });*/

                scope.$parent.$watch(attrs.rsOptions, function(rsOptions) {
                    if (scope.options) {
                        ngModelCtrl.$setViewValue(undefined);
                    }
                    scope.options = scope.$eval(rsOptions) || rsOptions;
                });
                scope.$parent.$watch(attrs.rsDisabledOptions, function(rsDisabledOptions) {
                    scope.disabledOptions = scope.$eval(rsDisabledOptions) || rsDisabledOptions;
                });

                scope.header = attrs.rsOptionsHeader;
                scope.cssClass = attrs.cssClass;
                var displayField = attrs.rsOptionsShow;
                var tpl = attrs.rsOptionsTpl;
                var modalDlg = null;

                if (!tpl) {
                    tpl = sys.getTplByPlatform('rs-options.html');
                } else {
                    tpl = sys.getTplByPlatform(tpl);
                }

                tpl.then(function(data) {
                    modalDlg = $ionicModal.fromTemplate(data, { scope: scope });
                    element.bind('click', function(){
                        if (angular.isArray(scope.options) && scope.options.length) {
                            // Инициализация выбранного значения
                            scope.select(ngModelCtrl.$viewValue);
                            modalDlg.show();
                        }
                    });
                });

                scope.select = function(option){ scope.selected = option; };
                scope.isSelected = function(option){ return angular.equals(scope.selected, option); };
                scope.getLabel = function(option){ return displayField ? option[displayField] : option; };
                scope.save = function(){ ngModelCtrl.$setViewValue(scope.selected); };
                scope.closeMe = function(){ modalDlg.hide(); };
                scope.isDisabled = function(option){ return false; };


            }
        };
    }]);

    // Автоподгонка размеров iframe с автомасштабированием содержимого
    app.directive('iframeAutoscale', [function(){
        return {
            link: function(scope, element, attrs){
                element.on('load', function(){
                    var ifdoc = angular.element(element[0].contentWindow.document);
                    //ifdoc.find('head').append('<meta name="viewport" content="user-scalable=yes, initial-scale=1, minimum-scale=1"/>');
                    ifdoc.find('html').css({overflow: 'hidden'});

                    var k = angular.element(document).width() / ifdoc.width();
                    //console.log(k);
                    element.css({width: ifdoc.width(), height: ifdoc.height(), 'webkit-transform': 'scale(' + k + ')', 'transform-origin': 'top left'});
                })
            }
        }
    }]);

    /**
      * Директива для прокрутки месяцев.
      * Используется в контроле расходов и в календаре событий.
      */
    app.directive('rsShadySlider', ['$timeout', 'sys', function($timeout, sys) {
        return {
            restrict: 'EA',
            replace: true,
            require: 'ngModel',
            scope: {
                sliderData: '=',
                displayField: '@',
                onSlideChange: '&',
                loop: '='
            },
            link: function(scope, element, attrs, ngModelCtrl) {
                $timeout(function(){
                    var fw7App = sys.getFramework7App();
                    var shadySlider = fw7App.swiper('#' + attrs.id, {
                        slidesPerView: 3,
                        centeredSlides: true,
                        loop: scope.loop,
                        onSlideChangeEnd: function(shadySlider) {
                            ngModelCtrl.$setViewValue(scope.sliderData[shadySlider.activeIndex]);
                            scope.onSlideChange();
                        }
                    });

                    if (ngModelCtrl.$viewValue) {
                        for (var i = 0; i < scope.sliderData.length; i++) {
                            if (scope.sliderData[i] === ngModelCtrl.$viewValue) {
                                shadySlider.slideTo(i, 0, false);
                                return;
                            }
                        }
                    }

                    ngModelCtrl.$setViewValue(scope.sliderData[0]);
                });
            },
            template:
            '<div class="swiper-container">' +
                '<div class="swiper-wrapper">' +
                    '<div class="swiper-slide flex flex-center flex-middle" ng-repeat="slide in sliderData">' +
                        '<div class="swiper-slide-inner">{{displayField ? slide[displayField]: slide}}</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        };
    }]);

    /** Директива для контейнера карусели продуктов на базе Framework7 */
    app.directive('rsProductSlideBox', ['$timeout', 'sys', function($timeout, sys) {
        var usageCounter = 0;
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {
                onSlideChanged: '&',
                activeSlide: '='
            },
            link: function(scope, element, attrs) {
                scope.id = 'rs-product-slider-' + ++usageCounter;

                $timeout(function(){
                    var fw7App = sys.getFramework7App();
                    var productSlider = fw7App.swiper('#' + scope.id + ' .swiper-container', {
                        observer: true, // Чтобы слайдер перерендерился при добавлении слайдов или изменения стилей
                        pagination: '#' + scope.id + ' .swiper-pagination',
                        paginationClickable: true,
                        slidesPerView: 3,
                        centeredSlides: true,
                        onSlideChangeStart: function(productSlider) {
                            scope.activeSlide = productSlider.activeIndex;
                            scope.onSlideChanged({index: productSlider.activeIndex});
                        }
                    });
                    scope.$watch('activeSlide', function(newIndex) {
                        productSlider.slideTo(newIndex, 300, false);
                    });
                });
            },
            template:
            '<div id="{{id}}" class="mts-product-carousel">' +
                '<div style="width:100vw; overflow: hidden">' +
                    '<div class="rs-product-carousel-container">' +
                        '<div class="swiper-container">' +
                            '<div class="swiper-wrapper">' +
                                '<div transclude-replace></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="swiper-pagination" style="width: 100vw;"></div>' +
            '</div>'
        };
    }]);

    /** Директива для слайда карусели продуктов на базе Framework7 */
    app.directive('rsProductSlide', [function() {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            template: '<div class="swiper-slide rs-product-slide-container"><div transclude-replace></div></div>'
        };
    }]);

    /** Директива для диаграммы бублик
     * rs-donut-data содержит массив [{value: 45, text: '45%', color: '#ff0000'}]
     */
    app.directive('rsDonut', ['$timeout', function($timeout) {
        var usageCounter = 0;
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                rsDonutData: '=',
                onSectorClick: '&'
            },
            link: function (scope, element, attrs) {
                scope.id = 'graph-donut-' + ++usageCounter;
                scope.watcher = false;

                var translateData = function(rsDonutData) {
                    if (!rsDonutData) {
                        return {data: [[]], colors: []};
                    }

                    var data = [];
                    var colors = [];

                    for (var i = 0; i < rsDonutData.length; i++) {
                        data[i] = [];
                        data[i][0] = rsDonutData[i].text || '';
                        data[i][1] = rsDonutData[i].value || 0;
                        colors.push(rsDonutData[i].color || 'transparent');
                    }

                    return {
                        data: data,
                        colors: colors
                    };
                };

                $timeout(function(){
                    var data = [['', 1]],
                        colors = ['#D5DEE0'];

                        if (!scope.rsDonutData) {
                            scope.rsDonutData = {};
                        }
                        if (scope.rsDonutData.data && scope.rsDonutData.data.length) {
                            var preparedData = translateData(scope.rsDonutData.data);
                            data = preparedData.data;
                            colors = preparedData.colors;
                            scope.rsDonutData.rendered = true;
                        }

                    var options = {
                        seriesColors: colors,
                        grid: {
                            background: '#F0F4F5',
                            borderWidth: 0,
                            shadow: false
                        },
                        gridPadding: {
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0
                        },
                        highlighter: {
                            // выделение маркера ввиде точки
                            show: false
                        },
                        seriesDefaults: {
                            // make this a donut chart.
                            renderer: jQuery.jqplot.DonutRenderer,
                            rendererOptions: {
                                diameter: 170,
                                innerDiameter: 90,
                                showDataLabels: true,
                                dataLabels: 'label',
                                startAngle: -90, /* Начать отрисовку от положительной оси Y */
                                shadow: false,
                                shadowOffset: 0,
                                barPadding: 0,
                                barMargin: 0
                            }
                        }
                    };

                    var donut = jQuery.jqplot(scope.id, [data], options);
                    angular.element('#' + scope.id).bind('jqplotDataClick', function (evt, seriesIndex, sectorIndex, data) {
                        scope.onSectorClick({event: evt, sectorIndex: sectorIndex,
                                            sectorData: scope.rsDonutData.data[sectorIndex]});
                    });

                    scope.rsDonutData.render = function() {
                        if (scope.rsDonutData.data) {
                            scope.rsDonutData.rendered = true;
                            var preparedData;
                            if (!scope.rsDonutData.data.length) {
                                preparedData = {
                                    data: [['', 1]],
                                    colors: ['#D5DEE0']
                                }
                            } else {
                                preparedData = translateData(scope.rsDonutData.data);
                            }
                            donut.series[0].data = preparedData.data;
                            donut.series[0].seriesColors = preparedData.colors;
                            donut.replot();
                        }
                        if (!scope.watcher) {
                            scope.watcher = true;
                            scope.$watch('rsDonutData.data', function(newData, oldData) {
                                if (newData != oldData) {
                                    scope.rsDonutData.render();
                                }
                            });
                        }
                    }
                });
            },
            template: '<div id="{{id}}"></div>'
        };
    }]);

    app.directive('rsRatesGraph', ['$timeout', function($timeout) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                rates: '=',
                id: '@'
            },
            link: function (scope, element, attrs) {
                // график
                var areaChart;

                var target_sum_dashed_line = function (target_sum) {
                    return {
                        dashedHorizontalLine: {
                            name: 'customGridLine',
                            y: target_sum,
                            lineWidth: 1,
                            color: '#d3dde2',
                            shadow: false
                        }
                    };
                };

                areaChartInit = function (graphId, spec) {
                    jQuery.jqplot.config.enablePlugins = true;
                    jQuery.jqplot.config.defaultHeight = '200px';
                    jQuery.jsDate.config.defaultLocale = 'ru';
                    initChart(graphId, spec);
                };

                function initChart(graphId, spec) {
                    if (areaChart) {
                        areaChart.destroy();
                    }

                    /*
                     Описание кастомных свойств для каждого графика
                     */
                    var series = [];

                    /*
                     * Формирование массива с данными для график
                     */
                    var layers = [];
                    var dates = [];
                    var maxSumValue = 0;
                    for (var i = 0; i < spec.data.layers.length; i++) {
                        var list = [];
                        for (var j = 0; j < spec.data.layers[i].list.length; j++) {
                            if (maxSumValue < spec.data.layers[i].list[j].value) {
                                maxSumValue = spec.data.layers[i].list[j].value;
                            }
                            list.push([spec.data.layers[i].list[j].date, spec.data.layers[i].list[j].value]);
                            if (jQuery.inArray(spec.data.layers[i].list[j].date, dates) < 0) {
                                dates.push(spec.data.layers[i].list[j].date);
                            }
                        }
                        if (list.length > 0) {
                            var name = spec.data.layers[i].name;
                            if ('USD' == name) {
                                series.push({
                                    // подпись/идентификатор
                                    label: "Доллар",
                                    // цвет линии
                                    color: "#45E660"
                                });
                            } else if ('EUR' == name) {
                                series.push({
                                    label: "Евро",
                                    color: "#295FCC"
                                });
                            }

                            layers.push(list);
                        }
                    }

                    if (layers.length > 0) {
                        /*
                         * Формирование линии по Y
                         */
                        var sum = 0;
                        var customGridLinesY = [];
                        while (sum < maxSumValue) {
                            sum = sum + 50.000;
                            customGridLinesY.push(target_sum_dashed_line(sum));
                        }

                        var min = new Date(dates[0]);
                        var max = new Date(dates[dates.length - 1]);

                        /*
                         * Формирование подписей по оси X
                         */
                        var ticksX = [];
                        ticksX.push([dates[0], '']);
                        for (i = 1; i < dates.length - 1; i++) {
                            ticksX.push([dates[i], getDateFormatting(dates[i])]);
                        }
                        ticksX.push([dates[dates.length - 1], '']);

                        /*
                         Опции для графика общие
                         */
                        var options = {
                            // массий кастомных опция для каждого графика
                            series: series,
                            // опции для всех графиков
                            seriesDefaults: {
                                showMarker: true,
                                showLine: true,
                                lineWidth: 2,
                                shadow: false,
                                rendererOptions: {
                                    highlightMouseOver: true,
                                    smooth: true
                                }
                            },
                            axesDefaults: {
                                autoscale: false,
                                rendererOptions: {
                                    drawBaseline: true,
                                    minorTicks: 5
                                }
                            },
                            // опции осей
                            axes: {
                                // ось х
                                xaxis: {
                                    show: true,
                                    ticks: ticksX,
                                    renderer: jQuery.jqplot.DateAxisRenderer,
                                    tickOptions: {
                                        show: true,
                                        showLabel: true,
                                        showGridline: true,
                                        formatString: '%d.%m',
                                        mark: 'inside',
                                        showMark: true,
                                        markSize: 10
                                    },
                                    rendererOptions: {
                                        drawBaseline: true
                                    }
                                },
                                // ось y
                                yaxis: {
                                    show: false,
                                    showLabel: false,
                                    label: null,
                                    autoscale: false,
                                    min: 0,
                                    tickOptions: {
                                        formatString: '%.2f',
                                        showLabel: false,
                                        showMark: false,
                                        showGridline: false
                                    },
                                    rendererOptions: {
                                        drawBaseline: false
                                    }
                                }
                            },
                            // грид
                            grid: {
                                drawGridlines: false,      // линии внутри графика
                                drawBorder: false,         // рамка вокруг графика
                                borderColor: '#D8DFE1',
                                borderWidth: 1.0,
                                shadow: false,             // тень
                                background: '#ffffff'      // задний фон графика
                            },
                            // плагин для выделения метки
                            highlighter: {
                                // выделение маркера ввиде точки
                                show: true,
                                // отображать сверху
                                tooltipLocation: 'ne',
                                // удаленность от точки
                                tooltipOffset: 3,
                                // отображение координаты y
                                tooltipAxes: 'y',
                                // использовать форматирование указанное на осях
                                useAxesFormatters: true,
                                // контент для отображения
                                formatString: '<div style="background-color: #dce3e6; color: black; padding: 3px;">%s</div>'
                            },
                            legend: null,
                            gridPadding: {left:0, right:0},
                            canvasOverlay: {
                                show: true,
                                objects: customGridLinesY
                            }
                        };
                        areaChart = jQuery.jqplot(graphId, layers, options);
                    }
                }

                function getDateFormatting(str) {
                    var date = new Date(str);
                    var month = date.getMonth() + 1;
                    if (month < 10) {
                        month = '0' + month;
                    }
                    var day = date.getDate();
                    if (day < 10) {
                        day = '0' + day;
                    }
                    return day + '.' + month;
                }

                scope.$watch('rates', function(newValue){
                    if (newValue) {
                        $timeout(function () {
                            areaChartInit('currencyRatesGraph', newValue);
                        });
                    }
                });
            },
            template: '<div id="currencyRatesGraph" ng-style="{position: \'relative\'}"></div>'
        };
    }]);


    /**
     * Директива для элемента списка категории расходов
     */
    app.directive('rsExpenseCategoryLi', ['$timeout', function($timeout) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                rsCategory: '='
            },
            template:
            '<li id="expense-category-{{rsCategory.strId}}" class="item-content item-inner mts-controll-category flex flex-column">' +
                '<div class="child-flex-1 flex flex-middle width100pc" style="align-items: flex-end;">' +
                    '<div class="table-fixed-width100pc mts-controll-category-header">' +
                        '<div class="table-row">' +
                            '<div ng-hide="rsCategory.isAll" class="table-cell category-round-box" style="vertical-align: middle;">' +
                                '<div class="category-round" ng-style="{\'background-color\': rsCategory.color}" bg-class="mts-controll-therm-bg"></div>' +
                            '</div>' +
                            '<div class="table-cell ctegory-name">{{rsCategory.name}}</div>' +
                            '<div class="table-cell text-right category-summ">' +
                                '<span ng-show="rsCategory.totalCredit" ng-bind="(rsCategory.totalCredit | defaultSum)"/>' +
                                '<span ng-show="rsCategory.totalCredit" currency="RUB"/>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="flex flex-middle width100pc">' +
                    '<div class="table-fixed-width100pc child-flex-1">' +
                        '<div class="table-row">' +
                            '<div class="table-cell cell-content-middle">' +
                                '<rs-thermometer progress="{{rsCategory.budgetPercent}}" bg-class="mts-controll-therm-bg" ' +
                                        'fg-style="\'background-color\': \'{{rsCategory.isView ? rsCategory.color : \'transparent\'}}\'"></rs-thermometer>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="child-flex-1 flex flex-middle width100pc">' +
                    '<div class="table-fixed-width100pc child-flex-1">' +
                        '<div class="table-row">' +
                            '<div class="table-cell category-balance" ng-show="rsCategory.isActive">' +
                                '<span class="text-A1AEB3" ng-class="{\'text-EE102E\': rsCategory.overrun}">' +
                                    '{{rsCategory.overrun ? \'Перерасход\' : \'Осталось\'}}:' +
                                '</span>' +
                                '<span>' +
                                    '<span ng-bind="((rsCategory.overrun || rsCategory.rest) | defaultSum)"/>' +
                                    '<span currency="RUB"/>' +
                                '</span>' +
                            '</div>' +
                            '<div class="table-cell category-add-budget" ng-hide="rsCategory.isActive">' +
                                '<span class="text-A1AEB3">Назначьте бюджет</span>' +
                            '</div>' +
                            '<div class="table-cell text-right text-A1AEB3 category-balance-summ" ng-show="rsCategory.isActive">' +
                                '<span ng-bind="(rsCategory.budget | defaultSum)"/>' +
                                '<span currency="RUB"/>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</li>'
        };
    }]);

    /*
    * общая директива для вывода расшифровки данных о расходах за месяц
    * */
    app.directive('expenseMonthlyData', ['$rootScope', function($rootScope) {
        return {
            restrict: 'EA',
            scope: {
                monthData:'='
            },
            controller: ['$scope', '$ionicScrollDelegate', '$state', 'productSrv', function($scope, $ionicScrollDelegate, $state, productSrv) {
                $scope.$watch('showHiddenCategories', function(newValue) {
                    if (newValue !== undefined) {
                        $ionicScrollDelegate.resize();
                    }
                });

                $scope.showBudgetCategory = function(category) {
                    $state.current.monthIdx = $scope.monthData.idx;
                    productSrv.setCurrentCategory(category);
                    $state.go('categorybudget', {monthIdx:$scope.monthData.idx});
                }
            }],
            templateUrl: 'templates/expenseMonthData.html'
        }
    }]);

    /**
     * Директива отрисовки списка операций согласно макетам
     * @param operations        список операций
     * @param operationState    состояние детальной информации операции (при тапе по операции)
     */
    app.directive('rsOperations', ['$rootScope', '$filter', function($rootScope, $filter) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                operations: '=',
                operationState: '=',
                showOperationsTab: '@',
                showSearchBar: '@',
                forBonus: '@'
            },
            controller: ['$scope', '$state', 'productSrv', function($scope, $state, productSrv) {
                $scope.ios = $rootScope.platform === 'ios';
                $scope.searchText = {};

                /* Определяет изменение даты у текущей операции для необходимости ее вывода */
                $scope.isChangeDate = function(index) {
                    return productSrv.isChangeDate($scope.operations, index);
                };

                /* Переход в детальную инфу операции */
                $scope.showOperation = function(operation) {
                    if ($scope.operationState) {
                        productSrv.setCurrentOperation(operation);
                        $state.go($scope.operationState);
                    }
                };
            }],
            templateUrl: 'templates/rsOperations.html'
        };
    }]);

    /**
     * Директива отрисовки списка операций с подвалом (в детальной инфе)
     * @param product
     */
    app.directive('rsOperationsWithBasement', ['$rootScope', function($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                product: '='
            },
            link: function(scope) {
                scope.platform = $rootScope.platform;
                scope.$watch('product', function(product){
                    if (product) {
                        switch (product.entityKind) {
                            case 'BankCard':
                                scope.extractUiSref = 'card.extract';
                                scope.operationState = 'card.operation';
                                break;
                            case 'RetailLoan':
                                scope.extractUiSref = 'loan.extract';
                                scope.operationState = 'loan.operation';
                                break;
                            case 'RetailAccount':
                                scope.extractUiSref = 'account.extract';
                                scope.operationState = 'account.operation';
                                break;
                        }
                    }
                });
            },
            templateUrl: 'templates/rsOperationsWithBasement.html'
        };
    }]);

    /**
     * Директива отображения логотипа операции
     */
    app.directive('rsOperationLogo', [function() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                operation: '='
            },
            controller: ['$scope', '$rootScope', function($scope, $rootScope) {
                $scope.platform = $rootScope.platform;
                $scope.$watch('operation.logo.url', function(newUrl) {
                    $scope.logoUrl = newUrl ? $rootScope.getLogoUrl(newUrl) : '';
                    $scope.$applyAsync();
                });
            }],
            templateUrl: 'templates/rsOperationLogo.html'
        };
    }]);

    /**
     * Логотип поставщика услуг и вида платежа
     * Если логотип svg, то в поле logoSvg складывается исходный текст svg
     * Если не svg, то logoUrl - урл получения картинки
     */
    app.directive('paymentCategoryLogo', ['$rootScope', function($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, elem, attrs) {
                attrs.$observe('category', function(newVal) {
                    var category = JSON.parse(newVal);
                    if (category.logoSvg) {
                        elem.html('<div class="payment-category-logo">' + category.logoSvg + '</div>');
                    } else if (category.logoUrl) {
                        elem.html('<img class="payment-category-logo-img" src="' + $rootScope.getLogoUrl(category.logoUrl) + '"/>');
                    } else {
                        elem.html('<img class="payment-category-logo-img" src="' + (category.iconSrc ? category.iconSrc : 'img/mts.png') + '"/>');
                    }
                });
            }
        };
    }]);

    /**
     * Директива для исправления вложенных скроллов
     */
    app.directive('fixHorizontalScroll', ['$ionicScrollDelegate', '$rootScope', function($ionicScrollDelegate, $rootScope) {
        var fixJsScroll = function(element, attrs) {
                if (!attrs.delegateHandle) {
                    return;
                }
                var sv = $ionicScrollDelegate.$getByHandle(attrs.delegateHandle).getScrollView();

                var container = sv.__container;

                var originaltouchStart = sv.touchStart;
                var originalmouseDown = sv.mouseDown;
                var originaltouchMove = sv.touchMove;
                var originalmouseMove = sv.mouseMove;

                if (sv.touchStart) {
                    container.removeEventListener('touchstart', sv.touchStart);
                    sv.touchStart = function (e) {
                        e.preventDefault = function () {
                        }
                        originaltouchStart.apply(sv, [e]);
                    }
                    container.addEventListener("touchstart", sv.touchStart, false);
                }

                if (sv.touchMove) {
                    document.removeEventListener('touchmove', sv.touchMove);
                    sv.touchMove = function (e) {
                        e.preventDefault = function () {
                        }
                        originaltouchMove.apply(sv, [e]);
                    }
                    document.addEventListener("touchmove", sv.touchMove, false);
                }

                if (sv.mouseDown) {
                    container.removeEventListener('mousedown', sv.mouseDown);
                    sv.mouseDown = function (e) {
                        e.preventDefault = function () {
                        }
                        originalmouseDown.apply(sv, [e]);
                    }
                    container.addEventListener("mousedown", sv.mouseDown, false);
                }

                if (sv.mouseMove) {
                    document.removeEventListener('mousemove', sv.mouseMove);
                    sv.mouseMove = function (e) {
                        e.preventDefault = function () {
                        }
                        originalmouseMove.apply(sv, [e]);
                    }
                    document.addEventListener("mousemove", sv.mouseMove, false);
                }
        };
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                if (!$rootScope.adaptToWindowsphone) {
                    fixJsScroll(element, attrs);
                } else {
                    element.addClass('horizontal-scroll');
                }
            }
        };
    }]);

    /**
     * Директива для блокировки пунктов меню в процессе открытия
     */
    app.directive('uiSrefIf', ['$state', function($state) {
        return {
            link: function(scope, element, attrs) {
                element.on('click', function(event) {
                    //Проверим, что менюха открыта на полную
                    if (jQuery('.panel-right').hasClass('panel-opened')) {
                        $state.go(attrs.uiSrefIf);
                    } else {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                });
            }
        };
    }]);

    /**
     * Директива, представляющая курс конвертации
     * #095225. Отображение должно быть следующим: если в паре валют есть рубли, первым отображается нерубль;
     * иначе, если в паре есть доллар, первым отображается недоллар; иначе – оставляем как есть.
     *
     * АЛГОРИТМ ВЗЯТ ИЗ ИК (не надо придумывать велосипед, так точно расхождений не будет :)
     *
     * При изменении директивы необходимо учесть в transfer.html и operation.html
     */
    app.directive('conversionRate', [function() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                fromCurrency: '=',
                toCurrency: '=',
                conversionRate: '='
            },
            controller: ['$scope', function($scope) {
                var isNeedRotate = function() {
                    if ($scope.toCurrency == 'RUB' || $scope.fromCurrency == 'RUB') {
                        return $scope.toCurrency == 'RUB';
                    } else if ($scope.toCurrency == 'USD' || $scope.fromCurrency == 'USD') {
                        return $scope.toCurrency == 'USD';
                    }
                    return false;
                };
                var init = function() {
                    if ($scope.fromCurrency && $scope.toCurrency && $scope.conversionRate) {
                        if (isNeedRotate()) {
                            $scope.firstAmount = $scope.conversionRate.toRateValue;
                            $scope.secondAmount = $scope.conversionRate.fromRateValue;
                            $scope.firstCurrency = $scope.fromCurrency;
                            $scope.secondCurrency = $scope.toCurrency;
                        } else {
                            $scope.firstAmount = $scope.conversionRate.fromRateValue;
                            $scope.secondAmount = $scope.conversionRate.toRateValue;
                            $scope.firstCurrency = $scope.toCurrency;
                            $scope.secondCurrency = $scope.fromCurrency;
                        }
                    }
                };
                $scope.$watch('fromCurrency', function(newValue) {
                    $scope.fromCurrency = newValue;
                    init();
                });
                $scope.$watch('toCurrency', function(newValue) {
                    $scope.toCurrency = newValue;
                    init();
                });
                $scope.$watch('conversionRate', function(newValue) {
                    $scope.conversionRate = newValue;
                    init();
                });
            }],
            template: '<div>' +
                        '{{firstAmount | defaultSum}}<span currency="{{firstCurrency}}"></span> = {{secondAmount | defaultSum}}<span currency="{{secondCurrency}}"></span>' +
                      '</div>'
        };
    }]);

    /**
     * Директива, реализующая функционал pull-to-refresh для WP 8.1
     */
    app.directive('wpPtr', ['$timeout', '$compile', function($timeout, $compile) {
        function scrollTo(element, position) {
            // msZoomTo is Windows 8.1/IE11 only
            if (element.msZoomTo) {
                element.msZoomTo({
                    contentX: 0,
                    contentY: position,
                    viewporX: 0,
                    viewportY: 0
                });
            } else {
                element.scrollTop = position;
            }
        };
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                if (!scope.adaptToWindowsphone) {
                    return;
                }
                $timeout(function() {
                    var MS_MANIPULATION_STATE_ACTIVE = 1; // A contact is touching the surface and interacting with content
                    var MS_MANIPULATION_STATE_INERTIA = 2; // The content is still moving, but contact with the surface has ended
                    var scroller = element;
                    var pullBox = $compile('<div class="pullBox"><ion-spinner icon="android" ng-if="showSpinner" class="spinner spinner-android"></ion-spinner></div>')(scope);
                    if (attrs.spinnerClass) {
                        pullBox.addClass(attrs.spinnerClass);
                    }
                    var innerScroller = $('<div class="innerScroller" />');
                    scroller.append(innerScroller);
                    innerScroller.append(scroller.children());
                    if (attrs.bgColor) {
                        pullBox.css('background-color', attrs.bgColor);
                        scroller.css('border-top', '1px solid ' + attrs.bgColor);
                    }
                    scroller.prepend(pullBox);
                    scroller.css('-ms-scroll-snap-y', 'proximity snapList(60px)');
                    scroller[0].scrollTop = 60;
                    scroller[0].addEventListener("MSManipulationStateChanged", onManipualationStateChanged);
                    function onManipualationStateChanged(e) {
                        // Check to see if they lifted while pulled to the top
                        if (e.currentState == MS_MANIPULATION_STATE_INERTIA &&
                            e.lastState == MS_MANIPULATION_STATE_ACTIVE) {
                            if (scroller[0].scrollTop == 0) {
                                if (!scope.showSpinner) {
                                    scope.showSpinner = true;
                                    scope.$apply(attrs.wpPtr);
                                }
                            } else if (scroller[0].scrollTop < 60) {
                                scrollTo(scroller[0], 60);
                            }
                        }
                    };
                    scope.$on('scroll.refreshComplete', function() {
                        scrollTo(scroller[0], 60);
                        scope.showSpinner = false;
                    });
                });
            }
        }
    }]);

    /**
     * Выбор региона/города/офиса
     */
    app.directive('rsOfficeSelect', ['commonSrv', function(commonSrv) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                readOnly: '=',
                model: '=',
                regionList: '=?'
            },
            link: function(scope, element, attrs) {
                if (!scope.regionList) {
                    commonSrv.getRegionList().then(function(regionList) {
                        scope.regionList = regionList;
                    });
                }
                scope.$watch('model.region', function() {
                    if (!scope.readOnly && !scope.model.city) {
                        scope.model.city = null;
                    }
                });
                scope.$watch('model.city', function() {
                    if (!scope.readOnly && !scope.model.city) {
                        scope.model.branch = null;
                    }
                });
            },
            templateUrl: 'templates/office-select.html'
        }
    }]);

    /**
     * Анимация searchbar'а для iOS
     */
    app.directive('rsSpotlightSearch', ['sys', function(sys) {
        return {
            restrict: 'E',
            replace: true,
            require: 'ngModel',
            scope: {
                placeholder: '@',
                ngModel: '='
            },
            link: function(scope, element, attrs, ngModelCtrl) {
                scope.placeholder = scope.placeholder || 'Поиск';
                scope.focus = function() {
                    var input = element.find('.rs-spotlight');
                    input.addClass('active');
                };
                scope.blur = function() {
                    var input = element.find('.rs-spotlight');
                    if (angular.isUndefined(ngModelCtrl.$viewValue) || ngModelCtrl.$viewValue == '') {
                        input.removeClass('active');
                    }
                };
                scope.$watch('ngModel', function(newVal) {
                    if (angular.isUndefined(newVal) || newVal === '') {
                        element.find('.rs-spotlight-placeholder').removeClass('hidden');
                    } else {
                        element.find('.rs-spotlight-placeholder').addClass('hidden');
                        scope.focus();
                    }
                });
            },
            template:
                '<div class="rs-spotlight-wrapper">' +
                    '<div class="rs-spotlight">' +
                        '<input input-clear-btn type="search" class="rs-spotlight-search" ng-model="ngModel" ng-focus="focus()" ng-blur="blur()">' +
                        '<div class="rs-spotlight-placeholder-container">' +
                            '<div class="rs-spotlight-placeholder">{{placeholder}}</div>' +
                        '</div>' +
                    '</div>' +
                '</div>'
        }
    }]);

    /* Поле в детальной информации продукта под картой */
    app.directive('productInfoField', ['$rootScope', function($rootScope) {
        return {
            restrict: 'EA',
            scope: {
                label: '@',
                value: '@',
                valueCurrency: '@',
                uiSref: '@'
            },
            controller: ['$scope', function ($scope) {
                $scope.android = $rootScope.platform != 'ios';
            }],
            templateUrl: 'templates/productInfoField.html'
        }
    }]);

    /* Кастомный ion-toggle */
    app.directive('rsToggle', ['$ionicGesture', '$timeout', 'sys', function($ionicGesture, $timeout, sys) {
        return {
            restrict: 'E',
            replace: true,
            require: '?ngModel',
            template:
            '<div class="wrap">' +
            '<label class="toggle">' +
            '<input type="checkbox">' +
            '<div class="track">' +
            '<div class="handle"></div>' +
            '</div>' +
            '</label>' +
            '</div>',

            compile: function(element, attr) {
                var input = element.find('input');
                angular.forEach({
                    'name': attr.name,
                    'ng-value': attr.ngValue,
                    'ng-model': attr.ngModel,
                    'ng-checked': attr.ngChecked,
                    'ng-disabled': attr.ngDisabled,
                    'ng-true-value': attr.ngTrueValue,
                    'ng-false-value': attr.ngFalseValue,
                    'ng-change': attr.ngChange
                }, function(value, name) {
                    if (angular.isDefined(value)) {
                        input.attr(name, value);
                    }
                });

                if (sys.getPlatform() != 'ios') {
                    attr.toggleClass = attr.toggleClass ? attr.toggleClass + 'toggle-small' : 'toggle-small';
                }

                if(attr.toggleClass) {
                    element[0].getElementsByTagName('label')[0].classList.add(attr.toggleClass);
                }

                return function($scope, $element, $attr) {
                    var el, checkbox, track, handle;

                    el = $element[0].getElementsByTagName('label')[0];
                    checkbox = el.children[0];track = el.children[1];
                    handle = track.children[0];

                    var ngModelController = angular.element(checkbox).controller('ngModel');

                    $scope.toggle = new ionic.views.Toggle({
                        el: el,
                        track: track,
                        checkbox: checkbox,
                        handle: handle,
                        onChange: function() {
                            if(checkbox.checked) {
                                ngModelController.$setViewValue(true);
                            } else {
                                ngModelController.$setViewValue(false);
                            }
                            $scope.$apply();
                        }
                    });

                    /* Фикс для тогглов */
                    $scope.toggle.dragStart = function(e) {
                        if(this.checkbox.disabled) return;
                        var leftOffset = $(this.el).offset().left;
                        this._dragInfo = {
                            width: this.el.offsetWidth,
                            left: leftOffset,
                            right: leftOffset + this.el.offsetWidth,
                            triggerX: this.el.offsetWidth / 2,
                            initialState: this.checkbox.checked
                        };

                        // Stop any parent dragging
                        e.gesture.srcEvent.preventDefault();

                        // Trigger hold styles
                        this.hold(e);
                    },

                    $scope.$on('$destroy', function() {
                        $scope.toggle.destroy();
                    });
                };
            }

        };
    }]);

    /* Кнопка для очистки полей ввода */
    app.directive('inputClearBtn', [function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var container = angular.element('<div class="input-clear-container"/>');
                if (element.hasClass('width100pc')) {
                    container.addClass('width100pc');
                }
                if (!element.hasClass('rs-spotlight-search')) {
                    element.wrap(container);
                }

                var btn = angular.element('<div class="input-clear-btn"/>');
                btn.insertAfter(element);
                var container = element.parent();
                element.on('focus', function() {
                    if (element.val() != '') {
                        setTimeout(function() {
                            container.addClass('input-has-button');
                        }, 0);

                    }
                });
                element.on('input', function() {
                    if (element.val() != '') {
                        container.addClass('input-has-button');
                    } else {
                        container.removeClass('input-has-button');
                    }
                });
                element.on('blur', function() {
                    container.removeClass('input-has-button');
                });
                btn.on('click', function() {
                    if (attrs.ngModel) {
                        scope.$apply(attrs.ngModel + ' = ""');
                    } else {
                        element.val('');
                    }
                    setTimeout(function() {
                        element.focus();
                    }, 0);
                });
            }
        }
    }]);

    /* Установка фокуса на первый дочерний input по тапу */
    app.directive('focusInput', [function() {
        return {
            restrict: 'A',
            link: function(scope, element) {
                element.on('click', function() {
                    var input = element.find('input');
                    if (input.length > 0) {
                        setTimeout(function () {
                            input.eq(0).focus();
                        }, 0);
                    }
                });
            }
        }
    }]);

    /*Работа с svg*/
    app.directive('svgContent', function() {
        return {
            template: '<ng-include src="mypath" ng-class="myclass"/>',
            scope:{
                mypath:'@svgPath',
                myclass:'@svgClass'
            },
            replace: true
        }
    });

    /* Автофокус */
    app.directive('rsAutoFocus', [function() {
        return {
            restrict: 'A',
            link: function(scope, element) {
                setTimeout(function() {
                    if (element.focus) {
                        element.focus();
                    }
                }, 150);
            }
        }
    }]);

    /* Прикрепление кнопки с bottom: 0 к клавиатуре под iOS */
    app.directive('iosKeyboardAttach', ['$window', function($window) {
        return {
            restrict: 'A',
            link: function(scope, element) {
                var relayout = function(event) {
                    element.css('bottom', event.keyboardHeight + 'px');
                };
                $window.addEventListener('keyboardHeightWillChange', relayout, false);
                scope.$on('$destroy', function() {
                    $window.removeEventListener('keyboardHeightWillChange', relayout, false);
                });
            }
        }
    }]);

}(window.AppConfig || {}));
