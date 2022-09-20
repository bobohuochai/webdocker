import { __assign } from "tslib";
export function isBoundedFunction(fn) {
    return fn.name.indexOf('bound ') === 0 && !fn.hasOwnProperty('prototype');
}
/**
 * in safari
 * typeof document.all === 'undefined' // true
 * typeof document.all === 'function' // true
 * We need to discriminate safari for better performance
 */
var naughtySafari = typeof document.all === 'function' && typeof document.all === 'undefined';
export var isCallable = function (fn) { return naughtySafari ? typeof fn === 'function' && typeof fn !== 'undefined' : typeof fn === 'function'; };
export function isConstructable(fn) {
    // prototype methods might be changed while code running, so we need check it every time
    var hasPrototypeMethods = fn.prototype && fn.prototype.constructor === fn
        && Object.getOwnPropertyNames(fn.prototype).length > 1;
    if (hasPrototypeMethods)
        return true;
    /*
      1. 有 prototype 并且 prototype 上有定义一系列非 constructor 属性
      2. 函数名大写开头
      3. class 函数
      满足其一则可认定为构造函数
     */
    var constructable = hasPrototypeMethods;
    if (!constructable) {
        // fn.toString has a significant performance overhead, if hasPrototypeMethods check not passed, we will check the function string with regex
        var fnString = fn.toString();
        var constructableFunctionRegex = /^function\b\s[A-Z].*/;
        var classRegex = /^class\b/;
        constructable = constructableFunctionRegex.test(fnString) || classRegex.test(fnString);
    }
    return constructable;
}
var functionBoundedValueMap = new WeakMap();
export function getTargetValue(target, value) {
    /*
      仅绑定 isCallable && !isBoundedFunction && !isConstructable 的函数对象，如 window.console、window.atob 这类，不然微应用中调用时会抛出 Illegal invocation 异常
      目前没有完美的检测方式，这里通过 prototype 中是否还有可枚举的拓展方法的方式来判断
      @warning 这里不要随意替换成别的判断方式，因为可能触发一些 edge case（比如在 lodash.isFunction 在 iframe 上下文中可能由于调用了 top window 对象触发的安全异常）
     */
    if (isCallable(value) && !isBoundedFunction(value) && !isConstructable(value)) {
        var cachedBoundFunction = functionBoundedValueMap.get(value);
        if (cachedBoundFunction) {
            return cachedBoundFunction;
        }
        var boundValue = Function.prototype.bind.call(value, target);
        // some callable function has custom fields, we need to copy the enumerable props to boundValue. such as moment function.
        // use for..in rather than Object.keys.forEach for performance reason
        // eslint-disable-next-line guard-for-in,no-restricted-syntax
        for (var key in value) {
            boundValue[key] = value[key];
        }
        // copy prototype if bound function not have but target one have
        // as prototype is non-enumerable mostly, we need to copy it from target function manually
        if (value.hasOwnProperty('prototype') && !boundValue.hasOwnProperty('prototype')) {
            // we should not use assignment operator to set boundValue prototype like `boundValue.prototype = value.prototype`
            // as the assignment will also look up prototype chain while it hasn't own prototype property,
            // when the lookup succeed, the assignment will throw an TypeError like `Cannot assign to read only property 'prototype' of function` if its descriptor configured with writable false or just have a getter accessor
            // see https://github.com/umijs/qiankun/issues/1121
            Object.defineProperty(boundValue, 'prototype', { value: value.prototype, enumerable: false, writable: true });
        }
        // Some util, like `function isNative() {  return typeof Ctor === 'function' && /native code/.test(Ctor.toString()) }` relies on the original `toString()` result
        // but bound functions will always return "function() {[native code]}" for `toString`, which is misleading
        if (typeof value.toString === 'function') {
            var valueHasInstanceToString = value.hasOwnProperty('toString') && !boundValue.hasOwnProperty('toString');
            var boundValueHasPrototypeToString = boundValue.toString === Function.prototype.toString;
            if (valueHasInstanceToString || boundValueHasPrototypeToString) {
                var originToStringDescriptor = Object.getOwnPropertyDescriptor(valueHasInstanceToString ? value : Function.prototype, 'toString');
                Object.defineProperty(boundValue, 'toString', __assign(__assign({}, originToStringDescriptor), ((originToStringDescriptor === null || originToStringDescriptor === void 0 ? void 0 : originToStringDescriptor.get) ? null : { value: function () { return value.toString(); } })));
            }
        }
        functionBoundedValueMap.set(value, boundValue);
        return boundValue;
    }
    return value;
}
