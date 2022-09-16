import { getTargetValue } from '../common';
/*
 variables who are impossible to be overwrite need to be escaped from proxy sandbox for performance reasons
 */
var unscopables = {
    undefined: true,
    Array: true,
    Object: true,
    String: true,
    Boolean: true,
    Math: true,
    Number: true,
    Symbol: true,
    parseFloat: true,
    Float32Array: true,
    isNaN: true,
    Infinity: true,
    Reflect: true,
    Float64Array: true,
    Function: true,
    Map: true,
    NaN: true,
    Promise: true,
    Proxy: true,
    Set: true,
    parseInt: true,
    requestAnimationFrame: true,
};
// 直接修改window 对象
var variableWhiteList = [
    // FIXME System.js used a indirect call with eval, which would make it scope escape to global
    // To make System.js works well, we write it back to global window temporary
    // see https://github.com/systemjs/systemjs/blob/457f5b7e8af6bd120a279540477552a07d5de086/src/evaluate.js#L106
    'System',
    // see https://github.com/systemjs/systemjs/blob/457f5b7e8af6bd120a279540477552a07d5de086/src/instantiate.js#L357
    '__cjsWrapper',
    // for react hot reload
    // see https://github.com/facebook/create-react-app/blob/66bf7dfc43350249e2f09d138a20840dae8a0a4a/packages/react-error-overlay/src/index.js#L180
    '__REACT_ERROR_OVERLAY_GLOBAL_HOOK__',
];
// fakeWindow 和 rawWindow 相互独立的属性
// 微应用中类似写法window.Vue直接读取fakeWindow,不会读取rawWindow
var variableBlackList = ['Vue', 'browerCollector'];
/**
 * fastest(at most time) unique array method
 * @see https://jsperf.com/array-filter-unique/30
 */
