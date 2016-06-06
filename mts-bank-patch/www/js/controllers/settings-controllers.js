/**
 * Настройки
 */
var module = angular.module('app');

module.controller('SettingsCtrl', ['$scope', '$ionicActionSheet', '$rootScope', 'WebWorker',
function ($scope, $ionicActionSheet, $rootScope, WebWorker) {

    $scope.user = {};

    /* Показать ActionSheet при клике на элемент "Загрузить аватар" (для ios) */
    $scope.showLoadAvatar = function() {

        $ionicActionSheet.show({
            buttons: [
                { text: 'Выбрать фото' },
                { text: 'Сделать фото' },
                { text: 'Удалить фото' }
            ],
            buttonClicked: function(index) {
                switch (index) {
                    case 0:
                        if (navigator && navigator.camera) {
                            navigator.camera.getPicture(
                                function (imageData) {
                                    $rootScope.retailClient.foto = imageData;
                                    WebWorker.postMessage('changePhoto', 'changePhoto', [imageData]);
                                    $rootScope.$applyAsync();
                                },
                                function (message) {
                                    console.log('Failed because: ' + message);
                                },
                                {
                                    destinationType: Camera.DestinationType.DATA_URL, // Return image as base64-encoded string
                                    sourceType: Camera.PictureSourceType.PHOTOLIBRARY, // Выбор из фотоальбома
                                    allowEdit: true // Редактирование перед выбором
                                });
                        }
                        return true;
                    case 1:
                        if (navigator && navigator.camera) {
                            navigator.camera.getPicture(
                                function (imageData) {
                                    $rootScope.retailClient.foto = imageData;
                                    WebWorker.postMessage('changePhoto', 'changePhoto', [imageData]);
                                    $rootScope.$applyAsync();
                                },
                                function (message) {
                                    console.log('Failed because: ' + message);
                                },
                                {
                                    destinationType: Camera.DestinationType.DATA_URL, // Return image as base64-encoded string
                                    sourceType: Camera.PictureSourceType.CAMERA, // Сделать фото
                                    allowEdit: true // Редактирование перед выбором
                                });
                        }
                        return true;
                    case 2:
                        $rootScope.retailClient.foto = null;
                        WebWorker.postMessage('changePhoto', 'changePhoto', null);
                        $rootScope.$applyAsync();
                        return true;
                }
            },
            cancelText: 'Отменить'
        });
    };

    var countBg = 7; // 7 вариантов фона

    $scope.backgrounds = [];
    for (var i = 0; i < countBg; i++) {
        if (i == $rootScope.background) {
            $scope.backgrounds.push({selected: true});
        } else {
            $scope.backgrounds.push({selected: false});
        }
    }

    $scope.selectBg = function(idbg) {

        $('.appmenu-bg').removeClass('bg-app-' + $rootScope.background);
        $rootScope.background = idbg;
        $rootScope.prefetchBackground();
        $('.appmenu-bg').addClass('bg-app-' + $rootScope.background);

        if (window.plugins && window.plugins.appPreferences) {
            var prefs = window.plugins.appPreferences;
            prefs.store (
                function() {},
                function(error) { console.log(error); },
                'background',
                idbg
            );
        }

        for (var i = 0; i < countBg; i++) {
            if (i == idbg) {
                $scope.backgrounds[i].selected = true;
            } else {
                $scope.backgrounds[i].selected = false;
            }
        }

        $rootScope.$applyAsync();

    };

    function processingResults(data) {
        switch (data.cmdInfo) {
            case 'getUserSettings':
                $scope.user.login = data.result.data.login;
                $scope.user.useOTPLoginAction = data.result.data.useOTPLoginAction;
                $scope.user.showBlockedProducts = data.result.data.showBlockedProducts;
                break;
        }
        $scope.$apply();
    }
    WebWorker.setFunction(processingResults);
    WebWorker.postMessage('getUserSettings', 'getUserSettings');
}]);

