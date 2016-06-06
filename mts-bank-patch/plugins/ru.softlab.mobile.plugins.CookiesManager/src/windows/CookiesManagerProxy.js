var CookiesManager = {
    clear: function (successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "CookiesManager", "clear", []);
    }
}

module.exports = {
	clear: function (successCallback, errorCallback) {
	    var url = new Windows.Foundation.Uri(AppConfig.cleverClientUrl);
		var cookiesCollection = Windows.Web.Http.Filters.HttpBaseProtocolFilter().cookieManager.getCookies(url);
	    var cookie;
	    cookiesCollection.forEach(
            function logArrayElements(element, index, array) {
                Windows.Web.Http.Filters.HttpBaseProtocolFilter().cookieManager.deleteCookie(element);
            }
        );
        successCallback();
    }
}

require("cordova/exec/proxy").add("CookiesManager", module.exports);