function uniq(array) {
    return array.filter(function filter(element) {
        return element in this ? false : (this[element] = true);
    }, Object.create(null));
}
function createFakeWindow(global) {
    var propertiesWithGetter = new Map();
    var fakeWindow = {};
    Object.getOwnPropertyNames(global).filter(function (p) {
        var descriptor = Object.getOwnPropertyDescriptor(global, p);
        return !(descriptor === null || descriptor === void 0 ? void 0 : descriptor.configurable);
    }).forEach(function (p) {
        var descriptor = Object.getOwnPropertyDescriptor(global, p);
        if (descriptor) {
            var hasGetter = Object.prototype.hasOwnProperty.call(descriptor, 'get');
            if (p === 'top'
                || p === 'parent'
                || p === 'self'
                || p === 'window') {
                descriptor.configurable = true;
                if (!hasGetter) {
                    descriptor.writable = true;
                }
            }
            if (hasGetter)
                propertiesWithGetter.set(p, true);
            Object.defineProperty(fakeWindow, p, Object.freeze(descriptor));
        }
    });
    return { fakeWindow: fakeWindow, propertiesWithGetter: propertiesWithGetter };
}
// 全局变量，记录沙箱激活的数量
// eslint-disable-next-line
var activeSandboxCount = 0;
var ProxySandbox = /** @class */ (function () {
    function ProxySandbox(name, globalContext) {
        if (globalContext === void 0) { globalContext = window; }
        var _this = this;
        this.updatedValueSet = new Set();
        this.sandboxRunning = true;
        // 最后设置的props
        this.latestSetProp = null;
        this.name = name;
        var updatedValueSet = this.updatedValueSet;
        this.globalContext = globalContext;
        // 通过createFakeWindow创建一个fakeWindow对象
        var _a = createFakeWindow(globalContext), fakeWindow = _a.fakeWindow, propertiesWithGetter = _a.propertiesWithGetter;
        var descriptorTargetMap = new Map();
        var hasOwnProperty = function (key) { return fakeWindow.hasOwnProperty(key) || globalContext.hasOwnProperty(key); };
        var proxy = new Proxy(fakeWindow, {
            set: function (target, p, value) {
                if (_this.sandboxRunning) {
                    // 判断window上有该属性，并获取到属性的 writable, configurable, enumerable等值。
                    if (!target.hasOwnProperty(p) && globalContext.hasOwnProperty(p)) {
                        var descriptor = Object.getOwnPropertyDescriptor(globalContext, p);
                        var _a = descriptor, writable = _a.writable, configurable = _a.configurable, enumerable = _a.enumerable;
                        if (writable) {
                            // 通过defineProperty把值复制到代理对象上，
                            Object.defineProperty(target, p, {
                                configurable: configurable,
                                enumerable: enumerable,
                                writable: writable,
                                value: value,
                            });
                        }
                    }
                    else {
                        // window上没有属性，支持设置值
                        // eslint-disable-next-line no-param-reassign
                        target[p] = value;
                    }
                    if (variableWhiteList.indexOf(p) !== -1) {
                        // eslint-disable-next-line no-param-reassign
                        globalContext[p] = value;
                    }
                    // 记录变更记录
                    updatedValueSet.add(p);
                    _this.latestSetProp = p;
                    return true;
                }
                // 在 strict-mode 下，Proxy 的 handler.set 返回 false 会抛出 TypeError，在沙箱卸载的情况下应该忽略错误
                return true;
            },
            get: function (target, p) {
                // todo Vue ，browerCollector 和宿主应用独立
                if (variableBlackList.indexOf(p) !== -1)
                    return target[p];
                if (p === Symbol.unscopables)
                    return unscopables;
                // 判断用window.top, window.parent等也返回代理对象，在ifream环境也会返回代理对象。做到了真正的隔离，
                if (p === 'window' || p === 'self') {
                    return proxy;
                }
                if (p === 'globalThis') {
                    return proxy;
                }
                if (p === 'top'
                    || p === 'parent') {
                    if (globalContext === globalContext.parent) {
                        return proxy;
                    }
                    return globalContext[p];
                }
                // hasOwnProperty的值表示为globalContext.hasOwnProperty
                if (p === 'hasOwnProperty') {
                    return hasOwnProperty;
                }
                if (p === 'document') {
                    return document;
                }
                if (p === 'eval') {
                    return eval;
                }
                // 返回当前值
                // eslint-disable-next-line no-nested-ternary
                var value = propertiesWithGetter.has(p)
                    ? globalContext[p]
                    : p in target
                        ? target[p]
                        : globalContext[p];
                return getTargetValue(globalContext, value);
            },
            // trap in operator
            // see https://github.com/styled-components/styled-components/blob/master/packages/styled-components/src/constants.js#L12
            has: function (target, p) {
                return p in target || p in globalContext;
            },
            getOwnPropertyDescriptor: function (target, p) {
                /*
                 as the descriptor of top/self/window/mockTop in raw window are configurable but not in proxy target, we need to get it from target to avoid TypeError
                 see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getOwnPropertyDescriptor
                 > A property cannot be reported as non-configurable, if it does not exists as an own property of the target object or if it exists as a configurable own property of the target object.
                 */
                if (target.hasOwnProperty(p)) {
                    var descriptor = Object.getOwnPropertyDescriptor(target, p);
                    descriptorTargetMap.set(p, 'target');
                    return descriptor;
                }
                if (globalContext.hasOwnProperty(p)) {
                    var descriptor = Object.getOwnPropertyDescriptor(globalContext, p);
                    descriptorTargetMap.set(p, 'globalContext');
                    // A property cannot be reported as non-configurable, if it does not exists as an own property of the target object
                    if (descriptor && !descriptor.configurable) {
                        descriptor.configurable = true;
                    }
                    return descriptor;
                }
                return undefined;
            },
            // trap to support iterator with sandbox
            ownKeys: function (target) {
                return uniq(Reflect.ownKeys(globalContext).concat(Reflect.ownKeys(target)));
            },
            defineProperty: function (target, p, attributes) {
                var from = descriptorTargetMap.get(p);
                /*
                 Descriptor must be defined to native window while it comes from native window via Object.getOwnPropertyDescriptor(window, p),
                 otherwise it would cause a TypeError with illegal invocation.
                 */
                switch (from) {
                    case 'globalContext':
                        return Reflect.defineProperty(globalContext, p, attributes);
                    default:
                        return Reflect.defineProperty(target, p, attributes);
                }
            },
            deleteProperty: function (target, p) {
                if (target.hasOwnProperty(p)) {
                    // eslint-disable-next-line no-param-reassign
                    delete target[p];
                    updatedValueSet.delete(p);
                    return true;
                }
                return true;
            },
            // makes sure `window instanceof Window` returns truthy in micro app
            getPrototypeOf: function () {
                return Reflect.getPrototypeOf(globalContext);
            },
        });
        this.proxy = proxy;
        activeSandboxCount++;
    }
    ProxySandbox.prototype.active = function () {
        if (!this.sandboxRunning)
            activeSandboxCount++;
        this.sandboxRunning = true;
    };
    ProxySandbox.prototype.inactive = function () {
        var _this = this;
        if (--activeSandboxCount === 0) {
            variableWhiteList.forEach(function (p) {
                if (_this.proxy.hasOwnProperty(p)) {
                    delete _this.globalContext[p];
                }
            });
        }
        this.sandboxRunning = false;
    };
    return ProxySandbox;
}());
export default ProxySandbox;
