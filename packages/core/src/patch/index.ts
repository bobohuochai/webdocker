import { SandBox } from '../interface';
import patchInterval from './interval';
import patchWindowListener from './windowListener';

export function patchAtMounting(sandbox:SandBox) {
  const patchers = [() => patchInterval(sandbox.proxy), () => patchWindowListener(sandbox.proxy)];
  return patchers.map((patch) => patch());
}
