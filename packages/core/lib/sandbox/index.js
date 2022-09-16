import { __awaiter, __generator, __read, __spreadArray } from "tslib";
import ProxySandbox from './proxySandbox';
import { patchAtMounting } from '../patch';
export function createSandboxContainer(appName, globalContext) {
    var sandbox = new ProxySandbox(appName, globalContext);
    var mountingFreers = [];
    return {
        instance: sandbox,
        mount: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    sandbox.active();
                    /* ------------------------------------------ 2. 开启全局变量补丁 ------------------------------------------*/
                    // render 沙箱启动时开始劫持各类全局监听，尽量不要在应用初始化阶段有 事件监听/定时器 等副作用
                    mountingFreers = patchAtMounting(sandbox);
                    return [2 /*return*/];
                });
            });
        },
        /**
         * 恢复 global 状态，使其能回到应用加载之前的状态
         */
        unmount: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    __spreadArray([], __read(mountingFreers), false).map(function (free) { return free(); });
                    sandbox.inactive();
                    return [2 /*return*/];
                });
            });
        },
    };
}
