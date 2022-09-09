import { importEntry } from 'import-html-entry';

import { createSandboxContainer } from './sandbox/index';
import * as css from './sandbox/css';
import { LoadableApp } from './interface';
import { Deferred, genAppInstanceIdByName, getDefaultTplWrapper } from './utils';

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

  // 添加微应用入口
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
  console.log('render===>', containerElement, element);
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
    return element?.querySelector(`#${WebDockerSubAppContainerAttr}`);
  };
}

let prevAppUnmountedDeferred: Deferred<void>;

export async function loadApp<T>(app:LoadableApp<T>) {
  const { container, name: appName, entry } = app;
  const appInstanceId = genAppInstanceIdByName(appName);
  const { execScripts, template } = await importEntry({
    ...entry,
  });

  // as single-spa load and bootstrap new app parallel with other apps unmounting
  // (see https://github.com/CanopyTax/single-spa/blob/master/src/navigation/reroute.js#L74)
  // we need wait to load the app until all apps are finishing unmount in singular mode
  // 浏览器事件队列 清空为止，类似vue nextTick,一般都是single app
  await (prevAppUnmountedDeferred && prevAppUnmountedDeferred.promise);

  const appContent = getDefaultTplWrapper(appInstanceId)(template);
  const appElement = createElement(appContent, appInstanceId);
  const appWrapperGetter = getAppWrapperGetter(() => appElement);
  // 第一次加载设置应用可见区域 dom 结构
  // 确保每次应用加载前容器 dom 结构已经设置完毕
  render(appElement, container);

  const sandboxContainer = createSandboxContainer(appName);
  const { proxy } = sandboxContainer.instance;
  const scriptExports: any = await execScripts(proxy, true);
  console.log('script exports===>', scriptExports, appElement);
  return {
    mount: [async () => {
      scriptExports.mount({ container: appWrapperGetter() });
    }],
  };
}
