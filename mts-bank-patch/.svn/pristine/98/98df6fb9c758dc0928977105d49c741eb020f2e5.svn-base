var app_client_id = "736182";
var app_private_key = "b258b76c09d411c2121174096ced04f8";

var access_token = null;
var refresh_token = null;
var user_mailru_id = null;
var inappbrowser = null;
var userInfo = {};

var mailru_plugin = {

	resultJsonData: {},
    
    getUserInfo: function (successCallback, errorCallback) {

        var _loginUrl = "https://connect.mail.ru/oauth/authorize?client_id=" + app_client_id + "&response_type=token&display=mobile&redirect_uri=http%3A%2F%2Fconnect.mail.ru%2Foauth%2Fsuccess.html";

        /*
        *  fullscreen=yes - for WindowsPhone only
        */
        inappbrowser = window.open(_loginUrl, '_blank', 'location=yes,clearcache=yes,fullscreen=yes');

        inappbrowser.addEventListener('loadstop',
            function (event) {
                var urlString = event.url;
                if (urlString.indexOf('http://connect.mail.ru/oauth/success.html') == 0) {
                    var paramsString = urlString.substring(urlString.indexOf('#') + 1);
                    var params = paramsString.split("&");
                    var array = {};
                    for (i = 0, l = params.length; i < l; i++) {
                        var temp = params[i].split("=");
                        array[temp[0]] = temp[1];
                    }
                    if ('error' in array) {
                        errorCallback("Request finished with error : " + array['error']);
                        return;
                    }

                    if ('refresh_token' in array) {
                        refresh_token = array['refresh_token'];
                    } else {
                        errorCallback("Bad parameters in request");
                        return;
                    }

                    if ('access_token' in array) {
                        access_token = array['access_token'];
                    } else {
                        errorCallback("Bad parameters in request");
                        return;
                    }

                    if ('x_mailru_vid' in array) {
                        user_mailru_id = array['x_mailru_vid'];
                    } else {
                        errorCallback("Bad parameters in request");
                        return;
                    }
                    inappbrowser.close();

                    mailru_plugin.getMyInfo(successCallback);
                }
            });

        inappbrowser.addEventListener('loaderror', function (event) { errorCallback('InAppBrowser plugin error: ' + event.message); });
    },

    getMyInfo: function (successCallback) {
        var req = new XMLHttpRequest();
        var queryStr = null;

        var sig = this.getSignatureForRequest(access_token, user_mailru_id, 'users.getInfo');

        if (sig != null) {
            queryStr = "http://www.appsmail.ru/platform/api?method=users.getInfo&app_id=" + app_client_id + "&session_key=" + access_token + "&sig=" + sig;

            req.open('GET', queryStr, true);
            req.onreadystatechange = function (aEvt) {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        var allFieldsJSON = JSON.parse(req.responseText);

                        userInfo['accessToken'] = access_token;
						userInfo['id'] = allFieldsJSON[0].uid;
                        userInfo['first_name'] = allFieldsJSON[0].nick;
                        userInfo['last_name'] = allFieldsJSON[0].nick;
                        userInfo['pathPhoto'] = allFieldsJSON[0].pic;

                        mailru_plugin.getPhotoBase64(allFieldsJSON[0].pic, successCallback);
                    } else {
                        console.log("Error loading page : " + req.status + "; " + req.statusText);
                    }
                }
            };
            req.send(null);
        }
    },

    getPhotoBase64: function (photoUrl, successCallback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', photoUrl, true);
        xhr.responseType = 'arraybuffer';

        xhr.addEventListener('load', handlerLoad, false);
        xhr.addEventListener('error', handlerFailed, false);
        xhr.addEventListener('abort', handlerCanceled, false);

        xhr.send();
        function handlerLoad(data) {
            console.log("getPhotoBase64, handlerLoad");
            var arrayBuffer = data.target.response;
            var base64 = null;

            var binary = '';
            var bytes = new Uint8Array( arrayBuffer );
            var len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
                binary += String.fromCharCode( bytes[ i ] );
            }
            base64 = window.btoa( binary );

            userInfo['photo'] = base64;
            setResultAndContinue();
        }
        function handlerFailed(evt) {
            console.log("getPhotoBase64, handlerFailed : " + evt);
            userInfo['photo'] = "";
            setResultAndContinue();
        }
        function handlerCanceled(evt) {
            console.log("getPhotoBase64, handlerCanceled : " + evt);
            userInfo['photo'] = "";
            setResultAndContinue();
        }
        function setResultAndContinue() {
            mailru_plugin.resultJsonData['userInfo'] = userInfo;
            mailru_plugin.getFriendsList(successCallback);
        }
    },

    getFriendsList: function (successCallback) {
        var req = new XMLHttpRequest();
        var queryStr = null;
        var sig = this.getSignatureForRequest(access_token, user_mailru_id, 'friends.get');

        if (sig != null) {
            queryStr = "http://www.appsmail.ru/platform/api?method=friends.get&ext=1&app_id=" + app_client_id + "&session_key=" + access_token + "&sig=" + sig;

            req.open('GET', queryStr, true);
            req.onreadystatechange = function (aEvt) {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        var allFieldsJSON = JSON.parse(req.responseText);
                        var friendsInfo = [];
                        for (var i in allFieldsJSON) {
                            var item = {};
							item['id'] = allFieldsJSON[i].uid;
                            item['first_name'] = allFieldsJSON[i].first_name;
                            item['last_name'] = allFieldsJSON[i].last_name;
                            item['photo'] = allFieldsJSON[i].pic;
                            friendsInfo.push(item);
                        }
                        mailru_plugin.resultJsonData['friendsInfo'] = friendsInfo;
                        successCallback(mailru_plugin.resultJsonData);
                    } else {
                        console.log("Error loading page : " + req.status + "; " + req.statusText);
                    }
                }
            };
            req.send(null);
        }
    },

    getSignatureForRequest : function(session_key, uid, method_name) {
        var sig = null;
        var sigParams = null;
        if (session_key != null && uid != null) {
            if (method_name == 'users.getInfo') {
                sigParams = uid + "app_id=" + app_client_id + "method=" + method_name + "session_key=" + session_key + app_private_key;
            } else if (method_name == 'friends.get') {
                sigParams = uid + "app_id=" + app_client_id + "ext=1method=" + method_name + "session_key=" + session_key + app_private_key;
            }
        }
        if (sigParams != null) {
            sig = md5(sigParams);
        }
        return sig;
    }
};