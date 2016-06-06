angular.module('app').controller('SocialNetworkCtrl', ['$scope', '$rootScope', '$state', 'WebWorker', 'settingsSrv',
    function ($scope, $rootScope, $state, WebWorker, settingsSrv) {

        $scope.socials = settingsSrv.getSocialNetworks();

        $scope.refreshSocNetworks = function() {
            settingsSrv.setFriendsInBank(undefined);
            settingsSrv.setOtherFriends(undefined);
        };

        $scope.continueAuth = function() {
            $state.go('home');
        };

        function processingResults(data) {
            switch (data.cmdInfo) {
                case 'getSocialNetworksParams':
                    for (var i = 0; i < data.result.data.length; ++i) {
                        for (var j = 0; j < $scope.socials.length; ++j) {
                            if ($scope.socials[j].strId == data.result.data[i].providerStrId) {
                                $scope.socials[j].disabled = false;
                                $scope.socials[j].userExtId = data.result.data[i].userExtId;
                                $scope.socials[j].lastUpdateDate = data.result.data[i].lastUpdateDate;
                                $scope.socials[j].isLinked = data.result.data[i].isLinked;
                                break;
                            }
                        }
                    }
                    break;

                case 'importPhoneBook':
                    if (data.result.data == true || data.result.data == 'true') {
                        $scope.refreshSocNetworks();
                        $scope.isUpdatingContacts = false;
                    } else if (data.result.data) {
                        alert(data.result.data);
                    }
                    break;

                case 'addOrRefreshSocialNetwork':
                    if (data.result.data == true || data.result.data == 'true') {
                        $scope.socials = settingsSrv.getSocialNetworks();
                        WebWorker.postMessage('getSocialNetworksParams', 'getSocialNetworksParams', []);
                        $scope.refreshSocNetworks();
                    } else if (data.result.data) {
                        alert(data.result.data);
                    }
                    break;

                case 'deleteFromSocialNetwork':
                    if (data.result.data == true || data.result.data == 'true') {
                        $scope.socials = settingsSrv.getSocialNetworks();
                        WebWorker.postMessage('getSocialNetworksParams', 'getSocialNetworksParams', []);
                        $scope.refreshSocNetworks();
                    } else if (data.result.data) {
                        alert(data.result.data);
                    }
                    break;

            }
            $scope.$apply();
        }

        WebWorker.setFunction(processingResults);

        WebWorker.postMessage('getSocialNetworksParams', 'getSocialNetworksParams', []);

        // Добавление/обновление/удаление данных из соцсетей
        $scope.successAddOrRefreshSocNetwork = function (response, strId) {
            response.strId = strId;
            settingsSrv.friendsToString(response.friendsInfo);
            WebWorker.postMessage('addOrRefreshSocialNetwork', 'addOrRefreshSocialNetwork', [response]);
        };

        var errorAddOrRefreshSocNetworkResult = function (error) {
            alert('Ошибка при подключении/обновлении данных из социальной сети: ' + error);
        };

        $scope.addSocial = function (social) {
            social.disabled = true;
            switch (social.strId) {
                case 'oauth2.vkontakte':
                    if (window.vksocial) {
                        window.vksocial.getUserInfo(function(response) {
                            $scope.successAddOrRefreshSocNetwork(response, social.strId);
                        }, errorAddOrRefreshSocNetworkResult);
                    } else {
                        social.disabled = false;
                        alert('Не удалось добавить данные для этой социальной сети.');
                    }
                    break;

                case 'oauth2.microsoft':
                    if (window.mslivesocial) {
                        window.mslivesocial.getUserInfo(function(response) {
                            $scope.successAddOrRefreshSocNetwork(response, social.strId);
                        }, errorAddOrRefreshSocNetworkResult);
                    } else {
                        social.disabled = false;
                        alert('Не удалось добавить данные для этой социальной сети.');
                    }
                    break;

                case 'oauth2.facebook':
                    if (window.facebookConnectPlugin && window.cordova.platformId === 'android') {
                        window.facebookConnectPlugin.login(["public_profile"],
                            function(response) {
								$scope.successAddOrRefreshSocNetwork(response, social.strId);
							},
							errorAddOrRefreshSocNetworkResult
                        );
                    } else if (window.fbsocial) {
                        window.fbsocial.getUserInfo(function(response) {
                            $scope.successAddOrRefreshSocNetwork(response, social.strId);
                        }, errorAddOrRefreshSocNetworkResult);
                    } else {
                        social.disabled = false;
                        alert('Не удалось добавить данные для этой социальной сети.');
                    }
                    break;

                case 'oauth2.mailru':
                    if (window.mailru_plugin) {
                        window.mailru_plugin.getUserInfo(function(response) {
                            $scope.successAddOrRefreshSocNetwork(response, social.strId);
                        }, errorAddOrRefreshSocNetworkResult);
                    } else {
                        social.disabled = false;
                        alert('Не удалось добавить данные для этой социальной сети.');
                    }
                    break;

                case 'oauth2.googleplus':
                default:
                    social.disabled = false;
                    alert('Не удалось добавить данные для этой социальной сети.\nУстройство не поддерживается');
            }
        };

        $scope.deleteFromSocialNetwork = function(social) {
            social.disabled = true;
            WebWorker.postMessage('deleteFromSocialNetwork', 'deleteFromSocialNetwork', [social.strId]);
            $scope.logoutFromSocNetwork(social);
        };

        $scope.logoutFromSocNetwork = function(social) {
            try {
                switch (social.strId) {
                    case 'oauth2.vkontakte':
                        if (window.vksocial) {
                            window.vksocial.logout(function(response) {}, function(response) {});
                        }
                        break;

                    case 'oauth2.microsoft':
                        if (window.mslivesocial) {
                            window.mslivesocial.logout(function(response) {}, function(response) {});
                        }
                        break;

                    case 'oauth2.facebook':
						if (window.facebookConnectPlugin && window.cordova.platformId === 'android') {
							window.facebookConnectPlugin.logout(function(response) {}, function(response) {});
                        } else if (window.fbsocial) {
                            window.fbsocial.logout(function(response) {}, function(response) {});
                        }
                        break;

                    case 'oauth2.mailru':
                        if (window.mailru_plugin) {
                            window.mailru_plugin.logout();
                        }
                        break;

                }
            } catch (ignored) {}
        };

        // Получение контактов из телефона пользователя
        var onSuccessImportContacts = function (contacts) {
            var formattedContacts = settingsSrv.getFormattedUserContacts(contacts);
            if (formattedContacts.length > 0) {
                $scope.isUpdatingContacts = true;
                WebWorker.postMessage('importPhoneBook', 'importPhoneBook', [JSON.stringify(formattedContacts)]);
            } else {
                alert('Нет доступных контактов для импорта');
            }

        };

        var onErrorImportContacts = function (error) {
            alert('Ошибка при обновлении данных из контактов телефона: ' + error);
        };

        $scope.importUserContacts = function () {
            alert('Импортируем контакты из Вашего устройства');
            var fields = ["name", "phoneNumbers"]; // Находит только те контакте, у которых имеются эти поля (для поиска по всем полям ["*"])
            window.navigator.contacts.find(fields, onSuccessImportContacts, onErrorImportContacts);
        };

    }
]);


