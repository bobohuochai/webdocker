import { __assign, __awaiter, __generator } from "tslib";
import { importEntry } from 'import-html-entry';
import { concat, isFunction, mergeWith } from 'lodash';
import { createSandboxContainer } from './sandbox/index';
import { Deferred, genAppInstanceIdByName, getDefaultTplWrapper, toArray, } from './utils';
import * as css from './sandbox/css';
import getAddons from './addons';
var rawAppendChild = HTMLElement.prototype.appendChild;
var WebDockerSubAppContainerAttr = '__WEB_DOCKER_APP';
function createElement(appContent, appInstanceId) {
    var containerElement = document.createElement('div');
    containerElement.innerHTML = appContent;
    var appElement = containerElement.firstChild;
    var attr = appElement.getAttribute(css.WebDockerCSSRewriteAttr);
    if (!attr) {
        appElement.setAttribute(css.WebDockerCSSRewriteAttr, appInstanceId);
    }
    var styleNodes = appElement.querySelectorAll('style') || [];
    styleNodes.forEach(function (stylesheetElement) {
        css.process(appElement, stylesheetElement, appInstanceId);
    });
    // FIXME 添加微应用入口
    var subappElement = document.createElement('div');
    subappElement.setAttribute('id', WebDockerSubAppContainerAttr);
    rawAppendChild.call(appElement, subappElement);
    return appElement;
}
function getContainer(container) {
    return typeof container === 'string' ? document.querySelector(container) : container;
}
function render(element, container) {
    var containerElement = getContainer(container);
    if (containerElement && element) {
        rawAppendChild.call(containerElement, element);
    }
}
/** generate app wrapper dom getter */
function getAppWrapperGetter(elementGetter) {
    return function () {
        var element = elementGetter();
        return element === null || element === void 0 ? void 0 : element.querySelector("#".concat(WebDockerSubAppContainerAttr));
    };
}
var prevAppUnmountedDeferred;
function execHooksChain(hooks, app, global) {
    if (global === void 0) { global = window; }
    if (hooks.length) {
        return hooks.reduce(function (chain, hook) { return chain.then(function () { return hook(app, global); }); }, Promise.resolve());
    }
    return Promise.resolve();
}
function validateExportLifecycle(exports) {
    var _a = exports !== null && exports !== void 0 ? exports : {}, mount = _a.mount, unmount = _a.unmount;
    return isFunction(mount) && isFunction(unmount);
}
function getLifecyclesFromExports(scriptExports, appName, global, globalLatestSetProp) {
    if (validateExportLifecycle(scriptExports)) {
        return scriptExports;
    }
    // fallback to sandbox latest set property if it had
    if (globalLatestSetProp) {
        var lifecycles = global[globalLatestSetProp];
        if (validateExportLifecycle(lifecycles)) {
            return lifecycles;
        }
    }
    // fallback to global variable who named with ${appName} while module exports not found
    var globalVariableExports = global[appName];
    if (validateExportLifecycle(globalVariableExports)) {
        return globalVariableExports;
    }
    throw new Error("You need to export lifecycle functions in ".concat(appName, " entry"));
}
export function loadApp(app, 
// eslint-disable-next-line default-param-last
config, lifeCycles) {
    var _a;
    if (config === void 0) { config = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var container, appName, entry, appInstanceId, _b, sandbox, _c, globalContext, _d, execScripts, template, appContent, appElement, appWrapperGetter, mountSandbox, unmountSandbox, global, sandboxContainer, _e, _f, beforeLoad, _g, beforeMount, _h, beforeUnmount, exportMicroApp, _j, mount, unmount, mountFnGetter, unmountFnGetter;
        var _this = this;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    container = app.container, appName = app.name, entry = app.entry;
                    appInstanceId = genAppInstanceIdByName(appName);
                    _b = config.sandbox, sandbox = _b === void 0 ? true : _b, _c = config.globalContext, globalContext = _c === void 0 ? window : _c;
                    return [4 /*yield*/, importEntry(__assign({}, entry))];
                case 1:
                    _d = _k.sent(), execScripts = _d.execScripts, template = _d.template;
                    // as single-spa load and bootstrap new app parallel with other apps unmounting
                    // (see https://github.com/CanopyTax/single-spa/blob/master/src/navigation/reroute.js#L74)
                    // we need wait to load the app until all apps are finishing unmount in singular mode
                    return [4 /*yield*/, (prevAppUnmountedDeferred && prevAppUnmountedDeferred.promise)];
                case 2:
                    // as single-spa load and bootstrap new app parallel with other apps unmounting
                    // (see https://github.com/CanopyTax/single-spa/blob/master/src/navigation/reroute.js#L74)
                    // we need wait to load the app until all apps are finishing unmount in singular mode
                    _k.sent();
                    appContent = getDefaultTplWrapper(appInstanceId)(template);
                    appElement = createElement(appContent, appInstanceId);
                    appWrapperGetter = getAppWrapperGetter(function () { return appElement; });
                    // 第一次加载设置应用可见区域 dom 结构
                    // 确保每次应用加载前容器 dom 结构已经设置完毕
                    render(appElement, container);
                    mountSandbox = function () { return Promise.resolve(); };
                    unmountSandbox = function () { return Promise.resolve(); };
                    global = globalContext;
                    if (sandbox) {
                        sandboxContainer = createSandboxContainer(appName);
                        mountSandbox = sandboxContainer.mount;
                        unmountSandbox = sandboxContainer.unmount;
                        // 用沙箱的代理对象作为接下来使用的全局对象
                        global = sandboxContainer.instance.proxy;
                    }
                    _e = mergeWith({}, getAddons(global), lifeCycles, function (v1, v2) { return concat(v1 !== null && v1 !== void 0 ? v1 : [], v2 !== null && v2 !== void 0 ? v2 : []); }), _f = _e.beforeLoad, beforeLoad = _f === void 0 ? [] : _f, _g = _e.beforeMount, beforeMount = _g === void 0 ? [] : _g, _h = _e.beforeUnmount, beforeUnmount = _h === void 0 ? [] : _h;
                    return [4 /*yield*/, execHooksChain(toArray(beforeLoad), app, global)];
                case 3:
                    _k.sent();
                    return [4 /*yield*/, execScripts(global, true).catch(function (err) {
                            console.warn(err);
                        })];
                case 4:
                    exportMicroApp = _k.sent();
                    console.log('export micro app', exportMicroApp);
                    _j = getLifecyclesFromExports(exportMicroApp, appName, global, (_a = sandboxContainer === null || sandboxContainer === void 0 ? void 0 : sandboxContainer.instance) === null || _a === void 0 ? void 0 : _a.latestSetProp), mount = _j.mount, unmount = _j.unmount;
                    mountFnGetter = function () {
                        var mountFn = [
                            mountSandbox,
                            function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, execHooksChain(toArray(beforeMount), app, global)];
                            }); }); },
                            function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    mount({ container: appWrapperGetter() });
                                    return [2 /*return*/];
                                });
                            }); },
                            // initialize the unmount defer after app mounted and resolve the defer after it unmounted
                            function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    prevAppUnmountedDeferred = new Deferred();
                                    return [2 /*return*/];
                                });
                            }); }
                        ];
                        return function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, execHooksChain(mountFn, app, global)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/, Promise.resolve()];
                                }
                            });
                        }); };
                    };
                    unmountFnGetter = function () {
                        var unmountFn = [
                            function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, execHooksChain(toArray(beforeUnmount), app, global)];
                            }); }); },
                            function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, unmount({ container: appWrapperGetter() })];
                            }); }); },
                            unmountSandbox,
                            function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    if (prevAppUnmountedDeferred) {
                                        prevAppUnmountedDeferred.resolve();
                                    }
                                    return [2 /*return*/];
                                });
                            }); },
                        ];
                        return function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, execHooksChain(unmountFn, app, global)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/, Promise.resolve()];
                                }
                            });
                        }); };
                    };
                    return [2 /*return*/, {
                            name: appInstanceId,
                            mount: mountFnGetter(),
                            unmount: unmountFnGetter(),
                        }];
            }
        });
    });
}