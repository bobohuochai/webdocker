/* eslint-disable no-param-reassign */
import { __read, __spreadArray } from "tslib";
import { noop } from 'lodash';
var rawWindowAddListener = window.addEventListener;
var rawWindowRemoveListener = window.removeEventListener;
export default function patch(global) {
    var listenerMap = new Map();
    global.addEventListener = function (type, listener, options) {
        var listeners = listenerMap.get(type) || [];
        listenerMap.set(type, __spreadArray(__spreadArray([], __read(listeners), false), [listener], false));
        return rawWindowAddListener.call(window, type, listener, options);
    };
    global.removeEventListener = function (type, listener, options) {
        var storedListeners = listenerMap.get(type);
        if (storedListeners && storedListeners.length && storedListeners.indexOf(listener) !== -1) {
            storedListeners.splice(storedListeners.indexOf(listener), 1);
        }
        return rawWindowRemoveListener.call(window, type, listener, options);
    };
    return function free() {
        listenerMap.forEach(function (listeners, type) {
            __spreadArray([], __read(listeners), false).forEach(function (listener) { global.removeEventListener(type, listener); });
        });
        global.addEventListener = rawWindowAddListener;
        global.removeEventListener = rawWindowRemoveListener;
        return noop;
    };
}
