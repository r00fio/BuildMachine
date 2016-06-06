/**
 * Сервис настроек
 * @type {module}
 */
var app = angular.module('app');

app.factory('settingsSrv', [function () {

    // Друзья
    var friendsInBankList = undefined;
    var otherFriendsList = undefined;

    var SPLIT_FIELD = ", ";
    var SPLIT_FRIEND = "; ";

    // Социальные сети
    var socialNetworks = [
        {
            name: 'Facebook',
            strId: 'oauth2.facebook',
            iconSrc: 'img/facebook.svg',
            disabled: true,
            isLinked: false
        },
        {
            name: 'Вконтакте',
            strId: 'oauth2.vkontakte',
            iconSrc: 'img/vkontakte.svg',
            disabled: true,
            isLinked: false
        },
        {
            name: 'Mail.ru',
            strId: 'oauth2.mailru',
            iconSrc: 'img/mailru.svg',
            disabled: true,
            isLinked: false
        },
        /*{
            name: 'Google+',
            strId: 'oauth2.googleplus',
            iconSrc: 'img/google-plus.svg',
            disabled: true,
            isLinked: false
        },*/
        {
            name: 'Microsoft Life',
            strId: 'oauth2.microsoft',
            iconSrc: 'img/microsoft-life.svg',
            disabled: true,
            isLinked: false
        }
    ];

    /* Типы лицевых счетов: наименование, ссылка для редиректа, strId для сервера */
    var personalAccountTypeList = [{name:'Мобильный телефон',       uiSref:'settings.paysdata.accountMobileTelephone',
                                    type:'MOBILE_TELEPHONE'},
                                   {name:'Домашний телефон',        uiSref:'settings.paysdata.accountHomeTelephone',
                                    type:'HOME_TELEPHONE'},
                                   {name:'СНИЛС',                   uiSref:'settings.paysdata.accountSNILS',
                                    type:'SNILS'},
                                   {name:'Полис ОМС',               uiSref:'settings.paysdata.accountOMS',
                                    type:'POLICY_OF_OBLIGATORY_MEDICAL_INSURANCE'},
                                   {name:'ИНН',                     uiSref:'settings.paysdata.accountINN',
                                    type:'INN'},
                                   {name:'ФСПП',                    uiSref:'settings.paysdata.accountFSPP',
                                    type:'FEDERAL_BAILIFF_SERVICE'},
                                   {name:'Другой аккаунт или счёт', uiSref:'settings.paysdata.accountOther',
                                    type:'OTHER'}];

    /* Отдельно создаваемый тип лицевого счёта "Штраф ГИБДД" */
    var personalAccountFineType = {name:'Штрафы ГИБДД',            uiSref:'settings.paysdata.accountFine',
                                   type:'DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL'};

    var getPersonalAccountTypeList = function() {
        return personalAccountTypeList;
    };

    var getPersonalAccountFineType = function() {
        return personalAccountFineType;
    };

    /**
     * Валидация лицевых счетов (вынесен сюда в с связи с огромным размером)
     * @param personalAccount
     * @returns {boolean}
     */
    var validatePersonalAccount = function(personalAccount) {
        if (personalAccount.type === 'MOBILE_TELEPHONE') {
            if (!personalAccount.NUMBER_MOBILE_TELEPHONE) {
                alert('Введите Номер');
                return false;
            }
        }
        if (personalAccount.type === 'HOME_TELEPHONE') {
            if (!personalAccount.NUMBER_HOME_TELEPHONE) {
                alert('Введите Номер');
                return false;
            }
            if (!personalAccount.NUMBER_APARTMENT) {
                alert('Введите Номер квартиры');
                return false;
            }
        }
        if (personalAccount.type === 'SNILS') {
            if (!personalAccount.NUMBER_SNILS) {
                alert('Введите Номер');
                return false;
            }
        }
        if (personalAccount.type === 'POLICY_OF_OBLIGATORY_MEDICAL_INSURANCE') {
            if (!personalAccount.NUMBER_POLICY_OF_OBLIGATORY_MEDICAL_INSURANSE) {
                alert('Введите Номер');
                return false;
            }
        }
        if (personalAccount.type === 'INN') {
            if (!personalAccount.NUMBER_INN) {
                alert('Введите Номер');
                return false;
            }
        }
        if (personalAccount.type === 'FEDERAL_BAILIFF_SERVICE') {
            if (!personalAccount.LAST_NAME_FEDERAL_BAILIFF_SERVICE) {
                alert('Введите Фамилию');
                return false;
            }
            if (!personalAccount.FIRST_NAME_FEDERAL_BAILIFF_SERVICE) {
                alert('Введите Имя');
                return false;
            }
            if (!personalAccount.BIRTHDAY_FEDERAL_BAILIFF_SERVICE) {
                alert('Введите Дату рождения');
                return false;
            }
        }
        if (personalAccount.type === 'DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL') {
            if (!personalAccount.DRIVER_DOC_NUMBER_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL
                    && !personalAccount.driverDocDate
                    && !personalAccount.NUMBER_VEHICLE_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL
                    && !personalAccount.VEHICLE_CERTIFICATE_REGISTRATION_NUMBER_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL) {
                alert('Введите ВУ или ТС, или оба');
                return false;
            }
            if (personalAccount.driverDocDate
                && !personalAccount.DRIVER_DOC_NUMBER_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL) {
                alert('Введите Номер ВУ');
                return false;
            }
            if (!personalAccount.driverDocDate
                && personalAccount.DRIVER_DOC_NUMBER_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL) {
                alert('Введите Дату выдачи ВУ');
                return false;
            }
            if (personalAccount.VEHICLE_CERTIFICATE_REGISTRATION_NUMBER_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL
                && !personalAccount.NUMBER_VEHICLE_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL) {
                alert('Введите Государственный номер ТС');
                return false;
            }
            if (!personalAccount.VEHICLE_CERTIFICATE_REGISTRATION_NUMBER_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL
                && personalAccount.NUMBER_VEHICLE_DEPARTMENT_OF_MOTOR_VEHICLES_AND_TRAFFIC_CONTROL) {
                alert('Введите Свидетельство о регистрации ТС');
                return false;
            }
        }
        if (personalAccount.type === 'OTHER') {
            if (!personalAccount.NUMBER_OTHER) {
                alert('Введите Номер');
                return false;
            }
        }
        if (!personalAccount.desc) {
            alert('Введите Наименование');
            return false;
        }
        return true;
    };


    // Социальные сети
    var getSocialNetworks = function() {
        return socialNetworks;
    };

    // Друзья
    var getFriendsInBank = function() {
        return friendsInBankList;
    };

    var setFriendsInBank = function(friends) {
        friendsInBankList = friends;
    };

    var getOtherFriends = function() {
        return otherFriendsList;
    };

    var setOtherFriends = function(friends) {
        otherFriendsList = friends;
    };

    // Поддержка формата данных, отправляемых на сервер (аналогично коду на серверной стороне)
    var friendToString = function(friend) {
        return friend.id + SPLIT_FIELD + friend.first_name + SPLIT_FIELD + friend.last_name + SPLIT_FIELD + friend.photo;
    };

    /**
     * Получение строки из списка друзей для сервера
     * @param friends
     * @param strId
     * @returns {string}
     */
    var friendsToString = function(friends) {
        var result = "";
        for (var i = 0; i < friends.length; i++) {
            if (result != "") {
                result += SPLIT_FRIEND;
            }
            result += friendToString(friends[i]);
        }
        return result;
    };

    var getFormattedUserContacts = function(contacts) {
        var formattedContacts = [];

        for (var i = 0; i < contacts.length; ++i) {
            if (contacts[i].phoneNumbers && contacts[i].phoneNumbers.length > 0) {
                var tmp = {
                    displayName: null,
                    phone: null
                };
                tmp.displayName = contacts[i].displayName ? contacts[i].displayName : contacts[i].name.formatted;
                if (contacts[i].phoneNumbers) {
                    for (var j = 0; j < contacts[i].phoneNumbers.length; ++j) {
                        if (contacts[i].phoneNumbers[j].type == "mobile") {
                            tmp.phone = contacts[i].phoneNumbers[j].value;
                            break;
                        }
                    }
                }
                if (!tmp.phone) {
                    tmp.phone = contacts[i].phoneNumbers[0].value;
                }

                if (tmp.displayName && tmp.phone) {
                    formattedContacts.push(tmp);
                }
            }
        }

        return formattedContacts;
    };

    var reset = function() {
        friendsInBankList = undefined;
        otherFriendsList = undefined;
    };

    return {
        getPersonalAccountTypeList: getPersonalAccountTypeList,
        getPersonalAccountFineType: getPersonalAccountFineType,
        validatePersonalAccount: validatePersonalAccount,

        getSocialNetworks: getSocialNetworks,
        getFriendsInBank: getFriendsInBank,
        setFriendsInBank: setFriendsInBank,
        getOtherFriends: getOtherFriends,
        setOtherFriends: setOtherFriends,

        getFormattedUserContacts: getFormattedUserContacts,
        friendsToString: friendsToString,
        reset: reset
    }
}]);