module.controller('SettingsPersonalDataCtrl', ['$scope', '$rootScope', '$state', 'WebWorker', '$ionicModal', 'sys', 'geo',
function ($scope, $rootScope, $state, WebWorker, $ionicModal, sys, geo) {
    $scope.docTypeList = [{'strId': 'driver', 'desc': 'Водительское удостоверение'}, {'strId': 'transport', 'desc': 'Транспортное средство'}];
    $scope.fieldValue = {};
    var actionStrId = 'RetailConfirmPersonalData';
    var args = [];

    function processingResults(data) {
            switch (data.cmdInfo) {
                case 'changeFieldValue':
                case 'changeMobileTelephone':
                case 'changeEmail':

                    // <для подтверждения одноразовым паролем>
                    if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                        $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm', $scope.fieldValue.value);
                        return;
                    } else if (data.result.data == 'true') {
                        $scope.showButton = false;
                        $scope.confirmationHide();

                        // Действия после успешной отправки.
                        $scope.retailClient[$scope.fieldValue.name] = $scope.fieldValue.value;
                        $scope.fieldValue = {};
                        $scope.goBack();
                    } else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                        $scope.confirmationFalse(data.result.data);
                    } else {
                        $scope.confirmationHide();
                        $scope.showButton = true;
                        alert(data.result.data);
                    }
                    // </для подтверждения одноразовым паролем>
                    break;
                case 'createDriverDoc':
                    if (!angular.isObject(data.result.data)) {
                        alert(data.result.data);
                        return;
                    }
                    $scope.retailClient.driverDocList.push(data.result.data);
                    $scope.goBack();
                    break;
                case 'changeDriverDoc':
                    if (data.result.data != 'true') {
                        alert(data.result.data);
                        return;
                    }
                    for (var i = 0; i < $scope.retailClient.driverDocList.length; i++) {
                        if ($scope.retailClient.driverDoc.uuid === $scope.retailClient.driverDocList[i].uuid) {
                            $scope.retailClient.driverDocList[i] = $scope.retailClient.driverDoc;
                            delete($scope.retailClient.driverDoc);
                            break;
                        }
                    }
                    $scope.goBack();
                    break;
                case 'deleteDriverDoc':
                    if (data.result.data != 'true') {
                        alert(data.result.data);
                        return;
                    }
                    for (var i = 0; i < $scope.retailClient.driverDocList.length; i++) {
                        if ($scope.retailClient.driverDoc.uuid === $scope.retailClient.driverDocList[i].uuid) {
                            delete($scope.retailClient.driverDoc);
                            $scope.retailClient.driverDocList.splice(i, 1);
                            break;
                        }
                    }
                    $scope.goBack();
                    break;
                case 'createTransportPass':
                    if (!angular.isObject(data.result.data)) {
                        alert(data.result.data);
                        return;
                    }
                    $scope.retailClient.transportPassList.push(data.result.data);
                    $scope.goBack();
                    break;
                case 'changeTransportPass':
                    if (data.result.data != 'true') {
                        alert(data.result.data);
                        return;
                    }
                    for (var i = 0; i < $scope.retailClient.transportPassList.length; i++) {
                        if ($scope.retailClient.transportPass.uuid === $scope.retailClient.transportPassList[i].uuid) {
                            $scope.retailClient.transportPassList[i] = $scope.retailClient.transportPass;
                            delete($scope.retailClient.transportPass);
                        }
                    }
                    $scope.goBack();
                    break;
                case 'deleteTransportPass':
                    if (data.result.data != 'true') {
                        alert(data.result.data);
                        return;
                    }
                    for (var i = 0; i < $scope.retailClient.transportPassList.length; i++) {
                        if ($scope.retailClient.transportPass.uuid === $scope.retailClient.transportPassList[i].uuid) {
                            delete($scope.retailClient.transportPass);
                            $scope.retailClient.transportPassList.splice(i, 1);
                            break;
                        }
                    }
                    $scope.goBack();
                    break;
            }
            $scope.$apply();
    }
    WebWorker.setFunction(processingResults);

    /* Получение ближайшего офиса по местоположению клиента требуется при каждом переходе в состояние,
     * в том числе и из дочерних состояний (когда этот контроллер не отрабатывает)
     */
    var thisStateName = $state.current.name;
    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        if (toState.name === thisStateName) {
            delete $scope.nearestOffice;
            $scope.$applyAsync();

            geo.getPosition().then(function(coords){
                WebWorker.invoke('getNearestOffice', coords[0] + ',' + coords[1]).then(function(result){
                    if (angular.isObject(result.data)) {
                        var officePosition = [result.data.geometry.coordinates[0], result.data.geometry.coordinates[1]];

                        $scope.nearestOffice = {
                            position: officePosition,
                            id: result.data.id,
                            properties: result.data.properties,
                            distance: geo.formatDistanceKm(geo.getHaversineDistance(coords, officePosition)),
                            title: 'Ближайший офис'
                        };
                    } else {
                        $scope.nearestOffice = null;
                    }
                });
            }).catch(function(){
                $scope.nearestOffice = null;
            });
        }
    });

    $scope.goToNearestOfficeDetails = function() {
        if (angular.isObject($scope.nearestOffice)) {
            $scope.goToState('settings.personal.nearestOffice', {point: $scope.nearestOffice});
        }
    };

    /* При отмене изменения любого из полей удалим созданные для редактирования поля */
    $scope.goBackFromField = function() {
        $scope.fieldValue = {};
        delete($scope.retailClient.docTypeCreate);
        delete($scope.retailClient.docCreate);
        delete($scope.retailClient.driverDoc);
        delete($scope.retailClient.transportPass);
        $scope.goBack();
    };

    $scope.changeFieldValue = function() {
        args = [actionStrId, JSON.stringify($scope.fieldValue)];
        WebWorker.postMessage('changeFieldValue', 'changeFieldValue', args);
    };

    $scope.changeMobileTelephone = function() {
        if (!$scope.fieldValue.value || $scope.fieldValue.value == '') {
            alert('Заполните мобильный телефон');
            return;
        }
        args = ['RetailConfirmChangeMobileNumber', JSON.stringify($scope.fieldValue)];
        WebWorker.postMessage('changeMobileTelephone', 'changeMobileTelephone', args);
    };

    $scope.getPhoneNumber = function(phoneNumber) {
        if (phoneNumber && typeof(phoneNumber) == 'string')
            return phoneNumber.replace(/^\+7/, '');
        return '';
    };

    $scope.changeEmail = function() {
        if ($scope.fieldValue.value && $scope.fieldValue.value != '')
        {
            var emailRe = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}$/i;
            if (!emailRe.test($scope.fieldValue.value)) {
                alert('E-mail должен содеражть \'@\' и \'.\'');
                return;
            }
        }
        args = [actionStrId, JSON.stringify($scope.fieldValue)];
        WebWorker.postMessage('changeFieldValue', 'changeFieldValue', args);
    };

    $scope.createDriverOrTransport = function() {

        // Создание ВУ
        if ($scope.retailClient.docTypeCreate.strId == 'driver') {
            if (!$scope.retailClient.docCreate.series) {
                alert('Заполните серию документа');
                return;
            }
            if (!$scope.retailClient.docCreate.number) {
                alert('Заполните номер документа');
                return;
            }
            if (!$scope.retailClient.docCreate.deliveryDate) {
                alert('Заполните дату выдачи документа');
                return;
            }
            if ($scope.retailClient.docCreate.deliveryDate.getFullYear() < 1901) {
                alert('Дата выдачи не может быть меньше 01.01.1901');
                return;
            }
            var driverDoc = {};
            driverDoc.series = $scope.retailClient.docCreate.series.toString();
            driverDoc.number = $scope.retailClient.docCreate.number.toString();
            driverDoc.deliveryDate = $scope.retailClient.docCreate.deliveryDate.format('dd.mm.yyyy');
            WebWorker.postMessage('createDriverDoc', 'createDriverDoc', [JSON.stringify(driverDoc)]);
        }

        // Создание ТС
        if ($scope.retailClient.docTypeCreate.strId == 'transport') {
            if (!$scope.retailClient.docCreate.stateNumber) {
                alert('Заполните гос. номер');
                return;
            }
            if (!$scope.retailClient.docCreate.docNumber) {
                alert('Заполните номер свидетельства');
                return;
            }
            var transportPass = {};
            transportPass.stateNumber = $scope.retailClient.docCreate.stateNumber;
            transportPass.docNumber = $scope.retailClient.docCreate.docNumber;
            WebWorker.postMessage('createTransportPass', 'createTransportPass', [JSON.stringify(transportPass)]);
        }
        delete($scope.retailClient.docTypeCreate);
        delete($scope.retailClient.docCreate);
    };

    /* При переходе в редактирование скопируем выбранный ВУ, иначе связывание сразу изменяет поля без сохранений */
    var parseDate = function(dateString) {
        if (!dateString) {
            return null;
        }
        var year, month, day;
        if (dateString.length == 10) {
            year = dateString.substring(6, 10);
            month = dateString.substring(3, 5) - 1;
            day = dateString.substring(0, 2);
        } else {
            year = dateString.substring(0, 4);
            month = dateString.substring(5, 7) - 1;
            day = dateString.substring(8, 10);
        }
        return new Date(year, month, day);
    };
    $scope.selectDriverDoc = function() {
        var driverDoc = angular.copy(this.driverDoc);
        driverDoc.series = parseInt(driverDoc.series);
        driverDoc.number = parseInt(driverDoc.number);
        if (!angular.isDate(driverDoc.deliveryDate)) {
            driverDoc.deliveryDate = parseDate(driverDoc.deliveryDate);
        }
        $scope.retailClient.driverDoc = driverDoc;
    };

    $scope.changeDriverDoc = function() {
        if (!$scope.retailClient.driverDoc.series) {
            alert('Заполните серию документа');
            return;
        }
        if (!$scope.retailClient.driverDoc.number) {
            alert('Заполните номер документа');
            return;
        }
        if (!$scope.retailClient.driverDoc.deliveryDate) {
            alert('Заполните дату выдачи документа');
            return;
        }
        if ($scope.retailClient.driverDoc.deliveryDate.getFullYear() < 1901) {
            alert('Дата выдачи не может быть меньше 01.01.1901');
            return;
        }
        var driverDoc = {};
        driverDoc.uuid = $scope.retailClient.driverDoc.uuid;
        driverDoc.series = $scope.retailClient.driverDoc.series.toString();
        driverDoc.number = $scope.retailClient.driverDoc.number.toString();
        driverDoc.deliveryDate = $scope.retailClient.driverDoc.deliveryDate.format('dd.mm.yyyy');
        WebWorker.postMessage('changeDriverDoc', 'changeDriverDoc', [JSON.stringify(driverDoc)]);
    };

    $scope.deleteDriverDoc = function() {
        WebWorker.postMessage('deleteDriverDoc', 'deleteDriverDoc', [$scope.retailClient.driverDoc.uuid]);
    };

    /* При переходе в редактирование скопируем выбранный ТС, иначе связывание сразу изменяет поля без сохранений */
    $scope.selectTransportPass = function() {
        $scope.retailClient.transportPass = angular.copy(this.transportPass);
    };

    $scope.changeTransportPass = function() {
        if (!$scope.retailClient.transportPass.stateNumber) {
            alert('Заполните гос. номер');
            return;
        }
        if (!$scope.retailClient.transportPass.docNumber) {
            alert('Заполните номер свидетельства');
            return;
        }
        var transportPass = {};
        transportPass.uuid = $scope.retailClient.transportPass.uuid;
        transportPass.stateNumber = $scope.retailClient.transportPass.stateNumber;
        transportPass.docNumber = $scope.retailClient.transportPass.docNumber;
        WebWorker.postMessage('changeTransportPass', 'changeTransportPass', [JSON.stringify(transportPass)]);
    };

    $scope.deleteTransportPass = function() {
        WebWorker.postMessage('deleteTransportPass', 'deleteTransportPass', [$scope.retailClient.transportPass.uuid]);
    };

    // <выбор из списка в отдельном окне>
    $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/select.html', function($ionicModal) {
        $scope.select = $ionicModal;
    }, {
        scope: $scope
    });

    $scope.$on('$destroy', function() {
        if ($scope.select) {
         $scope.select.remove();
        }
    });

    $scope.selectShow = function(listForSelect, resultId, headerText, fieldId) {
        if (!$scope.readOnly) {
            $scope.listForSelect = listForSelect;
            $scope.resultId = resultId;
            $scope.headerText = headerText;
            $scope.fieldId = fieldId;
            $scope.select.show();
        }
    };

    $scope.selectHide = function() {
        $scope.select.hide();
    };

    $scope.clickItem = function(item) {
        $scope.select.hide();
        if ($scope.resultId == 'docTypeCreate') {
            $scope.retailClient[$scope.resultId] = item;
        }
    };

    // </выбор из списка в отдельном окне>

}]);

