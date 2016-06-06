var exec = require('cordova/exec');

function VKSocial() {
	this.name = "VKSocial";	
}

/**
 * Get user info from social network VK.COM
 *
 * @param {Function} successCallback The function to call when the heading data is available
 * @param {Function} errorCallback The function to call when there is an error getting the heading data. (OPTIONAL)
 */
VKSocial.prototype.getUserInfo = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "VKSocial", "getUserInfo", []);
};

VKSocial.prototype.login =  function(successCallback, errorCallback) {
	exec(successCallback, errorCallback, "VKSocial", "login", []);
}

VKSocial.prototype.logout =  function(successCallback, errorCallback) {
	exec(successCallback, errorCallback, "VKSocial", "logout", []);
}

module.exports = new VKSocial();
