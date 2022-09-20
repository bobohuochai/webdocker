import patchInterval from './interval';
import patchWindowListener from './windowListener';
export function patchAtMounting(sandbox) {
    var patchers = [function () { return patchInterval(sandbox.proxy); }, function () { return patchWindowListener(sandbox.proxy); }];
    return patchers.map(function (patch) { return patch(); });
}
