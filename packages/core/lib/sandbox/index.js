import { __awaiter, __generator } from "tslib";
import ProxySandbox from './proxySandbox';
export function createSandboxContainer(appName, globalContext) {
    var sandbox = new ProxySandbox(appName, globalContext);
    return {
        instance: sandbox,
        mount: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    sandbox.active();
                    return [2 /*return*/];
                });
            });
        },
        unmount: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    sandbox.inactive();
                    return [2 /*return*/];
                });
            });
        },
    };
}
