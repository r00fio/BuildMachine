/*
 * Яндекс.Карты для WP
 */
(function () {
    window.callAPI = function(params) {
        params = JSON.parse(params);
        ymapsAPI[params.methodName](params);
    };
    
    var positionRequests = [];
    var positionRequestId = 0;

    if (window.navigator) {
        window.navigator.geolocation = {};
        window.navigator.geolocation.getCurrentPosition = function (success, error, options) {
            options.id = positionRequestId++;
            positionRequests.push({
                id: options.id,
                success: success,
                error: error
            });
            options.event = 'getCurrentPosition';
            window.external.notify(JSON.stringify(options));
        };
    }
   
    var toArrayIfString = function (obj) {
        if (typeof obj == 'string') {
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

    var map = null;

    var createMap = function(params) {
        if (params.mapCenter) {
            params.mapCenter = toArrayIfString(params.mapCenter);
        }
        if (params.iconSize) {
            params.iconSize = toArrayIfString(params.iconSize);
        }
        if (params.iconOffset) {
            params.iconOffset = toArrayIfString(params.iconOffset);
        }
        var mapCenter = params.mapCenter || params.location || ['55.7517', '37.6178'];
        var zoom = params.zoom || 7;

        /* Создание кастомных кнопок зума */
        var ZoomLayout = ymaps.templateLayoutFactory.createClass(
            '<div><div id="ymap-zoom-in" class="icon-50 icon-zoom-in"></div><div id="ymap-zoom-out" class="icon-50 icon-zoom-out"></div></div>',
            {

                build: function () {
                    ZoomLayout.superclass.build.call(this);

                    this.zoomInCallback = ymaps.util.bind(this.zoomIn, this);
                    this.zoomOutCallback = ymaps.util.bind(this.zoomOut, this);
                    $('#ymap-zoom-in').bind('click', this.zoomInCallback);
                    $('#ymap-zoom-out').bind('click', this.zoomOutCallback);
                },

                clear: function () {
                    $('#ymap-zoom-in').unbind('click', this.zoomInCallback);
                    $('#ymap-zoom-out').unbind('click', this.zoomOutCallback);

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

        /* Создание кастомной кнопки геолокатора */
        var GeolocatorLayout = ymaps.templateLayoutFactory.createClass(
            '<div><div class="icon-50 icon-locate"></div></div>'
        );

        if (!params.noControls) {
            var customZoom = new ymaps.control.ZoomControl({
                options: {
                    layout: ZoomLayout
                }
            });

            var customGeolocator = new ymaps.control.GeolocationControl({
                options: {
                    layout: GeolocatorLayout
                }
            });
        }
        map = new ymaps.Map('ymaps', {
            center: mapCenter,
            zoom: zoom,
            controls: params.noControls ? [] : [customGeolocator, customZoom]
        });

        if (params.noDrag) {
            map.behaviors.disable('drag');
        }

        if (params.icon) {
            var centerPointPlaceMark = new ymaps.Placemark(
                mapCenter, {}, {
                    iconLayout: 'default#image',
                    iconImageHref: params.icon,
                    iconImageSize: params.iconSize,
                    iconImageOffset: params.iconOffset
                }
            );
            map.geoObjects.add(centerPointPlaceMark);
            centerPointPlaceMark.getOverlay().done(function (overlay) {
                var element = overlay.getIconElement();
                element.className = element.className + ' rs-geolocation-icon';

            });
        }

        var onChangeBounds = function (newBounds, newCenter) {
            /*
             * По координатам вычисляем населенный пункт, который отображается в центре карты,
             * для того чтобы имелась возможность загружать объекты не только для видимой области карты этого населенного пункта
             */

            ymaps.geocode(newCenter, { prefLang: 'ru' }).then(
                function (geocoderResult) {
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
                    if (city) {
                        // Если населенный пункт определить удалось, снова вызовем метод, и передадим наименование пункта
                        ymapsAPI.onChangeBounds({ mapBounds: newBounds, zoom: map.getZoom(), city: city });
                    }
                },
                function (err) {/* Не удалось определить населенный пункт по координатам - не беда! */ }
            );
            /*
             * Т.к. обратное геокодирование занимает время, вызываем метод обработки изменения видимой области сразу,
             * после вычисления населенного пункта по координатам, метод будет вызван повторно с передачей наименования населенного пункта
             */
            ymapsAPI.onChangeBounds({ mapBounds: newBounds, zoom: map.getZoom() });
        };

        map.events.add('boundschange', function (yevt) {
            onChangeBounds(yevt.originalEvent.newBounds, yevt.originalEvent.newCenter);
        });
        onChangeBounds(map.getBounds(), map.getCenter());

    };

    var addPlacemark = function(params) {
        params.iconSize = toArrayIfString(params.iconSize);
        params.iconOffset = toArrayIfString(params.iconOffset);
        params.iconSelectedSize = toArrayIfString(params.iconSelectedSize);
        params.iconSelectedOffset = toArrayIfString(params.iconSelectedOffset);
        params.position = toArrayIfString(params.position);
        params.iconSelected = '/www/' + params.iconSelected;
        params.icon = '/www/' + params.icon;
        var placemark = new ymaps.Placemark(
            params.position, {}, {
                id: params.id,
                iconLayout: params.icon ? 'default#image' : undefined,
                iconImageHref: params.icon || undefined,
                iconImageSize: params.iconSize || undefined,
                iconImageOffset: params.iconOffset || undefined
            }
        );

        

        placemark.placemarkConfig = params;
        placemark.events.add(['click'], function (e) {
            var target = e.get('target');
            var evtType = e.get('type');
            if (evtType == 'click') {
                var result = ymaps.geoQuery(map.geoObjects);
                result.each(function(pm) {
                    pm.options.set('iconImageHref', pm.placemarkConfig.icon || undefined);
                    pm.options.set('iconImageSize', pm.placemarkConfig.iconSize || undefined);
                    pm.options.set('iconImageOffset', pm.placemarkConfig.iconOffset || undefined);
                });
                var placemarkConfig = target.placemarkConfig;
                target.options.set('iconImageHref', placemarkConfig.iconSelected || placemarkConfig.icon || undefined);
                target.options.set('iconImageSize', (placemarkConfig.iconSelected ? placemarkConfig.iconSelectedSize : placemarkConfig.iconSize) || undefined);
                target.options.set('iconImageOffset', (placemarkConfig.iconSelected ? placemarkConfig.iconSelectedOffset : placemarkConfig.iconOffset) || undefined);
                placemarkSelected(placemarkConfig.id);
            }
        });
        map.geoObjects.add(placemark);
        placemark.getOverlay().done(function (overlay) {
            var element = overlay.getIconElement();
            element.className = element.className + ' rs-geolocation-icon';
           
        });
    };

    var removePlacemark = function (params) {
        var result = ymaps.geoQuery(map.geoObjects);
        result = result.search('options.id == "' + params.id + '"');
        result.each(function(pm) {
            map.geoObjects.remove(pm);
        });
        
    };

    //Успешная загрузка карт
    if (ymaps) {
        ymaps.ready(function() {
            window.external.notify(JSON.stringify({ event: 'ymaps_ready' }));
        });
    }

    //Клик по метке
    var placemarkSelected = function(id) {
        var params = {
            event: 'placemarkSelected',
            id: id
        };
        window.external.notify(JSON.stringify(params));
    };

    //Прокладка маршрута до точки
    var makeRoute = function(params) {
        params.event = 'makeRoute';
        window.external.notify(JSON.stringify(params));
    }

    //Событие при перетаскивании карты
    var onChangeBounds = function(params) {
        params.event = 'onChangeBounds';
        window.external.notify(JSON.stringify(params));
    }

    var setCurrentPosition = function(msg) {
        var request = positionRequests.filter(function(req) {
            return req.id == msg.id;
        })[0];
        if (request) {
            if (msg.result == 'success') {
                request.success(msg.position);
            } else {
                request.error(msg.error);
            }
        }
    }

    window.ymapsAPI = {
        createMap: createMap,
        addPlacemark: addPlacemark,
        removePlacemark: removePlacemark,
        makeRoute: makeRoute,
        onChangeBounds: onChangeBounds,
        setCurrentPosition: setCurrentPosition
    };

})(window);