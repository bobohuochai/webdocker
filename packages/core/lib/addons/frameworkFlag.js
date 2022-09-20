import { __awaiter, __generator } from "tslib";
export default function getAddOn(global) {
    return {
        beforeLoad: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    global.__POWERED_BY_WEBDOCKER__ = true;
                    return [2 /*return*/];
                });
            });
        },
        beforeMount: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    global.__POWERED_BY_WEBDOCKER__ = true;
                    return [2 /*return*/];
                });
            });
        },
        beforeUnmount: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    global.__POWERED_BY_WEBDOCKER__ = false;
                    return [2 /*return*/];
                });
            });
        },
    };
}
