import { noop } from 'lodash';
import { SandBox } from '../../interface';

import { patchHTMLDynamicAppendPrototypeFunctions } from './common';

const appsPatchCounter = new Map<string, number>();

function calcAppCounter(appName:string, calcType:'increase'|'decrease') {
  let appCounter = appsPatchCounter.get(appName) || 0;
  switch (calcType) {
    case 'increase':
      appCounter++;
      break;
    case 'decrease':
      if (appCounter > 0) {
        appCounter--;
      }
      break;
    default:
      break;
  }
  appsPatchCounter.set(appName, appCounter);
}

/**
 * Just hijack dynamic head append, that could avoid accidentally hijacking the insertion of elements except in head.
 * Such a case: ReactDOM.createPortal(<style>.test{color:blue}</style>, container),
 * this could made we append the style element into app wrapper but it will cause an error while the react portal unmounting, as ReactDOM could not find the style in body children list.
 */
export function patchSandbox(
  appName:string,
  appWrapperGetter:()=>HTMLElement,
  sandbox:SandBox,
  mounting = true,
) {
  const unpatchDynamicAppendPrototypeFunctions = patchHTMLDynamicAppendPrototypeFunctions(
    (element) => (element as any)._evalScriptInSandbox,
    () => ({
      appName,
      appWrapperGetter,
      sandbox,
      dynamicStyleSheetElements: [],
    }),
  );
  // todo bootstrap patch
  if (mounting) calcAppCounter(appName, 'increase');

  return function free() {
    if (mounting) calcAppCounter(appName, 'decrease');
    const allMicroAppUnmounted = Array.from(appsPatchCounter.entries()).every(([, counter]) => counter === 0);
    if (allMicroAppUnmounted) {
      unpatchDynamicAppendPrototypeFunctions();
    }
    return noop;
  };
}
