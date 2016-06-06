var exec = require('cordova/exec');

function FingerScanner() {
    this.name = "FingerScanner";
}

FingerScanner.prototype.checkSupportTouchID = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "FingerScanner", "checkSupportTouchID", []);
};

FingerScanner.prototype.savePrivateData = function(logopass, successCallback, errorCallback) {
    exec(successCallback, errorCallback, "FingerScanner", "savePrivateData", [logopass]);
};

FingerScanner.prototype.checkTouchID = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "FingerScanner", "checkTouchID", []);
};

module.exports = new FingerScanner();
