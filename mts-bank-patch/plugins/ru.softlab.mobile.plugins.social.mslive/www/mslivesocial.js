var exec = require('cordova/exec');

function MsLiveSocial() {
    this.name = "MsLiveSocial";
}

MsLiveSocial.prototype.getUserInfo = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "MsLiveSocial", "getUserInfo", []);
};

MsLiveSocial.prototype.login = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "MsLiveSocial", "login", []);
};

MsLiveSocial.prototype.logout = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "MsLiveSocial", "logout", []);
};

module.exports = new MsLiveSocial();
