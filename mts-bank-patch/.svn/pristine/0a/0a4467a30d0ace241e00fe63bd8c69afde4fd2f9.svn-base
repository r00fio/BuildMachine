/**
 * MTS Persistent Storage
 * В браузере использует localStorage, на устройстве - плагин Application Preferences
 * Персистит данные на устройстве перед выходом из приложения или по сигналу низкого заряда аккумулятора.
 * Created by varzinov on 04.08.2015.
 */

var mtsPersistentStorage = (function (window, document) {
    var storageCache = {};

    var isString = function(obj) { return Object.prototype.toString.call(obj) === '[object String]'; };
    var isObject = function(obj) { return Object.prototype.toString.call(obj) === '[object Object]'; };

    var assignStorage = function(data){
        try {
            storageCache = JSON.parse(data);
            if (!isObject(storageCache)) { throw undefined; }
        } catch(e) {
            storageCache = {};
        }
    };

    var persist = function(){
        if (window.cordova) {
            var prefs;
            if (window.plugins && (prefs = window.plugins.appPreferences)) {
                prefs.store(function(){}, function(){}, 'mtsPersistentStorage', JSON.stringify(storageCache));
            }
        } else {
            if (window.Storage) {
                localStorage.setItem('mtsPersistentStorage', JSON.stringify(storageCache));
            }
        }
    };

    var init = function(){
        if (window.cordova) {
            document.addEventListener('pause', persist, false);
            document.addEventListener('batterycritical', persist, false);
        } else {
            window.onbeforeunload = persist;
        }

        init = function(){};
    };

    var load = function(){
        init();

        var promise = {
            then: function(callback){
                if (this.resolved) {
                    callback();
                } else {
                    this.resolve = callback;
                }
            },
            resolve: function() {
                this.resolved = true;
            }
        };

        if (window.cordova) {
            var prefs;
            if (window.plugins && (prefs = window.plugins.appPreferences)) {
                prefs.fetch('mtsPersistentStorage').then(function(value){
                    /*
                     * На iOS плагин appPreferences по какой-то причине
                     * возвращаемые значения обрамляет в двойные кавычки
                     */
                    if (window.cordova.platformId === 'ios' && value) {
                        value = value.replace(/(^")|("$)/g, '');
                    }

                    assignStorage(value);
                    promise.resolve();
                }, function(){
                    assignStorage();
                    promise.resolve();
                });
            }
        } else {
            if (window.Storage) {
                assignStorage(localStorage.getItem('mtsPersistentStorage'));
                setTimeout(function(){
                    promise.resolve();
                }, 0);
            }
        }

        return promise;
    };

    var clear = function(){ storageCache = {}; };

    var get = function(key){
        return isString(key) ? storageCache[key] : undefined;
    };
    var put = function(key, value){
        if (isString(key)) {
            if (typeof value !== 'undefined') {
                storageCache[key] = value;
            } else {
                delete storageCache[key];
            }
        }
    };
    var remove = function(key) {
        if (isString(key)) {
            delete(storageCache[key]);
        }
    }

    return {
        load: load,
        persist: persist,
        clear: clear,
        get: get,
        put: put,
        remove: remove
    };
})(window, document);