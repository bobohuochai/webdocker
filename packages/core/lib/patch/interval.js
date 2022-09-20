/* eslint-disable no-param-reassign */
import { __read, __spreadArray } from "tslib";
import { noop } from 'lodash';
var rawWindowInterval = window.setInterval;
var rawWindowClearInterval = window.clearInterval;
export default function patch(global) {
    var intervalIds = [];
    global.clearInterval = function (intervalId) {
        intervalIds = intervalIds.filter(function (id) { return id !== intervalId; });
        return rawWindowClearInterval.call(window, intervalId);
    };
    global.setInterval = function (handler, timeout) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        /**
         * Passing the 'this' object with .call won't work
         * because this will change the value of this inside setTimeout itself
         * while we want to change the value of this inside myArray.myMethod.
         * In fact, it will be an error because setTimeout code expects this to be the window object:
         * https://developer.mozilla.org/en-US/docs/Web/API/setInterval
         */
        var intervalId = rawWindowInterval.apply(void 0, __spreadArray([handler, timeout], __read(args), false));
        intervalIds = __spreadArray(__spreadArray([], __read(intervalIds), false), [intervalId], false);
        return intervalId;
    };
    return function free() {
        intervalIds.forEach(function (id) { return global.clearInterval(id); });
        global.clearInterval = rawWindowClearInterval;
        global.setInterval = rawWindowInterval;
        return noop;
    };
}
