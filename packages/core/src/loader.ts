import { importEntry } from 'import-html-entry';
import { concat, isFunction, mergeWith } from 'lodash';
import { createSandboxContainer } from './sandbox/index';
import { createIframeContainer } from './frame/index';
import {
  LoadableApp, FrameworkConfiguration, FrameworkLifecycles, LifecycleFn, AppLifecycles,
} from './interface';
import {
  Deferred, genAppInstanceIdByName, getDefaultTplWrapper, toArray,
} from './utils';
import * as css from './sandbox/css';
import getAddons from './addons';
import { lexicalGlobals } from './common';

const rawAppendChild = HTMLElement.prototype.appendChild;

const WebDockerSubAppContainerAttr = '__WEB_DOCKER_APP';

function createElement(appContent:string, appInstanceId:string) {
  const containerElement = document.createElement('div');
  containerElement.innerHTML = appContent;
  const appElement = containerElement.firstChild as HTMLElement;
  const attr = appElement.getAttribute(css.WebDockerCSSRewriteAttr);
  if (!attr) {
    appElement.setAttribute(css.WebDockerCSSRewriteAttr, appInstanceId);
  }

  const styleNodes = appElement.querySelectorAll('style') || [];
  styleNodes.forEach((stylesheetElement: HTMLStyleElement) => {
    css.process(appElement!, stylesheetElement, appInstanceId);
  });

  // FIXME 添加微应用入口
  const subappElement = document.createElement('div');
  subappElement.setAttribute('id', WebDockerSubAppContainerAttr);
  rawAppendChild.call(appElement, subappElement);
  return appElement;
}

function getContainer(container:string|HTMLElement):HTMLElement|null {
  return typeof container === 'string' ? document.querySelector(container) : container;
}

function render(element:HTMLElement, container: string| HTMLElement) {
  const containerElement = getContainer(container);
  if (containerElement && element) {
    rawAppendChild.call(containerElement, element);
  }
}

/** generate app wrapper dom getter */
function getAppWrapperGetter(
  elementGetter: () => HTMLElement | null,
) {
  return () => {
    const element = elementGetter();
    if (!element) {
      throw new Error('element not existed!');
    }
    const appElement = element.querySelector(`#${WebDockerSubAppContainerAttr}`) as HTMLElement;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return appElement!;
  };
}

let prevAppUnmountedDeferred: Deferred<void>;

function execHooksChain<T extends Record<string, any>>(
  hooks:Array<LifecycleFn<T>>,
  app:LoadableApp<T>,
  global = window,
) {
  if (hooks.length) {
    return hooks.reduce((chain, hook) => chain.then(() => hook(app, global)), Promise.resolve());
  }
  return Promise.resolve();
}

function validateExportLifecycle(exports:any) {
  const { mount, unmount } = exports ?? {};
  return isFunction(mount) && isFunction(unmount);
}

function getLifecyclesFromExports(
  scriptExports:AppLifecycles<any>,
  appName:string,
  global:WindowProxy,
  globalLatestSetProp?: PropertyKey | null,
) {
  if (validateExportLifecycle(scriptExports)) {
    return scriptExports;
  }
  // fallback to sandbox latest set property if it had
  if (globalLatestSetProp) {
    const lifecycles = (<any>global)[globalLatestSetProp];
    if (validateExportLifecycle(lifecycles)) {
      return lifecycles;
    }
  }

  // fallback to global variable who named with ${appName} while module exports not found
  const globalVariableExports = (global as any)[appName];

  if (validateExportLifecycle(globalVariableExports)) {
    return globalVariableExports;
  }

  throw new Error(`You need to export lifecycle functions in ${appName} entry`);
}

export async function loadApp<T>(
  app:LoadableApp<T>,
  // eslint-disable-next-line default-param-last
  config:FrameworkConfiguration = { dynamicPatch: true },
  lifeCycles?:FrameworkLifecycles<T>,
) {
  const {
    container, name: appName, entry, initialPath = '/',
  } = app;
  const appInstanceId = genAppInstanceIdByName(appName);

  const { sandbox = true, globalContext = window } = config;

  // https://github.com/kuitos/import-html-entry
  const { execScripts, template } = await importEntry({
    ...entry,
  });

  // as single-spa load and bootstrap new app parallel with other apps unmounting
  // (see https://github.com/CanopyTax/single-spa/blob/master/src/navigation/reroute.js#L74)
  // we need wait to load the app until all apps are finishing unmount in singular mode
  await (prevAppUnmountedDeferred && prevAppUnmountedDeferred.promise);
  const appContent = getDefaultTplWrapper(appInstanceId)(template);
  const appElement = createElement(appContent, appInstanceId);
  const appWrapperGetter = getAppWrapperGetter(() => appElement);
  // 第一次加载设置应用可见区域 dom 结构
  // 确保每次应用加载前容器 dom 结构已经设置完毕
  render(appElement, container);

  // 初始化沙箱
  let mountSandbox = () => Promise.resolve();
  let unmountSandbox = () => Promise.resolve();
  let global = globalContext;
  let sandboxContainer;
  const isIframeIsolation = typeof sandbox === 'object' && !!sandbox.iframe;
  if (sandbox) {
    if (isIframeIsolation) {
      sandboxContainer = await createIframeContainer(appInstanceId, () => appElement, config);
      const currentContext = sandboxContainer.instance;
      // update iframe location path
      currentContext.history.replaceState(null, '', initialPath);
      // update iframe context body
      currentContext.updateBody(document.body);
    } else {
      sandboxContainer = createSandboxContainer(appInstanceId, () => appElement, config, global);
    }
    mountSandbox = sandboxContainer.mount;
    unmountSandbox = sandboxContainer.unmount;
    // 用沙箱的代理对象作为接下来使用的全局对象
    global = sandboxContainer.instance.proxy as typeof window;
  }

  const { beforeLoad = [], beforeMount = [], beforeUnmount = [] } = mergeWith(
    {},
    getAddons(global),
    lifeCycles,
    (v1, v2) => concat(v1 ?? [], v2 ?? []),
  );

  await execHooksChain(toArray(beforeLoad), app, global);

  const exportMicroApp = await execScripts(
    global,
    true,
    {
      scopedGlobalVariables: lexicalGlobals,
    },
  );
  console.log('export micro app', exportMicroApp);
  const { mount, unmount } = getLifecyclesFromExports(
    exportMicroApp as AppLifecycles<T>,
    appName,
    global,
    sandboxContainer?.instance?.latestSetProp,
  );

  const mountFnGetter = () => {
    const mountFn = [
      mountSandbox,
      async () => execHooksChain(toArray(beforeMount), app, global),
      async () => {
        mount({ container: appWrapperGetter() });
      },
      // initialize the unmount defer after app mounted and resolve the defer after it unmounted
      async () => {
        prevAppUnmountedDeferred = new Deferred<void>();
      }];
    return async () => {
      await execHooksChain(mountFn, app, global);
      return Promise.resolve();
    };
  };

  const unmountFnGetter = () => {
    const unmountFn = [
      async () => execHooksChain(toArray(beforeUnmount), app, global),
      async () => unmount({ container: appWrapperGetter() }),
      unmountSandbox,
      async () => {
        if (prevAppUnmountedDeferred) {
          prevAppUnmountedDeferred.resolve();
        }
      },
    ];
    return async () => {
      await execHooksChain(unmountFn, app, global);
      return Promise.resolve();
    };
  };

  return {
    name: appInstanceId,
    mount: mountFnGetter(),
    unmount: unmountFnGetter(),
  };
}
