import { noop } from 'lodash';
import { patchHTMLDynamicAppendPrototypeFunctions } from './common';

let mountingPatchCount = 0;

/**
 * todo dynamic style element process
 *
 * Just hijack dynamic head append, that could avoid accidentally hijacking the insertion of elements except in head.
 * Such a case: ReactDOM.createPortal(<style>.test{color:blue}</style>, container),
 * this could made we append the style element into app wrapper but it will cause an error while the react portal unmounting, as ReactDOM could not find the style in body children list.
 */
export function patchLooseSandbox(
  appName:string,
  appWrapperGetter:()=>HTMLElement,
  proxy:Window,
  mounting = true,
) {
  const unpatchDynamicAppendPrototypeFunctions = patchHTMLDynamicAppendPrototypeFunctions(
    // todo 确认当前微应用是否激活
    () => true,
    () => ({
      appName,
      appWrapperGetter,
      proxy,
      dynamicStyleSheetElements: [],
    }),
  );
  // todo bootstrap patch
  if (mounting) mountingPatchCount++;

  return function free() {
    if (mounting) mountingPatchCount--;
    const allMicroAppUnmounted = mountingPatchCount === 0;
    if (allMicroAppUnmounted) unpatchDynamicAppendPrototypeFunctions();
    return noop;
  };
}
