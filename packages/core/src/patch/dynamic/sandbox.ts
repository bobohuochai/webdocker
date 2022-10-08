import { noop } from 'lodash';
import { getCurrentRunningApp, nativeGlobal } from '../../utils';
import { isHijackingTag, patchHTMLDynamicAppendPrototypeFunctions } from './common';
import type { ContainerConfig } from '../../interface';

// Get native global window with a sandbox disgusted way, thus we could share it between qiankun instances🤪
Object.defineProperty(nativeGlobal, '__proxyAttachContainerConfigMap__', { enumerable: false, writable: true });

// Share proxyAttachContainerConfigMap between multiple qiankun instance, thus they could access the same record
nativeGlobal.__proxyAttachContainerConfigMap__ = nativeGlobal.__proxyAttachContainerConfigMap__
|| new WeakMap<WindowProxy, ContainerConfig>();
const proxyAttachContainerConfigMap:
WeakMap<WindowProxy, ContainerConfig> = nativeGlobal.__proxyAttachContainerConfigMap__;

const docCreatePatchedMap = new WeakMap<typeof document.createElement, typeof document.createElement>();
const elementAttachContainerConfigMap = new WeakMap<HTMLElement, ContainerConfig>();
function patchDocumentCreateElement() {
  const docCreateElementFnBeforeOverwrite = docCreatePatchedMap.get(document.createElement);
  if (!docCreateElementFnBeforeOverwrite) {
    const rawDocumentCreateElement = document.createElement;
    Document.prototype.createElement = function createElement<K extends keyof HTMLElementTagNameMap>(
      this:Document,
      tagName:K,
      options?:ElementCreationOptions,
    ) {
      const element = rawDocumentCreateElement.call(this, tagName, options);
      if (isHijackingTag(tagName)) {
        const currentRunningApp = getCurrentRunningApp();
        let currentRunningSandboxProxy = null;
        if (currentRunningApp) {
          currentRunningSandboxProxy = currentRunningApp.window;
        }
        // FIXME 判断是否离开微应用生命周期
        if (currentRunningSandboxProxy) {
          const proxyContainerConfig = proxyAttachContainerConfigMap.get(currentRunningSandboxProxy);
          if (proxyContainerConfig) {
            console.log('create element overwrite', element);
            elementAttachContainerConfigMap.set(element, proxyContainerConfig);
          }
        }
      }
      return element;
    };
    // It means it have been overwritten while createElement is an own property of document
    // 主应用覆盖了document.createElement方法
    if (document.hasOwnProperty('createElement')) {
      document.createElement = Document.prototype.createElement;
    }
    docCreatePatchedMap.set(Document.prototype.createElement, rawDocumentCreateElement);
  }
  return function unpatch() {
    if (docCreateElementFnBeforeOverwrite) {
      Document.prototype.createElement = docCreateElementFnBeforeOverwrite;
      document.createElement = docCreateElementFnBeforeOverwrite;
    }
  };
}

const appsPatchCounter = new Map<string, number>();

function calcAppCounter(appName:string, calcType:'increase'|'decrease') {
  let appCounter = appsPatchCounter.get(appName) || 0;
  switch (calcType) {
    case 'increase':
      appCounter++;
      break;
    case 'decrease':
      if (appCounter > 0) {
        console.log('test', appName, appCounter);
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
  proxy:Window,
  mounting = true,
) {
  let containerConfig = proxyAttachContainerConfigMap.get(proxy);
  if (!containerConfig) {
    containerConfig = {
      appName,
      proxy,
      appWrapperGetter,
      dynamicStyleSheetElements: [],
    };
    proxyAttachContainerConfigMap.set(proxy, containerConfig);
  }
  const unpatchDocumentCreate = patchDocumentCreateElement();

  const unpatchDynamicAppendPrototypeFunctions = patchHTMLDynamicAppendPrototypeFunctions(
    (element) => elementAttachContainerConfigMap.has(element),
    () => ({
      appName,
      appWrapperGetter,
      proxy,
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
      unpatchDocumentCreate();
    }
    return noop;
  };
}