module.controller('SettingsAddressCtrl', ['$scope', '$rootScope', '$ionicModal', 'sys', 'WebWorker',
function ($scope, $rootScope, $ionicModal, sys, WebWorker) {
    $scope.addressRequest = {};
    $scope.selectedAddress = $scope.retailClient.factAddress;
    $scope.searchText = {};
    var response;
    var timeoutId;
    var nextRequestId = 0;
    var actualRequestId;
    var COOLDOWN_TIME = 0;
    var FILLINDEX_NOTCOMP_ADD = true;
    $scope.statusOk = false;

    var actionStrId = 'RetailConfirmPersonalData';
    var args = [];

    function processingResults(data) {
            switch (data.cmdInfo) {
                case 'getAddressElementListByKLADR':
                    response = data.result.data;

                    // если номер(ид) запроса ниже границы актуальности, то ответ уже не актуален - игнорируем
                    if (parseInt(response.requestid) < actualRequestId) {
                        return;
                    }
                    if (response.type === 'fillindex') {
                        if (response.data.length > 0) {
                            $scope.addressList = response.data;
                            $scope.selectedAddress.index = $scope.addressList[0].index;
                            $scope.selectedAddress.region = $scope.addressList[0].region;
                            $scope.selectedAddress.area = $scope.addressList[0].area;
                            $scope.selectedAddress.city = $scope.addressList[0].city;
                            $scope.selectedAddress.locality = $scope.addressList[0].locality;
                            $scope.selectedAddress.street = $scope.addressList[0].street;
                        }
                    } else if (response.type === 'check' && response.addresscode === 'OK') {
                        $scope.selectedAddress.index = response.data[0].index;
                        $scope.statusOk = true;
                    } else {
                        $scope.addressList = response.data;
                    }
                    break;
                case 'changeFactAddress':

                    // <для подтверждения одноразовым паролем>
                    if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                        $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm');
                        return;
                    } else if (data.result.data == 'true') {
                        $scope.confirmationHide();
                        $scope.goBack();
                    } else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                        $scope.confirmationFalse(data.result.data);
                    } else {
                        $scope.confirmationHide();
                        alert(data.result.data);
                    }
                    // </для подтверждения одноразовым паролем>
                    break;
            }
            $scope.$apply();
    }
    WebWorker.setFunction(processingResults);

    var requestAddress = function() {
        $scope.addressRequest.requestId = nextRequestId++;
        WebWorker.postMessage('getAddressElementListByKLADR', 'getAddressElementListByKLADR', [JSON.stringify($scope.addressRequest)]);
    };

    var clearLowerLevels = function(type) {
        switch(type) {
            case 'region':
                delete($scope.addressRequest.area);
                delete($scope.addressRequest.city);
                delete($scope.addressRequest.locality);
                delete($scope.addressRequest.street);
                break;
            case 'area':
                delete($scope.addressRequest.city);
                delete($scope.addressRequest.locality);
                delete($scope.addressRequest.street);
                break;
            case 'city':
                delete($scope.addressRequest.locality);
                delete($scope.addressRequest.street);
                break;
            case 'locality':
                delete($scope.addressRequest.street);
                break;
        }
    };

    $scope.onSuggestionFocusLost = function() {
        //прерываем "простой" - отмена запроса
        clearTimeout(timeoutId);

        if ($scope.selectedAddress.house != '' || $scope.selectedAddress.struct != '') {
            $scope.addressRequest.type = 'check';
            $scope.addressRequest.house = $scope.selectedAddress.house;
            $scope.addressRequest.struct = $scope.selectedAddress.struct;
            requestAddress();
        } else if (FILLINDEX_NOTCOMP_ADD) {//... иначе - (если включена настройка) подчитывать индекс
            $scope.addressRequest.type = 'fillindex';
            requestAddress();
        }
    };

    var autoCompleteFn = function(newValue, oldValue, minChars) {
        $scope.statusOk = false;
        //прерываем "простой" - отмена запроса
        clearTimeout(timeoutId);

        clearLowerLevels($scope.addressRequest.type);

        // Render check to only autocomplete after minimum number of characters are entered..
        if (newValue < minChars) {
            $scope.addressList = null;
            return;
        }

        // пред. запросы не актуальные, если BACKSPACE
        if (oldValue && oldValue.length > newValue.length) {
            actualRequestId = nextRequestId;
        }

        $scope.addressRequest[$scope.addressRequest.type] = newValue;
        timeoutId = setTimeout(requestAddress, COOLDOWN_TIME);
    };

    $scope.$watch('searchText.name', function(newValue, oldValue) {
        if (newValue != oldValue) {
            autoCompleteFn(newValue, oldValue, 3);
        }
    });

    $scope.$watch('selectedAddress.index', function(newValue, oldValue) {
        if (newValue != oldValue) {
            autoCompleteFn(newValue, oldValue, 6);
        }
    });

    $scope.onCheckInputFocusLost = function() {
        $scope.statusOk = false;

        //если поля в блоке дом не пустые - то нужно проверять адрес
        if ($scope.selectedAddress.house != '' || $scope.selectedAddress.struct != '') {
            $scope.addressRequest.type = 'check';
            $scope.addressRequest.house = $scope.selectedAddress.house;
            $scope.addressRequest.struct = $scope.selectedAddress.struct;
            requestAddress();
        } else if (FILLINDEX_NOTCOMP_ADD){//... иначе - (если включена настройка) подчитывать индекс
            $scope.addressRequest.type = 'fillindex';
            requestAddress();
        }
    };

    // проверка минимальной заполненности адреса (регион + любое поле) при которой можно вводить дом (и включается подчитка индекса)
    $scope.needDisableHouseBlock = function() {
        return !($scope.selectedAddress.region && ($scope.selectedAddress.area || $scope.selectedAddress.city
        || $scope.selectedAddress.locality || $scope.selectedAddress.street));
    };

    $scope.selectRegion = function(region) {
        $scope.addressRequest.region = region.region;
        $scope.selectedAddress = region;
        $scope.onSuggestionFocusLost();
        $scope.goBack();
    };

    $scope.deleteRegion = function() {
        $scope.selectedAddress = {};
        $scope.goBack();
    };

    $scope.selectArea = function(area) {
        $scope.addressRequest.area = area.area;
        $scope.addressRequest.region = area.region;
        $scope.selectedAddress = area;
        $scope.onSuggestionFocusLost();
        $scope.goBack();
    };

    $scope.deleteArea = function() {
        delete($scope.selectedAddress.area);
        $scope.goBack();
    };

    $scope.selectCity = function(city) {
        $scope.addressRequest.city = city.city;
        $scope.addressRequest.area = city.area;
        $scope.addressRequest.region = city.region;
        $scope.selectedAddress = city;
        $scope.onSuggestionFocusLost();
        $scope.goBack();
    };

    $scope.deleteCity = function() {
        delete($scope.selectedAddress.city);
        $scope.goBack();
    };

    $scope.selectLocality = function(locality) {
        $scope.addressRequest.locality = locality.locality;
        $scope.addressRequest.city = locality.city;
        $scope.addressRequest.area = locality.area;
        $scope.addressRequest.region = locality.region;
        $scope.selectedAddress = locality;
        $scope.onSuggestionFocusLost();
        $scope.goBack();
    };

    $scope.deleteLocality = function() {
        delete($scope.selectedAddress.locality);
        $scope.goBack();
    };

    $scope.selectStreet = function(street) {
        $scope.addressRequest.street = street.street;
        $scope.addressRequest.locality = street.locality;
        $scope.addressRequest.city = street.city;
        $scope.addressRequest.area = street.area;
        $scope.addressRequest.region = street.region;
        $scope.selectedAddress = street;
        $scope.onSuggestionFocusLost();
        $scope.goBack();
    };

    $scope.deleteStreet = function() {
        delete($scope.selectedAddress.street);
        $scope.goBack();
    };

    $scope.changeAddress = function() {
        if ($scope.statusOk) {
            args = [actionStrId, JSON.stringify($scope.selectedAddress)];
            WebWorker.postMessage('changeFactAddress', 'changeFactAddress', args);
            $scope.retailClient.factAddress = $scope.selectedAddress;
            $scope.goBack();
        }
    };
}]);

