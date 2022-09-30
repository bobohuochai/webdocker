import { FrameworkConfiguration, SandBox } from '../interface';
import patchInterval from './interval';
import patchWindowListener from './windowListener';
import { patchSandbox } from './dynamic';

export function patchAtMounting(
  appName:string,
  elementGetter:()=>HTMLElement,
  sandbox:SandBox,
  config:FrameworkConfiguration,
) {
  let patchers = [() => patchInterval(sandbox.proxy), () => patchWindowListener(sandbox.proxy)];
  if (config.dynamicPatch) {
    patchers = [...patchers, () => patchSandbox(appName, elementGetter, sandbox.proxy, true)];
  }
  return patchers.map((patch) => patch());
}
