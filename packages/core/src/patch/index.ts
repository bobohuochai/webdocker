import { SandBox } from '../interface';
import patchInterval from './interval';
import patchWindowListener from './windowListener';
import { patchLooseSandbox } from './dynamic';

export function patchAtMounting(appName:string, elementGetter:()=>HTMLElement, sandbox:SandBox) {
  const patchers = [() => patchInterval(sandbox.proxy), () => patchWindowListener(sandbox.proxy),
    () => patchLooseSandbox(appName, elementGetter, sandbox.proxy, true)];
  return patchers.map((patch) => patch());
}