module.controller('SettingsPaymentsDataCtrl', ['$scope', '$rootScope', 'settingsSrv', 'WebWorker',
function ($scope, $rootScope, settingsSrv, WebWorker) {
    var goBackCount = 1;
    var parseDate = function(dateString) {
        dateString = dateString.replace(/\./g, "");
        var day = dateString.substring(0, 2);
        var month = dateString.substring(2, 4) - 1;
        var year = dateString.substring(4, 8);
        return new Date(year, month, day);
    };
    for (var i = 0; i < $scope.retailClient.personalAccountList.length; i++) {
        if ($scope.retailClient.personalAccountList[i].type === 'DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL') {
            var driverDocDateString = $scope.retailClient.personalAccountList[i].DRIVER_DOC_DATE_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL;
            $scope.retailClient.personalAccountList[i].driverDocDate = parseDate(driverDocDateString);
        }
    }

    $scope.personalAccountTypeList = settingsSrv.getPersonalAccountTypeList();
    $scope.personalAccountFineType = settingsSrv.getPersonalAccountFineType();

    function processingResults(data) {
            switch (data.cmdInfo) {
                case 'createPersonalAccount':
                    if (data.result.data.type == 'DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL') {
                        data.result.data.driverDocDate = parseDate(data.result.data.DRIVER_DOC_DATE_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL);
                    }
                    $scope.retailClient.personalAccountList.push(data.result.data);
                    $scope.goBack(goBackCount);
                    goBackCount = 1;
                    break;
                case 'changePersonalAccount':
                    for (var i = 0; i < $scope.retailClient.personalAccountList.length; i++) {
                        if ($scope.retailClient.personalAccount.uuid === $scope.retailClient.personalAccountList[i].uuid) {
                            $scope.retailClient.personalAccountList[i] = $scope.retailClient.personalAccount;
                            delete($scope.retailClient.personalAccount);
                            break;
                        }
                    }
                    $scope.goBack();
                    break;
                case 'deletePersonalAccount':
                    for (var i = 0; i < $scope.retailClient.personalAccountList.length; i++) {
                        if ($scope.retailClient.personalAccount.uuid === $scope.retailClient.personalAccountList[i].uuid) {
                            delete($scope.retailClient.personalAccount);
                            $scope.retailClient.personalAccountList.splice(i, 1);
                            break;
                        }
                    }
                    $scope.goBack();
                    break;
            }
            $scope.$apply();
    }
    WebWorker.setFunction(processingResults);

    /* При отмене изменения удалим вспомогательное поле */
    $scope.goBackFromField = function() {
        delete($scope.retailClient.personalAccount);
        $scope.goBack();
    };

    $scope.selectCreatedPersonalAccount = function(personalAccountType) {
        //Увеличиваем глубину возврата, т.к. переходим глубже на один уровень.
        goBackCount++;
        $scope.initPersonalAccountCreation(personalAccountType);
    };

    $scope.initPersonalAccountCreation = function(personalAccountType) {
        $scope.retailClient.personalAccount = {};
        $scope.retailClient.personalAccount.type = personalAccountType.type;
        $scope.retailClient.personalAccount.isCreated = true;   // признак, что счёт создаётся, а не редактируется
    };

    /* При выборе счёта для редактирования в ng-model положим его копию, чтобы работала отмена */
    $scope.selectEditablePersonalAccount = function(personalAccount) {
        $scope.retailClient.personalAccount = angular.copy(personalAccount);
    };

    $scope.createPersonalAccount = function() {
        if (!settingsSrv.validatePersonalAccount($scope.retailClient.personalAccount)) {
            return;
        }
        if ($scope.retailClient.personalAccount.type === 'DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL') {
            var driverDocDate = $scope.retailClient.personalAccount.driverDocDate;
            driverDocDateString = driverDocDate.format('ddmmyyyy');
            $scope.retailClient.personalAccount.DRIVER_DOC_DATE_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL = driverDocDateString;

        }
        WebWorker.postMessage('createPersonalAccount', 'createPersonalAccount', [JSON.stringify($scope.retailClient.personalAccount)]);
    };

    $scope.changePersonalAccount = function() {
        if (!settingsSrv.validatePersonalAccount($scope.retailClient.personalAccount)) {
            return;
        }
        if ($scope.retailClient.personalAccount.type === 'DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL') {
            var driverDocDate = $scope.retailClient.personalAccount.driverDocDate;
            driverDocDateStringg = driverDocDate.format('ddmmyyyy');
            $scope.retailClient.personalAccount.DRIVER_DOC_DATE_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL = driverDocDateString;
        }
        WebWorker.postMessage('invokeRetailClientEntityMethod', 'changePersonalAccount',
            ['changePersonalAccount', JSON.stringify($scope.retailClient.personalAccount)]);
    };

    $scope.deletePersonalAccount = function() {
        WebWorker.postMessage('invokeRetailClientEntityMethod', 'deletePersonalAccount',
            ['deletePersonalAccount', $scope.retailClient.personalAccount.uuid]);
    }
}]);

