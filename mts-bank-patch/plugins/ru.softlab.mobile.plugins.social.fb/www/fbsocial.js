var exec = require('cordova/exec');

function FBSocial() {
    this.name = "FBSocial";
}

FBSocial.prototype.getUserInfo = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "FBSocial", "getUserInfo", []);
};

FBSocial.prototype.login = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "FBSocial", "login", []);
};

FBSocial.prototype.logout = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "FBSocial", "logout", []);
};

module.exports = new FBSocial();
