var exec = require('cordova/exec');

function CookiesManager() {
    
}

CookiesManager.prototype.clear = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "CookiesManager", "clear", []);
};

module.exports = new CookiesManager();