angular.module('app').controller('SocialFriendsCtrl', ['$scope', '$rootScope', '$state', 'WebWorker', 'settingsSrv',
    function ($scope, $rootScope, $state, WebWorker, settingsSrv) {
        var joinFriends = function() {
            if ($scope.friendsInBank && $scope.otherFriends) {
                $scope.totalFriends = $scope.friendsInBank;
                for (var i = 0; i < $scope.totalFriends.length; i++) {
                    $scope.totalFriends[i].inBank = true;
                }
                $scope.totalFriends = $scope.totalFriends.concat($scope.otherFriends);
            }
        };

        $scope.friendsInBank = settingsSrv.getFriendsInBank();
        /* TODO: На первом этапе выводятся только друзья в банке
        $scope.otherFriends = settingsSrv.getOtherFriends();
        if ($rootScope.platform == 'ios') {
            joinFriends();
        }
        */

        if ($scope.friendsInBank && $scope.friendsInBank.length == 0) {
            settingsSrv.setFriendsInBank(undefined);
            $scope.friendsInBank = settingsSrv.getFriendsInBank();
            /* TODO: На первом этапе выводятся только друзья в банке
            if ($scope.otherFriends && $scope.otherFriends.length == 0) {
                settingsSrv.setOtherFriends(undefined);
                $scope.otherFriends = settingsSrv.getOtherFriends();
            }
            */
        }

        function processingResults(data) {
            switch (data.cmdInfo) {
                 case 'getFriendsForPaymentParams':
                     if (data.result) {
                         settingsSrv.setFriendsInBank(data.result.data.friendsInBankList);
                         $scope.friendsInBank = settingsSrv.getFriendsInBank();
                         /* TODO: На первом этапе выводятся только друзья в банке
                         $scope.totalFriends = [];
                         settingsSrv.setOtherFriends(data.result.data.otherFriendsList);
                         $scope.otherFriends = settingsSrv.getOtherFriends();
                         if ($rootScope.platform == 'ios') {
                             joinFriends();
                         }
                          if (!($scope.friendsInBank && $scope.friendsInBank.length > 0)
                                && !($scope.otherFriends && $scope.otherFriends.length > 0)) {
                            $state.go($state.previous.name != 'socialNetworks' ? 'socialNetworks' : 'payments');
                          }
                         */
                         if (!$scope.friendsInBank || $scope.friendsInBank.length == 0) {
                             $state.go($state.previous.name != 'socialNetworks' ? 'socialNetworks' : 'payments');
                         }
                     } else {
                         $state.go($state.previous.name != 'socialNetworks' ? 'socialNetworks' : 'payments');
                     }
                     break;
            }

            $scope.$apply();
        }

        WebWorker.setFunction(processingResults);

        if (!$scope.friendsInBank) {
            WebWorker.postMessage('getFriendsForPaymentParams', 'getFriendsForPaymentParams', []);
        }

        $scope.redirectToFriendTransfer = function(friend) {
            var link = 'paymenttofriend';
            var linkParams = { viewMode: 'EDIT', title: 'Друзьям', friendExtId: friend.id};
            $state.go(link, linkParams);
        };

        $scope.redirectToSocSetting = function() {
            $state.go('socialNetworks');
        }
    }
]);
