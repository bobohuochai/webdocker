import { __awaiter } from "tslib";
import ProxySandbox from './proxySandbox';
export function createSandboxContainer(appName, globalContext) {
    const sandbox = new ProxySandbox(appName, globalContext);
    return {
        instance: sandbox,
        mount() {
            return __awaiter(this, void 0, void 0, function* () {
                sandbox.active();
            });
        },
        unmount() {
            return __awaiter(this, void 0, void 0, function* () {
                sandbox.inactive();
            });
        },
    };
}
