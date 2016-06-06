/**
 * Created by varzinov on 20.08.2015.
 */
(function (config) {
    var module = angular.module('app');

    module.controller('ChatCtrl', ['$scope', '$rootScope', '$state', '$ionicActionSheet', '$ionicPopover', 'WebWorker', 'sys', 'chat', function($scope, $rootScope, $state, $ionicActionSheet, $ionicPopover, WebWorker, sys, chat) {
        var controller = this;
        controller.messages = chat.getMessages();
        if (controller.messages === null) {
            chat.setMessages([]);
            controller.messages = chat.getMessages();
        }

        controller.getMoreMessages = function(){
            var beforeMsgMillisec = chat.getEarliestMessageTime();
            WebWorker.invoke('getMessages', beforeMsgMillisec, 5).then(function(result){
                if (result) {
                    chat.loadMessages(result.data);
                }
            }).finally(function(){
                sys.getFramework7App().pullToRefreshDone();
            });
        };

        /* Помечаем на сервере новые сообщения как прочитанные и очищаем на клиенте массив непрочитанных сообщений */
        var addNewMessagesToChat = function() {
            var newMessageIds = [];
            var newMessages = chat.getNewMessages();
            for (var i = 0; i < newMessages.length; i++) {
                newMessageIds.push(newMessages[i].id);
                // Т.к. чат не загружается заново добавим новые непрочитанные сообщения в конец списка
                if (controller.messages.length) {
                    chat.appendMessage(newMessages[i]);
                }
            }
            chat.setNewMessages([]);
            WebWorker.invoke('markChatMessagesAsRead', newMessageIds);
        };

        addNewMessagesToChat();
        $scope.$on('newChatMessagesArrived', function(){
            addNewMessagesToChat();
        });

        var focusInput = function() {
            setTimeout(function() {
                jQuery('.messagebar textarea').focus();
            }, 10);
        };

        controller.sendMessage = function(text, imageData) {
            var txt = null, img = null;

            if (imageData) {
                img = imageData;
            } else {
                txt = angular.isString(text) ? text.trim() : '';
                if (!txt) {
                    alert('Поле "Текст сообщения"\nне заполнено').then(function() {
                        focusInput();
                    });
                    return false;
                }
                if (txt.length > 15000) {
                    alert('Сообщение, которое превышает 15000 символов, не может быть отправлено', 'Слишком большое сообщение').then(function() {
                        focusInput();
                    });
                    return false;
                }
            }

            WebWorker.invoke('sendMessage', txt, img).then(function(result){
                chat.appendMessage({
                    text: txt,
                    author: {uuid: $scope.userUuid},
                    dateCreate: new Date(),
                    attachments: img ? [{data: img}] : null
                });
            }).catch(function(result){
                alert('Не удалось отправить ' + (img ? 'картинку' : 'сообщение'), 'Ошибка').then(function() {
                    focusInput();
                });
            });

            return true;
        };

        controller.selectPicture = function(){
            if (navigator && navigator.camera) {
                navigator.camera.getPicture(
                    function (imageData) {
                        controller.sendMessage(null, imageData);
                    },
                    function (message) {
                        console.log('Failed to select picture: ' + message);
                    },
                    {
                        destinationType: Camera.DestinationType.DATA_URL, // Return image as base64-encoded string
                        sourceType: Camera.PictureSourceType.PHOTOLIBRARY, // Выбор из фотоальбома
                        allowEdit: true // Редактирование перед выбором
                    }
                );
            }
        };

        controller.takePicture = function(){
            if (navigator && navigator.camera) {
                navigator.camera.getPicture(
                    function (imageData) {
                        controller.sendMessage(null, imageData);
                    },
                    function (message) {
                        console.log('Failed to take picture: ' + message);
                    },
                    {
                        destinationType: Camera.DestinationType.DATA_URL, // Return image as base64-encoded string
                        sourceType: Camera.PictureSourceType.CAMERA, // Сделать фото
                        allowEdit: true // Редактирование перед выбором
                    }
                );
            }
        };

        /* Показать ActionSheet под iOS при клике на элемент "Загрузить аватар" */
        controller.showActionSheet = function() {

            $ionicActionSheet.show({
                cssClass: 'rs-online-chat-actionsheet',
                buttons: [
                    { text: 'Выбрать фото' },
                    { text: 'Сделать фото' }
                ],
                buttonClicked: function(index) {
                    switch (index) {
                        case 0:
                            controller.selectPicture();
                            return true;
                        case 1:
                            controller.takePicture();
                            return true;
                    }
                },
                cancelText: 'Отменить'
            });
        };

        /* Показать popover под android при клике на элемент "Загрузить аватар" */
        $ionicPopover.fromTemplateUrl('templates/onlinechat.popover.html', {
            scope: $scope
        }).then(function(popover) {
            controller.openPopover = function($event) {
                popover.show($event);
            };
            controller.closePopover = function() {
                popover.hide();
            };
            $scope.$on('$destroy', function() {
                popover.remove();
            });
        });

        controller.attachPicture = function($event) {
            if ($scope.platform === 'ios') {
                controller.showActionSheet();
            } else {
                controller.openPopover($event);
            }
        };
    }]);

    module.controller('IdeaBankCtrl', ['$scope', '$state', '$filter', 'ideabank', function($scope, $state, $filter, ideabank) {
        ideabank.markAsSeen();

        var controller = this;

        this.filterIdeas = function(ideaFilter) {
            controller.ideas = ideabank.getIdeas(ideaFilter, $scope.userUuid);
            $scope.$applyAsync();
        };

        this.markIdeasAsSeen = function() { $state.reload(); };

        this.isNewIdea = function(idea){
            return ideabank.newIdeaDetector($state.current.lastVisit)(idea);
        };

        this.voteForIdea = function(idea, vote) {
            ideabank.voteForIdea(idea, vote).then(function(result){
                idea.questions[0].answers[vote ? 0 : 1].count.count++;
                idea.myAnswer = vote;
            });
        };
    }]);

    module.controller('IdeaBankCreateIdeaCtrl', ['$scope', 'ideabank', '$window', function($scope, ideabank, $window) {
        this.createIdea = function(){
            if (!this.subject || !this.desc) {
                $window.alert('Необходимо заполнить все поля!');
                return;
            }
            ideabank.createIdea(this.subject, this.desc).then(function(response){
                $window.alert('Спасибо за идею! \nВ ближайшее время мы постараемся ее рассмотреть.');
            }).catch(function(){
                $window.alert('Не удалось создать идею\nПопробуйте еще раз.');
            });
            $scope.goBack();
        };
    }]);

    module.controller('AtmsAndOfficesCtrl', ['$q', '$scope', '$filter', '$timeout', '$ionicPopover', 'sys', 'geo', 'utils',
                        'WebWorker', 'navigation', '$ionicActionSheet', '$state', '$ionicModal', '$ionicScrollDelegate',
                        function($q, $scope, $filter, $timeout, $ionicPopover, sys, geo, utils, WebWorker, navigation,
                                 $ionicActionSheet, $state, $ionicModal, $ionicScrollDelegate) {
        $scope.search = {text: ''};
        $scope.ymap = {};
        $scope.points = [];
        $scope.displayMap = true;
        $scope.atmFilter = {};

        $scope.formatDistance = geo.formatDistanceKm;
        $scope.formatDistancePrecise = geo.formatDistance;

        $scope.location = geo.getPosition({ enableHighAccuracy: true, timeout: 5000, maximumAge: 5000 });
        $scope.position = null;
        $scope.location.then(function(value) {
            $scope.position = value;
        });

        $scope.showDetails = function() {
            if ($scope.selectedPoint) {
                $state.go('.object', { point: $scope.selectedPoint });
            }
        };
        $scope.clearBalloon = function() {
            $scope.selectedPoint = null;
        };

        $scope.getMyLocation = function() {
            $scope.ymap.controller.getMyLocation(true);
        };

        $scope.showHeaderMenu = false;
        $scope.toggleHeaderMenu = function() {
            $scope.showHeaderMenu = !$scope.showHeaderMenu;
        };

        /* Типы объектов на карте */
        $scope.objectTypes = [{
            name: 'Банкоматы МТС',
            id: 'bankAtm',
            filter: true
        }, {
            name: 'Банкоматы партнеров',
            id: 'otherBankAtm',
            filter: false
        }, {
            name: 'Офисы банка',
            id: 'officeBank',
            filter: false
        }, {
            name: 'Салоны МТС',
            id: 'rtk',
            filter: false
        }];

        if ($state.params.type) {
            var selected = $scope.objectTypes.filter(function(type) {
                return type.id == $state.params.type;
            });
            if (selected.length == 1) {
                $scope.type = selected[0];
            } else {
                $scope.type = $scope.objectTypes[0];
            }
        } else {
            $scope.type = $scope.objectTypes[0];
        }

        $scope.selectType = function(index) {
            $scope.type = $scope.objectTypes[index];
            $scope.showHeaderMenu = false;
            getObjects();
        };

        /* ------- Popover фильтра для банкоматов ------- */
        var popupProvider = (sys.getPlatform() === 'ios')? $ionicPopover : $ionicModal;
        popupProvider.fromTemplateUrl('templates/atmsandoffices/popover-' + sys.getPlatform() + '.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.openPopover = function($event) {
                popover.show($event);
            };
            $scope.closePopover = function() {
                popover.hide();
            };
            $scope.closePopoverGracefully = function(){
                $timeout(function(){
                    popover.hide();
                }, 200);
            };
            $scope.$on('$destroy', function() {
                popover.remove();
            });
        });
        /* ------------------------------------ */


        /* ------- Инициализация доступных навигаторов -- */
        navigation.getAvailable();
        if (sys.getPlatform() != 'ios') {
            $scope.navigatorsPopup = $ionicModal.fromTemplate(
                '<div class="rs-popup-menu rs-navigators-popup" ng-style="{bottom: balloonHeight ? balloonHeight : null }">' +
                    '<div class="list-block">' +
                        '<ul>' +
                            '<li class="item-content item-inner">' +
                                '<span class="rs-header-menu-text" style="color:red">Проложить маршрут с помощью</span>' +
                            '</li>' +
                            '<li class="item-content item-inner" ng-repeat="navApp in navigators" ng-click="navigate($index)">' +
                                '<span class="rs-header-menu-text">{{navApp.name}}</span>' +
                            '</li>' +
                        '</ul>' +
                    '</div>' +
                '</div>',
                { scope: $scope });
        }

        $scope.navigate = function(index) {
            navigation.navigate(index, $scope.position, $scope.destination);
        };

        $scope.makeRoute = function(position) {
            if ($scope.position) {
                navigation.getAvailable().then(function(navigators) {
                    var buttons = [];
                    angular.forEach(navigators, function(nav) {
                        buttons.push({
                            text: nav.name
                        });
                    });

                    if (navigators.length == 0) {
                        navigation.fallback(position);
                        return;
                    }

                    if (sys.getPlatform() == 'ios') {
                        $ionicActionSheet.show({
                            cssClass: 'rs-navigators-popup',
                            buttons: buttons,
                            cancelText: 'Отмена',
                            titleText: 'Проложить маршрут с помощью',
                            cancel: function () {
                            },
                            buttonClicked: function (index) {
                                navigation.navigate(index, $scope.position, position);
                                return true;
                            }
                        });
                    } else {
                        $scope.navigators = navigators;
                        $scope.balloonHeight = $('.rs-geolocation-balloon-panel').eq(0).height() - 20;
                        if ($scope.balloonHeight < 16) {
                            $scope.balloonHeight = 16;
                        }
                        $scope.destination = position;
                        $scope.navigatorsPopup.show();
                    }
                });
            } else {
                alert('В настройках Вашего устройства необходимо включить использование функции геолокации для приложения «МТС Банк».', 'Не удалось определить Ваше местоположение');
            }
        };

        $scope.getDistance = function(pos) {
            if (!pos || !$scope.position) {
                return;
            }
            if (window.ymaps) {
                return Math.floor(ymaps.coordSystem.geo.getDistance(pos, $scope.position));
            } else {
                return geo.getHaversineDistance(pos, $scope.position);
            }
        };

        /**
         * Запрашивает объекты на карте внутри видимых границ mapBounds
         * если видимая область карты - только часть какого-либо города cityName,
         * то результат будет также содержать объекты в этом городе, которые находятся вне области видимости
         */
        var mapObjects;
        var getMapObjects = function(mapBounds, cityName, objectType){
            WebWorker.invoke(
                'getMapObjects',
                mapBounds[0][0] + ',' + mapBounds[0][1] + ',' + mapBounds[1][0] + ',' + mapBounds[1][1],
                cityName,
                objectType
            ).then(function(result) {
                if (result && result.data && angular.isArray(result.data.features)) {
                    mapObjects = result.data;
                    $scope.applyAtmFilter();
                }
            });
        };

        var geoPositionErrText = 'Не удалось определить ваше местоположение. В настройках вашего устройства необходимо включить использование функции геолокации для приложения «МТС Банк»'
        $scope.handleMapError = function($error){
            switch($error.code) {
                case -1: $scope.mapErrorMsg = '«Сервис Яндекс не доступен»'; break;
                case -2: $scope.mapErrorMsg = geoPositionErrText; break;
                default:  $scope.mapErrorMsg = '';
            }
        };

        var clearPoints = function(){
            $scope.ymap.controller.clearFeatures();
        };

        var sendRequest = function(mapBounds, cityName, objectType) {
            // Банкоматы партнеров и салоны МТС загружаем только если пользователь установил зум больше 9
            if (!/^(otherBankAtm|rtk)$/.test(objectType) || $scope.mapZoom > 9) {
                if ($scope.isAuthorized) {
                    getMapObjects(mapBounds, cityName, objectType);
                } else {
                    /* в неавторизованной зоне на всякий случай очистим куки (иногда вылетает ошибка) */
                    sys.clearWebViewCookies().then(function () {
                        WebWorker.initSslCheck();
                        getMapObjects(mapBounds, cityName, objectType);
                    });
                }
            }

            // Удалим с карты банкоматы партнеров и салоны МТС, если пользователь установил зум <= 9
            if (/^(otherBankAtm|rtk)$/.test(objectType) && $scope.mapZoom <= 9) {
                clearPoints();
            }
        };

        $scope.$on('placemarkSelected', function (evt, point) {
            $scope.selectedPoint = point;
            $scope.$applyAsync();
        });

        var objListPosition = 0;
        var batchSize = 50;
        $scope.geoObjectsList = [];
        $scope.hasMoreToLoad = true;
        $scope.loadMoreGeoObjects = function() {
            delete $scope.geoObjectsListErrMsg;
            var geoObjectsList = $scope.geoObjectsList;

            var atmFilterArr = [];
            for (var prop in $scope.atmFilter) {
                if ($scope.atmFilter[prop]) {
                    atmFilterArr.push(prop);
                }
            }
            var atmFilterStr = atmFilterArr.join(';') || null;

            geo.getPosition().then(function(coords) {
                // Используем reject при успешном получении координат, т.к. finally не позволяет передавать параметры
                return $q.reject(coords);
            }).catch(function(coords) {
                // Если координаты не удастся получить, то все равно отправим запрос - сортировка выполнится по наименованию
                var lat = angular.isArray(coords) ? coords[0] : null;
                var lng = angular.isArray(coords) ? coords[1] : null;
                var promise = WebWorker.invoke('getNearestGeoObjects', lat, lng, $scope.type.id, atmFilterStr, $scope.search.text, objListPosition, batchSize);
                objListPosition += batchSize;
                return promise;
            }).then(function(result){
                var moreObjects = result && result.data && result.data.features || [];
                if (utils.isEmpty(moreObjects) || angular.isArray(moreObjects) && moreObjects.length < batchSize) {
                    $scope.hasMoreToLoad = false;
                }
                if (!utils.isEmpty(moreObjects)) {
                    Array.prototype.push.apply(geoObjectsList, moreObjects);
                }
            }).catch(function(err){
                $scope.hasMoreToLoad = false;
                if (angular.isString(err)) {
                    $scope.geoObjectsListErrMsg = geoPositionErrText;
                } else if (angular.isObject(err) && err.code == 8 && angular.isString(err.msg)) {
                    $scope.geoObjectsListErrMsg = err.msg;
                } else {
                    $scope.geoObjectsListErrMsg = 'Неизвестная ошибка при выполнении операции';
                }
            }).finally(function(){
                $scope.$broadcast('scroll.infiniteScrollComplete');
                $ionicScrollDelegate.resize();
            });
        };

        var clearObjectsList = function(){
            objListPosition = 0;
            $scope.geoObjectsList = [];
            $scope.hasMoreToLoad = true;
            $ionicScrollDelegate.resize();
            $ionicScrollDelegate.scrollTop();
        };

        $scope.$watch('search.text', function(newText, oldText){
            if (newText !== oldText) { // Чтобы не срабатывало при первоначальном входе на страницу, когда пользователь еще ничего не вводил
                sys.buffer(function () {
                    clearObjectsList();
                    $scope.loadMoreGeoObjects();
                });
            }
        });

        $scope.onChangeBounds = function(mapBounds, zoom) {
            $scope.mapBounds = mapBounds;
            $scope.mapZoom = zoom;
            sendRequest(mapBounds, null, $scope.type.id);
        };

        $scope.toggleDisplay = function(evt) {
            $scope.displayMap = !$scope.displayMap;
            $('.offices-result-type').removeClass('activated');
            if (evt) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        };

        var getObjects = function() {
            clearPoints();
            sendRequest($scope.mapBounds, null, $scope.type.id);
            clearObjectsList();
        };

        $scope.setAtmFilter = function() {
            if ($scope.displayMap) {
                $scope.ymap.controller.clearFeatures();
                $scope.applyAtmFilter();
            } else {
                clearObjectsList();
            }
        };

        $scope.applyAtmFilter = function() {
            var filteredMapObjects = {
                type: 'FeatureCollection',
                features: mapObjects.features || []
            };

            if ($scope.type.id == 'bankAtm') {
                if ($scope.atmFilter.allDayBankAtm) {
                    filteredMapObjects.features = $filter('allDayBankAtmOnly')(filteredMapObjects.features);
                }
                if ($scope.atmFilter.allWeekBankAtm) {
                    filteredMapObjects.features = $filter('allWeekBankAtmOnly')(filteredMapObjects.features);
                }
                if ($scope.atmFilter.cashInBankAtm) {
                    filteredMapObjects.features = $filter('cashInBankAtmOnly')(filteredMapObjects.features);
                }
            }

            $scope.ymap.controller.addFeatures(filteredMapObjects);
        };
    }]);

    module.controller('AtmsAndOfficesPointCtrl', ['$scope', '$stateParams', 'geo', function($scope, $stateParams, geo) {
        $scope.point = $stateParams.point;
        if (!$scope.distance && $scope.position) {
            $scope.distance = $scope.formatDistance(geo.getHaversineDistance($scope.position, $scope.point.geometry.coordinates));
        } else {
            $scope.distance = $scope.formatDistance($scope.point.distance);
        }
        $scope.formatServicesString = function(servicesStr) {
            servicesStr =  servicesStr.replace(/;/g, '\r\n');
            return servicesStr.replace(/,(?! )/g, ', ');
        };
    }]);

    module.controller('OnlineCallCtrl', ['$scope', '$window', function($scope, $window) {

        var isZingayaPluginInstalled = function(){
            return $window.zingaya
                && angular.isFunction($window.zingaya.hangup)
                && angular.isFunction($window.zingaya.call)
                && angular.isFunction($window.zingaya.microphoneOn)
                && angular.isFunction($window.zingaya.microphoneOff);
        };
        if (!isZingayaPluginInstalled()) { console.warn('Плагин Zingaya не установлен!'); }

        $scope.$on('$destroy', function () {
            $scope.hangUp();
            $scope.microphoneOn();
        });

        $scope.hangUp = function(){
            if (!isZingayaPluginInstalled()) { return; }
            $window.zingaya.hangup(
                function(status){
                    console.log('Hang up successful', status);
                }, function(status){
                    console.warn('Hang up error', status);
                }
            );
        };

        ($scope.dialUp = function(){
            if (!isZingayaPluginInstalled()) { return; }

            $scope.lastDialUpStatus = 'Идёт соединение...';
            $window.zingaya.call(
                function(status){
                    $scope.lastDialUpStatus = status;
                    $scope.$applyAsync();
                }, function(status){
                    console.warn('Dial up error', status);
                    $scope.goBack();
                }, config.onlineCallNumber /* номер берется из конфигурационного файла */
            );
        })();

        $scope.microphoneOn = function(){
            if (isZingayaPluginInstalled()) {
                $window.zingaya.microphoneOn(
                    function (status) {
                        console.log('Turning on microphone successful', status);
                    }, function (status) {
                        console.warn('Turning on microphone error', status);
                    }
                );
            }
        };

        $scope.microphoneOff = function(){
            if (isZingayaPluginInstalled()) {
                $window.zingaya.microphoneOff(
                    function (status) {
                        console.log('Turning off microphone successful', status);
                    }, function (status) {
                        console.warn('Turning off microphone error', status);
                    }
                );
            }
        };

        var toggleFlag = true;
        $scope.toggleMicrophone = function() {
            if (toggleFlag = !toggleFlag) {
                $scope.microphoneOff();
            } else {
                $scope.microphoneOn();
            }
        };

    }]);

    module.controller('TutorScreensCtrl', ['$scope', '$ionicModal', 'WebWorker', function($scope, $ionicModal, WebWorker) {
        /* ------- Модальное окно с туториалом ------- */
        var modal;
        $ionicModal.fromTemplateUrl('templates/tutorscreens.fullsearchresult.html', function ($ionicModal) {
            modal = $ionicModal;
        }, {
            scope: $scope
        });
        /* ------------------------------------ */

        $scope.search = {};
        $scope.$watch('search.question.name', function(newValue) {
            var text = newValue;
            if (text) {
                text = text.replace(/^\s+|\s+$/gm, '');
                if (text) {
                    if (!modal.isShown()) { modal.show(); }
                } else {
                    modal.hide();
                }
            }
        });

        $scope.$on('$stateChangeSuccess', function() {
            if (modal) { modal.hide(); }
        });
        $scope.$on('$destroy', function() {
            if (modal) { modal.hide(); }
        });

        var processingResults = function(data) {
            switch (data.cmdInfo) {
                case 'getQuestionCategories':
                    if (data) {
                        $scope.categories = data.result.data;
                        $scope.filteredQuestions = [];
                        if (angular.isArray($scope.categories)) {
                            for (var i = 0; i < $scope.categories.length; i++) {
                                if (angular.isArray($scope.categories[i].questions)) {
                                    for (var j = 0; j < $scope.categories[i].questions.length; j++) {
                                        $scope.categories[i].questions[j].category = $scope.categories[i].name;
                                        $scope.filteredQuestions.push($scope.categories[i].questions[j]);
                                    }
                                }
                            }
                        }
                    }
                    break;
            }
            $scope.$applyAsync();
        };
        WebWorker.setFunction(processingResults);

        WebWorker.postMessage('getQuestionCategories', 'getQuestionCategories');
    }]);

    module.controller('TutorScreensQuestionsCtrl', ['$scope', '$stateParams', function($scope, $stateParams) {
        $scope.category = $stateParams.category;
    }]);

    /**
     * Обслуживание в интернет-банке
     */
    module.controller('ServiceOnlineBankCtrl', ['$scope', '$state', 'productSrv', 'WebWorker', function($scope, $state, productSrv, WebWorker) {
        $scope.params = {};
        $scope.params.dateTo = new Date();
        $scope.params.dateFrom = new Date();
        $scope.params.dateFrom.setMonth($scope.params.dateFrom.getMonth() - 1);
        $scope.params.contract = true;
        $scope.params.option = true;
        $scope.params.security = true;
        $scope.params.payment = true;

        var processingResults = function(data) {
            switch (data.cmdInfo) {
                case 'getRetailDocBaseList':
                    $scope.retailDocBaseList = data.result.data;
                    $scope.docListDisplay = [];
                    $scope.docListDisplay = $scope.retailDocBaseList && $scope.retailDocBaseList.slice(0, $scope.docListDisplay.length + 10);
                    break;
            }
            $scope.$applyAsync();
        };
        WebWorker.setFunction(processingResults);
        WebWorker.postMessage('getRetailDocBaseList', 'getRetailDocBaseList', [$scope.params]);

        $scope.showFilter = function() {
            $state.go('serviceOnlineBank.serviceFilterOnlineBank');
        };

        $scope.applyFilter = function() {
            $scope.retailDocBaseList = undefined;
            $scope.docListDisplay = undefined;
            WebWorker.postMessage('getRetailDocBaseList', 'getRetailDocBaseList', [$scope.params]);
            $scope.goBack();
            $scope.$applyAsync();
        };

        $scope.showMore = function() {
            $scope.docListDisplay = $scope.retailDocBaseList && $scope.retailDocBaseList.slice(0, $scope.docListDisplay.length + 10);
            $scope.$applyAsync();
        };

        /* Показать детальную инфу (пока только для платежей) */
        $scope.showDetails = function(retailDoc) {
            if (retailDoc.operation) {
                productSrv.setCurrentOperation(JSON.parse(retailDoc.operation));
                $state.go('serviceOnlineBank.operation');
            }
        };
    }]);
}(window.AppConfig));