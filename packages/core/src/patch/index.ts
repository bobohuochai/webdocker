import { FrameworkConfiguration, SandBox } from '../interface';
import patchInterval from './interval';
import patchWindowListener from './windowListener';
import patchBodyAppendChild from './bodyAppendChild';
import { patchSandbox } from './dynamic';

export function patchAtMounting(
  appName:string,
  elementGetter:()=>HTMLElement,
  sandbox:SandBox,
  config:FrameworkConfiguration,
) {
  const { dynamicPatch = true, globalComponentClassPatch = true } = config;
  let patchers:any[] = [];
  patchers = [() => patchInterval(sandbox.proxy), () => patchWindowListener(sandbox.proxy),
  ];

  if (globalComponentClassPatch) {
    patchers = [...patchers, () => patchBodyAppendChild(appName, globalComponentClassPatch)];
  }

  if (dynamicPatch) {
    patchers = [...patchers, () => patchSandbox(appName, elementGetter, sandbox, true)];
  }
  return patchers.map((patch) => patch());
}
