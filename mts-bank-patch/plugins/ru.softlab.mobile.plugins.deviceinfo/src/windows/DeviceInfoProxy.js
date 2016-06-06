/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

module.exports = {

    getDeviceInfo:function(successCallback, fail, args) {

        // deviceId aka uuid, stored in Windows.Storage.ApplicationData.current.localSettings.values.deviceId
        var deviceId;
        // get deviceId, or create and store one
        var localSettings = Windows.Storage.ApplicationData.current.localSettings;
        if (localSettings.values.deviceId) {
            deviceId = localSettings.values.deviceId;
        }
        else {
            // App-specific hardware id could be used as uuid, but it changes if the hardware changes...
            try {
                var ASHWID = Windows.System.Profile.HardwareIdentification.getPackageSpecificToken(null).id;
                deviceId = Windows.Storage.Streams.DataReader.fromBuffer(ASHWID).readGuid();
            } catch (e) {
                // Couldn't get the hardware UUID
                deviceId = createUUID();
            }
            //...so cache it per-install
            localSettings.values.deviceId = deviceId;
        }

        var userAgent = window.clientInformation.userAgent;
        // this will report "windows" in windows8.1 and windows phone 8.1 apps
        // and "windows8" in windows 8.0 apps similar to cordova.js
        // See https://github.com/apache/cordova-js/blob/master/src/windows/platform.js#L25
        var devicePlatform = userAgent.indexOf("MSAppHost/1.0") == -1 ? "windows" : "windows8";
        var versionString = userAgent.match(/Windows (?:Phone |NT )?([0-9.]+)/)[1];

        var deviceInfo = new Windows.Security.ExchangeActiveSyncProvisioning.EasClientDeviceInformation();
        var manufacturer = deviceInfo.systemManufacturer;
        var model = deviceInfo.systemProductName;

        var proximity = Windows.Networking.Proximity.ProximityDevice;
        var proximityDevice = Windows.Networking.Proximity.ProximityDevice.getDefault();

        successCallback({
            platformType: "WindowsPhone",//devicePlatform,
            platformVersion: versionString,
            manufacturer: manufacturer,
            model: model,
            id: deviceId,
            nfc: proximityDevice != null
        });
    }
};

require("cordova/exec/proxy").add("DeviceInfo", module.exports);