module.controller('SettingsSecurityDataCtrl', ['$scope', '$rootScope', '$state', '$window', '$timeout', 'settingsSrv', 'persistence', 'WebWorker', 'sys', '$ionicModal', '$ionicLoading',
function ($scope, $rootScope, $state, $window, $timeout, settingsSrv, persistence, WebWorker, sys, $ionicModal, $ionicLoading) {

    var authMode = persistence.get('authMode');

    $scope.user.confirmation = $scope.retailClient.confirmation;
    $scope.user.codeDateHint = $scope.retailClient.codeDateHint;
    $scope.user.idShortCode = persistence.get('idShortCode');
    $scope.user.toggleShortCode = authMode == 'shortCode' || authMode == 'touchID';
    $scope.user.toggleTouchID = authMode == 'touchID';
    $scope.user.noRequestCodeFor3Min = persistence.get('noRequestCodeFor3Min') === true;

    $scope.touchIDSupported = false;
    if ($window.fingerscanner) {
        $window.fingerscanner.checkSupportTouchID(function(touchIDSupported) {
            $scope.touchIDSupported = touchIDSupported;
        }, function(err) {
            console.log(err);
        });
    }

    var args = [];

    $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/settings/security/shortCode.html', function($ionicModal) {
        $scope.shortCode = $ionicModal;
    }, {
        scope: $scope
    });

    $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/auth/useTouchID.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.touchID = modal;
    });

    $scope.$on('$destroy', function() {
        if ($scope.shortCode) {
            $scope.shortCode.remove();
        }
        if ($scope.touchID) {
            $scope.touchID.remove();
        }
    });

    $scope.$on('modal.shown', function () {
        $rootScope.showStatusBar(false);
    });

    $scope.$on('modal.hidden', function () {
        $rootScope.showStatusBar(true);
        var authMode = persistence.get('authMode');
        //095590 Сброс тогглов
        $scope.user.toggleShortCode = authMode == 'shortCode' || authMode == 'touchID';
        $scope.user.toggleTouchID = authMode == 'touchID';
        $scope.user.noRequestCodeFor3Min = persistence.get('noRequestCodeFor3Min') === true;
    });
    $scope.resetUserCodeDate = function() {
        $scope.user.isCodeDate = false;
        delete($scope.user.codeDateObj);
    };

    function processingResults(data) {
        switch (data.cmdInfo) {
            case 'changeLogin':
            case 'changePassword':
            case 'changeCodeDate':

                // <для подтверждения одноразовым паролем>
                if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                    $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm');
                    return;
                } else if (data.result.data == 'true') {
                    $scope.confirmationHide();

                    // Действия после успешной отправки.
                    if (data.cmdInfo == 'changeLogin') {
                        $scope.user.login = $scope.user.newLogin;
                        persistence.put($scope.user.login);
                    }
                    if (data.cmdInfo == 'changeCodeDate') {
                        $scope.user.isCodeDate = false;
                        delete($scope.user.codeDateObj);
                        $scope.retailClient.isCodeDate = true;
                        $scope.retailClient.codeDateHint = $scope.user.codeDateHint;
                    }
                    $scope.goBack();
                } else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                    $scope.confirmationFalse(data.result.data);
                } else {
                    $scope.confirmationHide();
                    alert(data.result.data);
                    return;
                }
                // </для подтверждения одноразовым паролем>
                break;
            case 'changeConfirmation':
                $scope.retailClient.confirmation = $scope.user.confirmation;
                $scope.goBack();
                break;
            case 'registerShortCode':
                $ionicLoading.hide();
                if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                    $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm');
                    return;
                }  else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                    $scope.confirmationFalse(data.result.data);
                    return;
                } else if (data.result.data.length !== 42) {
                    $timeout(function() {
                        alert('Ошибка регистрации короткого кода\n' + data.result.data)
                    }, true);
                    $scope.user.shortCode1 = '';
                    $scope.user.shortCode2 = '';
                    $scope.user.firstCode = true;
                    $scope.$digest();
                    return;
                }
                $scope.user.idShortCode = data.result.data;
                persistence.put('idShortCode', $scope.user.idShortCode);
                persistence.put('authMode', 'shortCode');
                $scope.confirmationHide();
                $scope.shortCode.hide();
                break;
            case 'changeShortCode':
                $ionicLoading.hide();
                if (data.result.data !== 'true') {
                    $timeout(function () {
                        alert(data.result.data);
                    }, true);
                    $scope.user.shortCode1 = '';
                    $scope.user.shortCode2 = '';
                    $scope.user.firstCode = true;
                    return;
                }
                $scope.shortCode.hide();
                break;
            case 'registerTouchID':
                if (data.result.data == 'false') {
                    alert('Регистрация Touch ID\nПроизошла ошибка');
                    return;
                }
                var params = {};
                params.login = fn_b64_decode(data.result.data[0]);
                params.password = fn_b64_decode(data.result.data[1]);
                $window.fingerscanner.savePrivateData(
                    params,
                    function(info) {
                        persistence.put('authMode', 'touchID');
                        persistence.put('registeredTouchID', true);
                        $scope.touchID.hide();
                    },
                    function(e) {
                        console.log('app.error: ' + e);

                        // нажали крестик
                        if (e == 'Code error : 8') {
                            persistence.put('authMode', 'shortCode');
                            $scope.touchID.hide();
                            $scope.user.toggleTouchID = false;
                        } else {
                            alert(e, 'Ошибка');
                        }
                    }
                );
                break;
        }
        $scope.$apply();
    }
    WebWorker.setFunction(processingResults);

    $scope.changeLogin = function() {
        args = ['RetailConfirmPersonalData', $scope.user.newLogin];
        WebWorker.postMessage('changeLogin', 'changeLogin', args);
    };

    $scope.changePassword = function() {
        args = ['ChangePasswordAction', JSON.stringify($scope.user)];
        WebWorker.postMessage('changePassword', 'changePassword', args);
    };

    $scope.changeCodeDate = function() {
        if ($scope.user.codeDateObj) {
            $scope.user.codeDate = $scope.user.codeDateObj.format("ddmmyyyy");
        } else {
            alert('Укажите кодовую дату');
            return;
        }
        args = ['RetailConfirmPersonalData', JSON.stringify($scope.user)];
        WebWorker.postMessage('changeCodeDate', 'changeCodeDate', args);
    };

    $scope.setConfirm = function(method) {
        $scope.activeTarget = method;
        $scope.user.confirmation = method;
    };

    $scope.changeConfirmation = function() {
        if (!$scope.user.confirmation) {
            alert('Выберите способ подтверждения');
            return;
        }
        WebWorker.postMessage('invokeRetailClientEntityMethod', 'changeConfirmation', ['changeConfirmation', $scope.user.confirmation]);
    };

    $scope.changeUseOTPLoginAction = function() {
        WebWorker.postMessage('invokeUserEntityMethod', 'changeUseOTPLoginAction', ['changeUseOTPLoginAction', $scope.user.useOTPLoginAction.toString()]);
    };

    $scope.toggleShortCode = function() {
        /* вкл. и КК не зареган*/
        if ($scope.user.toggleShortCode && !$scope.user.idShortCode) {
            $scope.user.firstCode = true;
            $scope.user.shortCode1 = '';
            $scope.user.shortCode2 = '';
            $scope.shortCode.show();
        }
        /* вкл. и КК зареган */
        if ($scope.user.toggleShortCode && $scope.user.idShortCode) {
            persistence.put('authMode', 'shortCode');
        }
        /* выкл. */
        if (!$scope.user.toggleShortCode) {
            persistence.put('authMode', 'login');
        }
    };

    $scope.changeShortCode = function() {
        $scope.user.firstCode = true;
        $scope.user.shortCode1 = '';
        $scope.user.shortCode2 = '';
        $scope.shortCode.show();
    };

    $scope.toggleTouchID = function() {
        /* вкл. и Touch ID не зареган */
        if ($scope.user.toggleTouchID && !persistence.get('registeredTouchID')) {
            $scope.touchID.show();
        }
        /* вкл. и Touch ID зареган */
        if ($scope.user.toggleTouchID && persistence.get('registeredTouchID')) {
            persistence.put('authMode', 'touchID');
        }
        /* выкл. */
        if (!$scope.user.toggleTouchID) {
            persistence.put('authMode', 'shortCode');
        }
    };

    $scope.useTouchID = function(flag) {
        if (flag) {
            WebWorker.postMessage('registerTouchID', 'registerTouchID', [$scope.user.idShortCode]);
        } else {
            $scope.touchID.hide();
        }
    };

    $scope.toggleRequestCodeFor3Min = function(){
        persistence.put('noRequestCodeFor3Min', $scope.user.noRequestCodeFor3Min);
    };

    $scope.addDigit = function(digit) {
        if ($scope.user.firstCode) {
            $scope.user.shortCode1 += digit;
            if ($scope.user.shortCode1.length === 4) {
                $scope.user.firstCode = false;
            }
        } else {
            $scope.user.shortCode2 += digit;
            if ($scope.user.shortCode2.length === 4) {
                if ($scope.user.shortCode1 !== $scope.user.shortCode2) {
                    if ($scope.user.idShortCode) {
                        $timeout(function() {
                            alert('Коды доступа не совпадают');
                        }, true);
                    } else {
                        $timeout(function() {
                            alert('Коды доступа не совпадают');
                        }, true);
                    }
                    $scope.user.shortCode1 = '';
                    $scope.user.shortCode2 = '';
                    $scope.user.firstCode = true;
                    return;
                }
                $ionicLoading.show({
                    templateUrl: 'templates/' + sys.getPlatform() + '/loading.html'
                });
                if (!$scope.user.idShortCode) {
                    args = ['RetailRegisterShortCode', JSON.stringify($scope.user)];
                    WebWorker.postMessage('registerShortCode', 'registerShortCode', args);
                } else {
                    WebWorker.postMessage('changeShortCode', 'changeShortCode', [JSON.stringify($scope.user)]);
                }
            }
        }
    };

    $scope.backspace = function() {
        if ($scope.user.firstCode) {
            $scope.user.shortCode1 = $scope.user.shortCode1.slice(0, -1);
        } else {
            $scope.user.shortCode2 = $scope.user.shortCode2.slice(0, -1);
        }
    };

    $scope.cancelShortCode = function() {
        $scope.user.firstCode = true;
        $scope.user.shortCode1 = '';
        $scope.user.shortCode2 = '';
        $scope.shortCode.hide();
    };
}]);

