var exec = require('cordova/exec');

function Zingaya() {
    this.name = "ZingayaPlugin";
}

Zingaya.prototype.call = function(successCallback, errorCallback, args) {
    exec(successCallback, errorCallback, "Zingaya", "call", [args]);
};

Zingaya.prototype.hangup = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "Zingaya", "hangup", []);
};

Zingaya.prototype.microphoneOn = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "Zingaya", "microphoneOn", []);
};

Zingaya.prototype.microphoneOff = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "Zingaya", "microphoneOff", []);
};

module.exports = new Zingaya();
