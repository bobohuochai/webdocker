import { once } from 'lodash';
var Deferred = /** @class */ (function () {
    function Deferred() {
        var _this = this;
        this.promise = new Promise(function (resolve, reject) {
            _this.resolve = resolve;
            _this.reject = reject;
        });
    }
    return Deferred;
}());
export { Deferred };
export function getDefaultTplWrapper(name) {
    return function (tpl) { return "<div id=\"".concat(name, "\" data-name=\"").concat(name, "\">").concat(tpl, "</div>"); };
}
// eslint-disable-next-line no-new-func
export var nativeGlobal = new Function('return this')();
var getGlobalAppInstanceMap = once(function () {
    if (!nativeGlobal.hasOwnProperty('__app_instance_name_map__')) {
        Object.defineProperty(nativeGlobal, '__app_instance_name_map__', {
            enumerable: false,
            configurable: true,
            writable: true,
            value: {},
        });
    }
    return nativeGlobal.__app_instance_name_map__;
});
/**
   * Get app instance name with the auto-increment approach
   * @param appName
   */
export var genAppInstanceIdByName = function (appName) {
    var globalAppInstanceMap = getGlobalAppInstanceMap();
    if (!(appName in globalAppInstanceMap)) {
        nativeGlobal.__app_instance_name_map__[appName] = 0;
        return appName;
    }
    globalAppInstanceMap[appName]++;
    return "".concat(appName, "_").concat(globalAppInstanceMap[appName]);
};
export function toArray(array) {
    return Array.isArray(array) ? array : [array];
}