module.controller('SettingsApplicationDataCtrl', ['$scope', '$rootScope', '$state', '$window', '$timeout', 'settingsSrv', 'persistence', 'WebWorker',
function ($scope, $rootScope, $state, $window, $timeout, settingsSrv, persistence, WebWorker) {

    function processingResults(data) {
        switch (data.cmdInfo) {
            case 'setVisibleCloseProducts':
                // Do nothing now.
                // Better way to enable toggler input back which were disabled before worker called server method (not implemented).
                break;
        }
        $scope.$apply();
    }
    WebWorker.setFunction(processingResults);

    $scope.toggleShowBlockedProducts = function() {
        /* вкл.*/
        if ($scope.user.showBlockedProducts) {
            WebWorker.postMessage('setVisibleCloseProducts', 'setVisibleCloseProducts', [true]);
        }
        /* выкл. */
        else if (!$scope.user.showBlockedProducts) {
            WebWorker.postMessage('setVisibleCloseProducts', 'setVisibleCloseProducts', [false]);
        }
    };

    $scope.isOpenTemplatesByHandshake = function() {
        return persistence.get('isOpenTemplatesByHandshake');
    };

    $scope.user.isOpenTemplatesByHandshake = $scope.isOpenTemplatesByHandshake();

    $scope.toggleOpenTemplatesByHandshake = function() {
        /* вкл.*/
        if ($scope.user.isOpenTemplatesByHandshake) {
            persistence.put('isOpenTemplatesByHandshake', true);
            $rootScope.enableHandShaker();
        }
        /* выкл. */
        else {
            persistence.put('isOpenTemplatesByHandshake', false);
            $rootScope.disableHandShaker();
        }
    };

}]);

module.controller('NearestOfficeCtrl', ['$scope', '$stateParams', function ($scope, $stateParams) {
    $scope.point = $stateParams.point;
    $scope.distance = $scope.point.distance;
}]);