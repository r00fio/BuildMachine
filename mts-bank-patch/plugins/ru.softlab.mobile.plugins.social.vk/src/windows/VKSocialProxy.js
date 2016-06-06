var VKSocial = {
    getUserInfo: function (successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "VKSocial", "getUserInfo", []);
    },
    logout: function (successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "VKSocial", "logout", []);
    }
}

var VkAppID = "4951150";
var app;
var authzInProgress = false;
var AccessToken;
var userInfo = {};

var _successCallback;
var _errorCallback;

module.exports = {
    getUserInfo: function (successCallback, errorCallback) {
        _successCallback = successCallback;
        _errorCallback = errorCallback;
        if (addAppListener()) {
            if (AccessToken) {
                getMeInfo(AccessToken);
            } else {
                launchVkontakteWebAuth();
            }
        } else {
            _errorCallback("Error : add to app listener onActivated");
        }
    },
    logout: function (successCallback, errorCallback) {
        AccessToken = null;
        successCallback();
    }
}

function activated(eventObject) {
    var activationKind = eventObject.detail.kind;
    var activatedEventArgs = eventObject.detail.detail;
    var activationKinds = Windows.ApplicationModel.Activation.ActivationKind;

    // Handle launch and continuation activation kinds
    switch (activationKind) {
        case activationKinds.webAuthenticationBrokerContinuation:
            continueWebAuthentication(activatedEventArgs);
            break;
        default:
            break;
    }
}

    function addAppListener() {
        app = WinJS.Application;
        if (app) {
            app.addEventListener("activated", activated, false);
            return true;
        }
        return false;
    }

    function launchVkontakteWebAuth() {
        var vkontakteURL = "https://oauth.vk.com/authorize?client_id=";
        var callbackURL = "https://oauth.vk.com/blank.html";
        var scope = "friends";

        vkontakteURL += VkAppID + "&redirect_uri=" + encodeURIComponent(callbackURL) + "&scope=" + scope + "&display=mobile&response_type=token";
        if (authzInProgress) {
            console.log("\r\nAuthorization already in Progress ...");
            return;
        }

        var startURI = new Windows.Foundation.Uri(vkontakteURL);
        var endURI = new Windows.Foundation.Uri(callbackURL);

        console.log("Navigating to: " + vkontakteURL + "\r\n");

        authzInProgress = true;
        if (Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAndContinue) {
            Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAndContinue(startURI, endURI, null, Windows.Security.Authentication.Web.WebAuthenticationOptions.none);
        }
        else {
            console.log("\r\nError in authorization process...");
            _errorCallback("Error in authorization process...");
        }
    }

    /*
    * This function is Continuation handler for Windows Phone App
    */
    function continueWebAuthentication(args) {
        var result = args[0].webAuthenticationResult;
        if (result.responseStatus === Windows.Security.Authentication.Web.WebAuthenticationStatus.success) {
            console.log("Status returned by WebAuth broker: " + result.responseStatus + "\r\n");
            if (!isAccessDenied(result.responseData)) {
                getAccessToken(result.responseData);
                if (AccessToken) {
                    getMeInfo(AccessToken);
                } else {
                    launchVkontakteWebAuth();
                }
            } else {
                _errorCallback("Error in authorization process..");
            }
        }
        else if (result.responseStatus === Windows.Security.Authentication.Web.WebAuthenticationStatus.errorHttp) {
            console.log("Error returned: " + result.responseErrorDetail + "\r\n");
            _errorCallback("Error returned: " + result.responseErrorDetail);
        }
        else {
            console.log("Status returned by WebAuth broker: " + result.responseStatus + "\r\n");
            _errorCallback("Error : status returned by WebAuth broker: " + result.responseStatus);
        }
        authzInProgress = false;
    }

    function isAccessDenied(webAuthResultResponseData) {
        if (webAuthResultResponseData.indexOf("error") >= 0) {
            var responseData = webAuthResultResponseData.substring(webAuthResultResponseData.indexOf("error"));
            var keyValPairs = responseData.split("&");
            for (var i = 0; i < keyValPairs.length; i++) {
                var splits = keyValPairs[i].split("=");
                switch (splits[0]) {
                    case "error_description":
                        console.log("Error in authorization process : " + splits[1]);
                        break;
                }
            }
            return true;
        }
        return false;
    }

    function getAccessToken(webAuthResultResponseData) {
        if (webAuthResultResponseData.indexOf("oauth.vk.com") >= 0) {
            var responseData = webAuthResultResponseData.substring(webAuthResultResponseData.indexOf("access_token"));
            var keyValPairs = responseData.split("&");
            var expires_in;
            for (var i = 0; i < keyValPairs.length; i++) {
                var splits = keyValPairs[i].split("=");
                switch (splits[0]) {
                    case "access_token":
                        AccessToken = splits[1];
                        break;
                    case "expires_in":
                        expires_in = splits[1];
                        break;
                }
            }
        } else {
            console.log("Error in parsing response : wrong domain");
            _errorCallback("Error in authorization process...");
        }
    }

    function getMeInfo(accessToken) {
        var client = new Windows.Web.Http.HttpClient();
        var fields = "id, first_name, last_name, photo_50";
        var requestStr = "https://api.vk.com/method/users.get?access_token=" + accessToken + "&fields=" + fields;
        client.getStringAsync(new Windows.Foundation.Uri(requestStr)).done(function (result) {
            console.log("Complete request user info..");
            var resultJSON = JSON.parse(result);
            var response = resultJSON.response;

            userInfo['id'] = response[0].uid;
            userInfo['first_name'] = response[0].first_name;
            userInfo['last_name'] = response[0].last_name;
            userInfo['photo'] = response[0].photo_50;

            getPhotoBase64(userInfo['photo']);
        }, function (result) {
            console.log("Error when get info about user : " + result);
            _errorCallback("Error when get info about user..");
        });
    }

    function getFriendsInfo(accessToken) {
        var client = new Windows.Web.Http.HttpClient();
        var fields = "id,first_name,last_name,photo_50";
        var requestStr = "https://api.vk.com/method/friends.get?access_token=" + accessToken + "&fields=" + fields;
        client.getStringAsync(new Windows.Foundation.Uri(requestStr)).done(function (result) {
            console.log("Complete request user's friends info..");
            var resultJSON = JSON.parse(result);
            var response = resultJSON.response;
            var friendsInfo = [];
            response.forEach(function (element, index, array) {
                var item = {};
                item['id'] = element.uid;
                item['first_name'] = element.first_name;
                item['last_name'] = element.last_name;
                item['photo'] = element.photo_50;

                friendsInfo.push(item);
            });

            var resultInfo = {};
            resultInfo['userInfo'] = userInfo;
            resultInfo['friendsInfo'] = friendsInfo;

            _successCallback(resultInfo);
        }, function (result) {
            console.log("Error when get info about user's friends : " + result);
            _errorCallback("Error when get info about user's friends..");
        });
    }

    function getPhotoBase64(url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';

        xhr.addEventListener('load', handlerLoad, false);
        xhr.addEventListener('error', handlerFailed, false);
        xhr.addEventListener('abort', handlerCanceled, false);

        xhr.send();
        function handlerLoad(data) {
            console.log("Photo was loaded..");
            var arrayBuffer = data.target.response;
            var base64 = null;
            var binary = '';
            var bytes = new Uint8Array(arrayBuffer);
            var len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            base64 = window.btoa(binary);
            userInfo['photo'] = base64;
            next();
        }
        function handlerFailed(evt) {
            console.log("Error when load photo : " + evt);
            next();
        }
        function handlerCanceled(evt) {
            console.log("Error when load photo : " + evt);
            next();
        }
        function next() {
            getFriendsInfo(AccessToken)
        }
    }

require("cordova/exec/proxy").add("VKSocial", module.exports);