/* Директивы и сервисы общего назначения */
(function() {
    var module = angular.module('commonNgUtilities', []);

    /*
     * Директива when-scroll-ends. Используется для lazy loading данных при прокрутке списка, тела таблицы или любого контейнера.
     */
    module.directive('whenScrollEnds', function() {
        return {
            restrict: "A",
            link: function(scope, element, attrs) {
                var visibleHeight = element.height();
                var threshold = 100; // Устанавливает за какое расстояние до конца прокрутки выполнять функцию lazy loading.

                element.scroll(function() {
                    var scrollableHeight = element.prop('scrollHeight');
                    var hiddenContentHeight = scrollableHeight - visibleHeight;

                    if (hiddenContentHeight - element.scrollTop() <= threshold) {
                        // Прокрутка выполнена почти до конца контейнера. Вызывается обработчик.
                        scope.$apply(attrs.whenScrollEnds);
                    }
                });
            }
        };
    });
    /*
     * Директива when-scroll-ends-wp. Используется в качестве альтернативы on-scroll-complete для Windows phone
     */
    module.directive('whenScrollEndsWp', ['$rootScope', '$timeout', function($rootScope, $timeout) {
        return {
            restrict: "A",
            link: function(scope, element, attrs) {
                if (!$rootScope.adaptToWindowsphone) {
                    return;
                }
                var visibleHeight = element.height();
                var threshold = 10; // Устанавливает за какое расстояние до конца прокрутки выполнять функцию lazy loading.
                var debounce = 500; // Устанавливает минимальную задержку между вызовами функции в миллисекундах

                var onScroll = function() {
                    var scrollableHeight = element.prop('scrollHeight');
                    var hiddenContentHeight = scrollableHeight - visibleHeight;

                    if (hiddenContentHeight - element.scrollTop() <= threshold) {
                        // Прокрутка выполнена почти до конца контейнера. Вызывается обработчик.
                        element.off('scroll');
                        var promise = scope.$apply(attrs.whenScrollEndsWp);
                        if (promise) {
                            promise.finally(function() {
                                element.scroll(onScroll);
                            });
                        } else {
                            $timeout(function() {
                                element.scroll(onScroll);
                            }, debounce);
                        }
                    }
                };

                element.scroll(onScroll);
            }
        };
    }]);

    /*
     * Директива scroll-auto-down для автопрокрутки контейнера вниз при добавлении содержимого
     */
    module.directive('scrollAutoDownOnAppend', ['$timeout', function($timeout) {
        return {
            restrict: "A",
            link: function(scope, element, attrs) {
                scope.$watchCollection(attrs.scrollAutoDownOnAppend, function(newVal) {
                    // $timeout нужен чтобы обеспечить установку позиции скроллинга после того, как контейнер отрендерен
                    $timeout(function() {
                        element[0].scrollTop = element[0].scrollHeight;
                    });      
                });  
            }
        };
    }]);

    /**
     * Загрузка дефолтного имиджа на случай если произошла ошибка при загрузке в src
     */
    module.directive('fallbackSrc', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.bind('error', function() {
                    $timeout(function(){
                        element.attr('src', attrs.fallbackSrc);
                    });
                });
            }
        };
    }]);

    /*
     * Директива transclude-replace. Отличается от ng-transclude тем, что вместо вставки в ноду полностью заменяет ее.
     */
     module.directive('transcludeReplace', ['$log', function ($log) {
        return {
            terminal: true,
            restrict: 'EA',

            link: function (scope, element, attrs, ctrl, transclude) {
                if (!transclude) {
                    $log.error(
                        '[transcludeReplace:orphan]', 
                        'Illegal use of transcludeReplace directive in the template! No parent directive that requires a transclusion found.'
                    );
                    return;
                }

                transclude(function (clone) {
                    if (clone.length) {
                        element.replaceWith(clone);
                    } else {
                        element.remove();
                    }
                });
            }
        };
    }]);

    /*
     * Сервис для программной загрузки скриптов
     */
    module.factory('script', ['$http', '$q', '$document', function($http, $q, $document){
        var notifCache = {};

        var load = function(scriptUrl) {
            var deferred = $q.defer();

            if (notifCache[scriptUrl]) {
                notifCache[scriptUrl].push(deferred);
            } else {
                if (notifCache[scriptUrl] === undefined) {
                    notifCache[scriptUrl] = [];
                    notifCache[scriptUrl].push(deferred);

                    var timeout = new Date();
                    $http.get(scriptUrl).then(
                        function(response) {
                            return response.data;
                        },
                        function(response) {
                            if (response.status === 0) {
                                if (new Date().getTime() - timeout.getTime() > 1000) {
                                    response.statusText = 'Connection timed out';
                                } else {
                                    response.statusText = 'Network is unreachable';
                                }
                            }
                            return $q.reject(response);
                        }
                    ).then(
                        function(jsCode){
                            var script = $document[0].createElement('script');
                            script.src = 'data:text/javascript,' + encodeURI(jsCode);
                            script.onload = function() {
                                var df;
                                while (df = notifCache[scriptUrl].pop()) {
                                    df.resolve();
                                }
                                notifCache[scriptUrl] = null;
                            };
                            $document[0].body.appendChild(script);
                        }
                    ).catch(function(response){
                        var df;
                        while (df = notifCache[scriptUrl].pop()) {
                            df.reject(response);
                        }
                        delete notifCache[scriptUrl];
                    });
                } else {
                    deferred.resolve();
                }
            }

            return deferred.promise;
        };

        return {
            load: load
        };
    }]);

    /*
     * Директива ymap. Отображение Яндекс.Карт
     */
    module.directive('ymap', ['$q', 'script', 'geo', 'sys', '$timeout', function($q, script, geo, sys, $timeout) {
        var API_URL = "https://api-maps.yandex.ru/2.1/?lang=ru_RU";
        var mapCount = 0;

        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {
                points: '=',
                mapCenter: '@',
                zoom: '@',
                icon: '@',
                iconSize: '@',
                iconOffset: '@',
                onChangeBounds: '&',
                onChangeCity: '&',
                ymapCtrl: '=?',
                noControls: '@',
                noDrag: '@',
                onError: '&'
            },
            controller: ['$scope', function($scope) {
                $scope.ymapCtrl = this;
                this.toArrayIfString = function(obj) {
                    if (angular.isString(obj)) {
                        var numArray = obj.replace(/^\s*\[\s*/, '').replace(/\s*\]\s*$/, '').split(/\s*,\s*/);
                        for (var i = 0; i < numArray.length; i++) {
                            var floatValue = parseFloat(numArray[i]);
                            numArray[i] = isNaN(floatValue) ? numArray[i] : floatValue;
                        }
                        return numArray;
                    } else {
                        return obj;
                    }
                };

                var createPlacemark = function(placemarkConfig) {
                    var placemark = new ymaps.Placemark(
                        placemarkConfig.position, {}, {
                            iconLayout: placemarkConfig.icon ? 'default#image' : undefined,
                            iconImageHref: placemarkConfig.icon || undefined,
                            iconImageSize: placemarkConfig.iconSize || undefined,
                            iconImageOffset: placemarkConfig.iconOffset || undefined
                        }
                    );
                    placemark.placemarkConfig = placemarkConfig;
                    placemark.events.add(['click'], function (e) {
                        var target = e.get('target');
                        var evtType = e.get('type');
                        if (evtType == 'click') {
                            var placemarks = $scope.clusterer.getGeoObjects();
                            for (var i = 0; i < placemarks.length; i++) {
                                placemarks[i].options.set('iconImageHref', placemarks[i].placemarkConfig.icon || undefined);
                                placemarks[i].options.set('iconImageSize', placemarks[i].placemarkConfig.iconSize || undefined);
                                placemarks[i].options.set('iconImageOffset', placemarks[i].placemarkConfig.iconOffset || undefined);
                            }
                            target.options.set('iconImageHref', placemarkConfig.iconSelected || placemarkConfig.icon || undefined);
                            target.options.set('iconImageSize', (placemarkConfig.iconSelected ? placemarkConfig.iconSelectedSize : placemarkConfig.iconSize) || undefined);
                            target.options.set('iconImageOffset', (placemarkConfig.iconSelected ? placemarkConfig.iconSelectedOffset : placemarkConfig.iconOffset) || undefined);
                            var selectedPoint = $scope.points.filter(function(point) {
                                return point.id == placemarkConfig.id;
                            });
                            $scope.$emit('placemarkSelected', selectedPoint[0]);
                        }
                    });
                    $scope.clusterer.add(placemark);
                    placemarkConfig.deferred.resolve(placemark);
                };

                var placemarkBuffer = $scope.placemarkBuffer = [];

                this.addPlacemark = function(placemarkConfig) {
                    //TODO: Проверка на наличие свойств
                    placemarkConfig.position = this.toArrayIfString(placemarkConfig.position);
                    placemarkConfig.iconSize = this.toArrayIfString(placemarkConfig.iconSize);
                    placemarkConfig.iconOffset = this.toArrayIfString(placemarkConfig.iconOffset);
                    placemarkConfig.iconSelectedSize = this.toArrayIfString(placemarkConfig.iconSelectedSize);
                    placemarkConfig.iconSelectedOffset = this.toArrayIfString(placemarkConfig.iconSelectedOffset);

                    // Если пришел запрос на добавление объекта, ранее помещенного в буфер до создания карты,
                    // то его конфигурация уже содержит deferred
                    var deferred = placemarkConfig.deferred || (placemarkConfig.deferred = $q.defer());

                    if ($scope.map) {
                        createPlacemark(placemarkConfig);
                    } else {
                        placemarkBuffer.push(placemarkConfig);
                    }

                    return deferred.promise;

                };

                this.removePlacemark = function(placemark) {
                    $scope.clusterer.remove(placemark);
                };

                $scope.objectManagerDeferred = $q.defer();
                this.addFeatures = function(data){
                    if (data && data.type == 'FeatureCollection') {
                        $scope.objectManagerDeferred.promise.then(function (objectManager) {
                            objectManager.add(data);
                        });
                    }
                };

                this.clearFeatures = function(){
                    $scope.objectManagerDeferred.promise.then(function (objectManager) {
                        objectManager.removeAll();
                    });
                    if ($scope.clearSelectedPoint) {
                        $scope.clearSelectedPoint();
                    }
                };

                $scope.$on('$destroy', function() {
                    if ($scope.map) {
                        $scope.map.destroy();
                    }
                });
            }],
            link: function(scope, element, attrs, ctrl) {
                scope.id = attrs.id ? attrs.id : 'ng-ymaps-parent-container-' + ++mapCount;
                var noControls = scope.noControls = ('noControls' in attrs) && angular.isUndefined(scope.noControls) || scope.noControls;
                var noDrag = scope.noDrag = ('noDrag' in attrs) && angular.isUndefined(scope.noDrag) || scope.noDrag;

                script.load(API_URL).then(function(){
                    ymaps.ready(function(){

                        var createMap = function(){
                            // Дефолтные значения
                            var mapCenter = ctrl.toArrayIfString(scope.mapCenter) || ['55.7517', '37.6178'];
                            var zoom = scope.zoom || 7;

                            /* Создание кастомных кнопок зума */
                            var ZoomLayout = ymaps.templateLayoutFactory.createClass(
                                '<div class="zoom-control"><button id="ymap-zoom-in" class="icon-50 icon-zoom-in"></button><button id="ymap-zoom-out" class="icon-50 icon-zoom-out"></button></div>',
                                {

                                build: function () {
                                    ZoomLayout.superclass.build.call(this);

                                    this.zoomInCallback = ymaps.util.bind(this.zoomIn, this);
                                    this.zoomOutCallback = ymaps.util.bind(this.zoomOut, this);
                                    angular.element('#ymap-zoom-in').bind('click', this.zoomInCallback);
                                    angular.element('#ymap-zoom-out').bind('click', this.zoomOutCallback);
                                },

                                clear: function () {
                                    angular.element('#ymap-zoom-in').unbind('click', this.zoomInCallback);
                                    angular.element('#ymap-zoom-out').unbind('click', this.zoomOutCallback);

                                    ZoomLayout.superclass.clear.call(this);
                                },

                                zoomIn: function () {
                                    var map = this.getData().control.getMap();
                                    this.events.fire('zoomchange', {
                                        oldZoom: map.getZoom(),
                                        newZoom: map.getZoom() + 1
                                    });
                                },

                                zoomOut: function () {
                                    var map = this.getData().control.getMap();
                                    this.events.fire('zoomchange', {
                                        oldZoom: map.getZoom(),
                                        newZoom: map.getZoom() - 1
                                    });
                                }
                            });

                            scope.clearSelectedPoint = function() {
                                scope.$emit('placemarkSelected', null);
                                if (prevObjectId) {
                                    scope.objectManager.objects.setObjectOptions(prevObjectId, angular.extend({}, unselectedObjectOptions));
                                }
                            };

                            /* Геолокация в яндекс картах не работает на устройствах при использовании objectManager */
                            var myLocation = null;
                            ctrl.getMyLocation = function(centerMap) {
                                geo.getPosition().then(function(position) {
                                    if (myLocation) {
                                        scope.map.geoObjects.remove(myLocation);
                                    }
                                    myLocation = new ymaps.Placemark(position, {}, {
                                        preset: 'islands#geolocationIcon'
                                    });
                                    scope.map.geoObjects.add(myLocation);
                                    if (centerMap) {
                                        scope.map.panTo(position);
                                    }
                                });
                            };

                            /* Отметим текущее положение на карте */
                            ctrl.getMyLocation(false);

                            if (!noControls) {
                                var customZoom = new ymaps.control.ZoomControl({
                                    options: {
                                        layout: ZoomLayout,
                                        position: {
                                            top: 'auto',
                                            right: 0,
                                            left: 'auto',
                                            bottom: 'auto'
                                        }
                                    }
                                });
                            }

                            scope.map = new ymaps.Map(scope.id, {
                                center: mapCenter,
                                zoom: zoom,
                                controls: noControls ? [] : [customZoom]
                            }, {
                                suppressMapOpenBlock: true
                            });

                            // --- BEGIN  Пейн для статической подложки карты
                            var subground = new ymaps.pane.StaticPane(scope.map, {
                                zIndex: 99,
                                css: {
                                    width: '100%',
                                    height: '100%',
                                    'background-color': '#f0f4f5'
                                }
                            });
                            scope.map.panes.insertBefore('subground', subground, 'ground');
                            // ----- END  Пейн для статической подложки карты
                            var copyrightsPane = $(scope.map.panes.get('copyrights').getElement());
                            copyrightsPane.addClass('ymaps-copyrights-fix');
                            //Скрытие ссылки на условия #100283
                            copyrightsPane.find('a').eq(0).parent().parent().css('display', 'none');

                            scope.map.events.add(['click'], function(e) {
                                scope.clearSelectedPoint();
                            });

                            if (noDrag) {
                                scope.map.behaviors.disable('drag');
                            }

                            //Отметим на карте текущее местоположение
                            if (scope.icon) {
                                var centerPointPlaceMark = new ymaps.Placemark(
                                    mapCenter, {}, {
                                        iconLayout: 'default#image',
                                        iconImageHref: scope.icon,
                                        iconImageSize: scope.ymapCtrl.toArrayIfString(scope.iconSize),
                                        iconImageOffset: scope.ymapCtrl.toArrayIfString(scope.iconOffset)
                                    }
                                );
                                scope.map.geoObjects.add(centerPointPlaceMark);
                            }

                            // ---------------------- Использование Object Manager BEGIN -------------------------------
                            // Когда объекты добавляются не через директиву yplacemark,
                            // а через контроллер директивы ymap как массив features
                            var platformStr = sys.getPlatform();
                            var pointIcon = 'img/' + platformStr + '/map-object.svg';
                            var pointIconActive = 'img/' + platformStr + '/map.svg';
                            scope.objectManager = new ymaps.ObjectManager({
                                clusterize: true,
                                zoomMargin: 264,
                                clusterIconColor: '#24a7b3',
                                clusterOpenBalloonOnClick: false,

                                geoObjectOpenBalloonOnClick: false,
                                geoObjectIconLayout: 'default#image',
                                geoObjectIconImageHref: pointIcon,
                                geoObjectIconImageSize: [36,36],
                                geoObjectIconImageOffset: [-18,-18]
                            });
                            var prevObjectId;
                            var unselectedObjectOptions = {
                                iconImageHref: pointIcon,
                                iconImageSize: [36,36],
                                iconImageOffset: [-18,-18]
                            };
                            var selectedObjectOptions = {
                                iconImageHref: pointIconActive,
                                iconImageSize: [36,36],
                                iconImageOffset: [-18,-36]
                            };

                            //Фикс для отрисовки меток.
                            if (sys.getPlatform() == 'ios') {
                                var overlays =  scope.objectManager.objects.overlays;
                                var fixOverlay = function(e) {
                                    $timeout(function() {
                                        var overlay = overlays.getById(e.get('objectId'));
                                        if (overlay) {
                                            var element = overlay.getIconElement();
                                            element.style.webkitTransform = 'scale(1,1)';
                                        }
                                    }, 50);
                                };
                                overlays.events.add(['add'], fixOverlay);
                                scope.objectManager.objects.events.add(['objectoptionschange'], fixOverlay);
                            }
                            scope.objectManager.objects.events.add(['click'], function (e) {
                                //var target = e.get('target');
                                var evtType = e.get('type');
                                var objectId = e.get('objectId');

                                if (evtType == 'click') {
                                    scope.clearSelectedPoint();

                                    scope.objectManager.objects.setObjectOptions(objectId, angular.extend({}, selectedObjectOptions));

                                    prevObjectId = objectId;

                                    var point = scope.objectManager.objects.getById(objectId);
                                    scope.$emit('placemarkSelected', point);
                                    scope.map.panTo(point.geometry.coordinates);
                                }
                            });
                            scope.map.geoObjects.add(scope.objectManager);
                            scope.objectManagerDeferred.resolve(scope.objectManager);
                            // ---------------------- Использование Object Manager END -------------------------------

                            angular.forEach(scope.placemarkBuffer, function(placemarkConfig) {
                                ctrl.addPlacemark(placemarkConfig);
                            });

                            var lastCity;
                            var onChangeBounds = function(){
                                var newBounds = scope.map.getBounds();
                                var newCenter = scope.map.getCenter();
                                var newZoom = scope.map.getZoom();
                                /*
                                 * По координатам вычисляем населенный пункт, который отображается в центре карты,
                                 * для того чтобы имелась возможность загружать объекты не только для видимой области карты этого населенного пункта
                                 */
                                ymaps.geocode(newCenter, {prefLang : 'ru'}).then(
                                    function(geocoderResult){
                                        var addressDetails = geocoderResult.geoObjects.get(0).properties.get('metaDataProperty').GeocoderMetaData.AddressDetails;
                                        var city;
                                        if (
                                            addressDetails
                                            && addressDetails.Country
                                            && addressDetails.Country.AdministrativeArea
                                            && addressDetails.Country.AdministrativeArea.SubAdministrativeArea
                                            && addressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality
                                        ) {
                                            city = addressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.LocalityName;
                                        }
                                        if (city != lastCity) {
                                            lastCity = city;
                                            scope.onChangeCity({mapBounds: newBounds, zoom: newZoom, city: city});
                                        }
                                    },
                                    function(err){/* Не удалось определить населенный пункт по координатам - не беда! */}
                                );
                                /*
                                 * Т.к. обратное геокодирование занимает время, вызываем метод обработки изменения видимой области сразу,
                                 * после вычисления населенного пункта по координатам, метод будет вызван повторно с передачей наименования населенного пункта
                                 */
                                scope.onChangeBounds({mapBounds: newBounds, zoom: newZoom});
                            };

                            scope.map.events.add('boundschange', function(yevt){
                                onChangeBounds();
                            });
                            onChangeBounds();

                            return scope.map;
                        };

                        /*
                         * Если атрибутами не заданы широта и долгота,
                         * то пытаемся определить местоположение с помощью Яндекс API.
                         */
                        if (scope.mapCenter) {
                            // Если map-center задан, то сразу создаем карту с заданным местоположением
                            createMap();
                        } else {
                            // Пытаемся определить местоположение
                            geo.getPosition().then(function(coords){
                                // Сначала с помощью модуля местоположения на устройстве в течение 5 сек
                                // Возвращаем результат такой же, как от геолокации по данным Яндекса
                                return {geoObjects: {position: coords}};
                            }).catch(function () {
                                // Если на устройстве не получилось, пытаемся выполнить геолокацию по данным Яндекса на основе ip пользователя
                                return ymaps.geolocation.get({provider: 'yandex'});
                            }).then(function (res){
                                scope.mapCenter = res.geoObjects.position;
                                createMap();
                            }).catch(function (err) {
                                var errMsg = 'Ваше устройство и сервис Яндекса не смогли определить Ваши координаты' + (err && err.message ? ': ' + err.message : '');
                                console.warn(errMsg);
                                scope.onError({$error: {code: -2, message: errMsg}});
                            });
                        }

                    });

                }).catch(function(err){
                    var errMsg = (err.status ? err.status : '') + (err.statusText ? (err.status ? ' ' : '') + err.statusText : '');
                    errMsg = 'API Яндекс.Карт не доступен' + (errMsg ? ': ' + errMsg : '');
                    console.warn(errMsg);
                    scope.onError({$error: {code: -1, message: errMsg}});
                });

            },
            template: '<div id="{{id}}" ng-class="[\'rs-map-container\']">' +
                        '<transclude-replace></transclude-replace>' +
                    '</div>'
        };
    }]);
    
    /*
     * Директива yplacemark. Отображение меток на карте ymap.
     */
    module.directive('yplacemark', [function () {
        return {
            require: '^ymap',
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {
                id: '@',
                position: '@',
                icon: '@',
                iconSize: '@',
                iconOffset: '@',
                iconSelected: '@',
                iconSelectedSize: '@',
                iconSelectedOffset: '@'
            },
            controller: ['$scope', function($scope) {
                this.setHint = function(content) {
                    $scope.hint = content;
                };
                this.setBalloon = function(content) {
                    $scope.balloon = content;
                };
            }],
            link: function (scope, element, attrs, ymapCtrl) {
                if (scope.position) {
                    ymapCtrl.addPlacemark({
                        id: scope.id,
                        position: scope.position,
                        showBalloonPanel: false,
                        icon: scope.icon,
                        iconSize: scope.iconSize,
                        iconOffset: scope.iconOffset,
                        iconSelected: scope.iconSelected,
                        iconSelectedSize: scope.iconSelectedSize,
                        iconSelectedOffset: scope.iconSelectedOffset
                    }).then(function(createdPlaceMark){
                        scope.createdPlaceMark = createdPlaceMark;
                    });
                }
                element.on('$destroy', function() {
                    ymapCtrl.removePlacemark(scope.createdPlaceMark);
                });

            },
            template: '<div ng-style="{display: \'none\'}"><transclude-replace /></div>'
        };
    }]);

    /*
     * Директива yplacemark-balloon. Кастомный балун для метки yplacemark на карте ymap.
     */
    module.directive('yplacemarkBalloon', [function () {
        return {
            require: '^yplacemark', 
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {},
            link: function (scope, element, attrs, yplacemarkCtrl) {
                yplacemarkCtrl.setBalloon(element[0].outerHTML);
            },
            template: '<div><transclude-replace /></div>'
        };
    }]);

    /*
     * Директива yplacemark-hint. Кастомная подсказка для метки yplacemark на карте ymap.
     */
    module.directive('yplacemarkHint', [function () {
        return {
            require: '^yplacemark', 
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {},
            link: function (scope, element, attrs, yplacemarkCtrl) {
                yplacemarkCtrl.setHint(element[0].outerHTML);
            },
            template: '<div><transclude-replace /></div>'
        };
    }]);

    /*
     * Директива для отображения Яндекс.Карт в iframe для WP
     */
    module.directive('ymapWp', ['$q', 'geo', function($q, geo) {
        return {
            restrict: 'E',
            scope: {
                mapCenter: '@',
                location: '=',
                points: '=',
                zoom: '@',
                icon: '@',
                iconSize: '@',
                iconOffset: '@',
                onChangeBounds: '&',
                noControls: '@',
                noDrag: '@',
                makeRoute: '&'
            },
            controller: ['$scope', function ($scope) {
                $scope.ymapWpCtrl = this;
                $scope.mapReady = false;
                $scope.placemarkBuffer = [];
                $scope.$on('$destroy', function() {
                    if ($scope.ymaps) {
                        $($scope.ymaps).remove();
                        $scope.ymaps = null;
                    }
                });
                this.addPlacemark = function(params) {
                    if ($scope.mapReady) {
                        $scope.callAPI('addPlacemark', params);
                    } else {
                        $scope.placemarkBuffer.push(params);
                    }
                };
                this.removePlacemark = function (id) {
                    if ($scope.ymaps) {
                        $scope.callAPI('removePlacemark', { id: id });
                    }
                };
                
            }],
            link: function (scope, element, attrs, ctrl) {
                //Создаем вебвью для отображения карты
                scope.ymaps = document.createElement('x-ms-webview');
                scope.ymaps.style.width = "100%";
                scope.ymaps.style.height = "100%";
                scope.ymaps.src = 'ms-appx-web:///www/templates/windows/map.html';
                element.append(scope.ymaps);
                var createMap = function() {
                    scope.callAPI('createMap', {
                        mapCenter: scope.mapCenter,
                        zoom: scope.zoom,
                        icon: scope.icon,
                        iconSize: scope.iconSize,
                        iconOffset: scope.iconOffset,
                        noControls: attrs.hasOwnProperty('noControls'),
                        noDrag: attrs.hasOwnProperty('noDrag')
                    }).then(function() {
                        $('#rs-map-waiter').remove();
                        scope.mapReady = true;
                        angular.forEach(scope.placemarkBuffer, function(params) {
                            ctrl.addPlacemark(params);
                        });
                    });
                };
                //Отлов сообщений из  вебвью
                scope.ymaps.addEventListener("MSWebViewScriptNotify", function (msg) {
                    msg = JSON.parse(msg.value);
                    switch (msg.event) {
                        case 'ymaps_ready':
                            //Инициализируем карты с нашими параметрами
                            if (!scope.mapCenter) {
                                scope.location.then(function(value) {
                                    scope.mapCenter = value;
                                    createMap();
                                }, function() {
                                    createMap();
                                });
                            } else {
                                createMap();
                            }
                            break;
                        case 'onChangeBounds':
                            scope.onChangeBounds(msg);
                            break;
                        case 'makeRoute':
                            scope.makeRoute({ position: msg.position });
                            break;
                        case 'placemarkSelected':
                            var selectedPoint = scope.points.filter(function(point) {
                                return point.id == msg.id;
                            });
                            scope.selectedPointId = msg.id;
                            scope.$emit('placemarkSelected', selectedPoint[0]);
                            break;
                        case 'getCurrentPosition':
                            geo.getPosition(msg).then(function(position) {
                                scope.callAPI('setCurrentPosition', {
                                    id: msg.id,
                                    result: 'success',
                                    position: position
                                });
                            }, function(error) {
                                scope.callAPI('setCurrentPosition', {
                                    id: msg.id,
                                    result: 'error',
                                    error: error
                                });
                            });
                            break;
                    }
                });
                //Отправка сообщений в вебвью
                scope.callAPI = function (method, params) {
                    var deferred = $q.defer();
                    if (!params || !angular.isObject(params)) {
                        params = {};
                    }
                    params.methodName = method;
                    var op = scope.ymaps.invokeScriptAsync('callAPI', JSON.stringify(params));
                    op.oncomplete = function () {
                        deferred.resolve();
                    };
                    op.onerror = function (err) {
                        console.log(err);
                        deferred.reject(err);
                    };
                    op.start();
                    return deferred.promise;
                };
            }
        };
    }]);
    /*
     * Директива yplacemark для WP
     */
    module.directive('yplacemarkWp', [function () {
        return {
            require: '^ymapWp',
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {
                id: '@',
                position: '@',
                icon: '@',
                iconSize: '@',
                iconOffset: '@',
                iconSelected: '@',
                iconSelectedSize: '@',
                iconSelectedOffset: '@'
            },
            controller: ['$scope', function ($scope) {
                this.setHint = function (content) {
                    $scope.hint = content;
                };
                this.setBalloon = function (content) {
                    $scope.balloon = content;
                };
            }],
            link: function (scope, element, attrs, ymapWpCtrl) {
                if (scope.position) {
                    ymapWpCtrl.addPlacemark({
                        id: scope.id,
                        position: scope.position,
                        icon: scope.icon,
                        iconSize: scope.iconSize,
                        iconOffset: scope.iconOffset,
                        iconSelected: scope.iconSelected,
                        iconSelectedSize: scope.iconSelectedSize,
                        iconSelectedOffset: scope.iconSelectedOffset
                    });
                }
                scope.$on('$destroy', function () {
                    ymapWpCtrl.removePlacemark(scope.id);
                });
            },
            template: '<div ng-style="{display: \'none\'}"><transclude-replace /></div>'
        };
    }]);

    /*
     * Директива dialog для диалоговых окон.
     */
    module.directive('dialog', function() {
        return {
            restrict: 'A',
            scope: {
                show: '='
            },
            replace: true,
            transclude: true,
            link: function($scope, element, attrs) {
                $scope.dialogStyle = {};
                if (attrs.width)
                    $scope.dialogStyle.width = attrs.width;
                if (attrs.height)
                    $scope.dialogStyle.height = attrs.height;
                $scope.hideModal = function() {
                    $scope.show = false;
                };
            },
            template: "<div class='ng-modal' ng-show='show'>"
                          + "<div class='ng-modal-overlay' ng-click='hideModal()'></div>"
                          + "<div class='ng-modal-dialog' ng-style='dialogStyle'>"
                              + "<div class='ng-modal-close' ng-click='hideModal()'>X</div>"
                              + "<div class='ng-modal-dialog-content' ng-transclude></div>"
                          + "</div>"
                      + "</div>"
       };
    });

    module.directive('customHtml', [function () {
        return {
            restrict: 'EA',
            replace: true,
            transclude: false,
            scope: {
                data: '='
            },
            link: function (scope, element) {
                element.html(scope.data);
            },
            template: '<div></div>'
        };
    }]);

    module.directive('winjsMenu', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            scope: {
                winjsMenu: '='
            },
            link: function (scope, element) {
                $timeout(function () {
                    Dom7(element[0]).on('taphold', function(){
                        angular.isObject(scope.winjsMenu) && scope.winjsMenu.show(this, 'autovertical');
                    });
                });
            }
        };
    }]);

    /* Обработка нажатия Enter */
    module.directive('rsEnter', ['$window', function($window) {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if(event.which === 13) {
                    scope.$apply(function(){
                        if ($window.Keyboard) {
                            $window.Keyboard.hide();
                        }
                        setTimeout(function() {
                            scope.$eval(attrs.rsEnter, {'event': event});
                        }, 150);
                    });
                    event.preventDefault();
                }
            });
        };
    }]);

    /* Открытие панели по тапу */
    module.directive('openPanel', ['$rootScope', function($rootScope) {
        return function(scope, element, attrs) {
            element.on('click', function() {
                $rootScope.openPanel();
            });
        };
    }]);

}());