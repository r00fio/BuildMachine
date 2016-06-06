var argscheck = require('cordova/argscheck'),
    channel = require('cordova/channel'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    cordova = require('cordova');

channel.createSticky('onCordovaInfoReady');
// Tell cordova channel to wait on the CordovaInfoReady event
channel.waitForInitialization('onCordovaInfoReady');

/**
 * This represents the mobile device, and provides properties for inspecting the model, version, UUID of the
 * phone, etc.
 * @constructor
 */
function DeviceInfo() {
    this.available = false;	

    var me = this;

    channel.onCordovaReady.subscribe(function() {
        me.getInfo(function(info) {
		
            me.available = true;				
            me.data = info;
			
            channel.onCordovaInfoReady.fire();
        },function(e) {
            me.available = false;
            utils.alert("[ERROR] Error initializing Cordova: " + e);
        });
    });
}

/**
 * Get device info
 *
 * @param {Function} successCallback The function to call when the heading data is available
 * @param {Function} errorCallback The function to call when there is an error getting the heading data. (OPTIONAL)
 */
DeviceInfo.prototype.getInfo = function(successCallback, errorCallback) {
    argscheck.checkArgs('fF', 'DeviceInfo.getInfo', arguments);
    exec(successCallback, errorCallback, "DeviceInfo", "getDeviceInfo", []);
};

module.exports = new DeviceInfo();
