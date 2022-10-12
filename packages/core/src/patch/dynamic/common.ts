/**
 * 微应用如果用到懒加载机制，需要代理webpack中appendChild,removeChild等方法，
 * css等动态文件需要隔离作用域，js等动态文件加载需要用沙箱隔离执行。
 * 内联JS style,需要加载到指定微应用入口下
 * 微应用卸载时需要恢复appendChild,removeChild 等方法
 */

import { execScripts } from 'import-html-entry';
import { isFunction } from 'lodash';
import { ContainerConfig } from '../../interface';
import { webdokcerHeadTagName } from '../../utils';
import * as css from '../../sandbox/css';
import { lexicalGlobals } from '../../common';

const rawHeadAppendChild = HTMLHeadElement.prototype.appendChild;
const rawBodyAppendChild = HTMLBodyElement.prototype.appendChild;
const rawHeadRemoveChild = HTMLHeadElement.prototype.removeChild;
const rawBodyRemoveChild = HTMLBodyElement.prototype.removeChild;
const rawHeadInsertBefore = HTMLHeadElement.prototype.insertBefore;
const rawRemoveChild = HTMLElement.prototype.removeChild;

const SCRIPT_TAG_NAME = 'SCRIPT';
const LINK_TAG_NAME = 'LINK';
const STYLE_TAG_NAME = 'STYLE';

type DynamicDomMutationTarget = 'head' | 'body';

export function isExecutableScriptType(script:HTMLScriptElement) {
  return (!script.type || ['text/javascript', 'module', 'application/javascript',
    'text/ecmascript', 'application/ecmascript'].indexOf(script.type) !== -1);
}

export function isHijackingTag(tagName:string) {
  return (
    tagName?.toUpperCase() === SCRIPT_TAG_NAME
        || tagName?.toUpperCase() === LINK_TAG_NAME
        || tagName?.toUpperCase() === STYLE_TAG_NAME
  );
}

export const getAppWrapperHeadElement = (appWrapper: Element) => appWrapper.querySelector(webdokcerHeadTagName)!;

function patchCustomEvent(e:CustomEvent, elementGetter:()=>HTMLScriptElement | HTMLLinkElement |null) {
  Object.defineProperties(e, {
    target: {
      get: elementGetter,
    },
    srcElement: {
      get: elementGetter,
    },
  });
  return e;
}

function manualInvokeElementOnLoad(element:HTMLLinkElement | HTMLScriptElement) {
  // 触发 script.onload 事件
  // 触发 addEventListener('load') 事件
  // 通知脚本或元素加载结束
  // 1. element.onload callback way, which webpack and loadjs used, see https://github.com/muicss/loadjs/blob/master/src/loadjs.js#L138
  // 2. addEventListener way, which toast-loader used, see https://github.com/pyrsmk/toast/blob/master/src/Toast.ts#L64

  const loadEvent = new CustomEvent('load');
  const patchedEvent = patchCustomEvent(loadEvent, () => element);
  if (isFunction(element.onload)) {
    element.onload(patchedEvent);
  } else {
    element.dispatchEvent(patchedEvent);
  }
}

function manualInvokeElementOnError(element:HTMLLinkElement | HTMLScriptElement) {
  const errorEvent = new CustomEvent('error');
  const patchedEvent = patchCustomEvent(errorEvent, () => element);
  if (isFunction(element.onerror)) {
    element.onerror(patchedEvent);
  } else {
    element.dispatchEvent(patchedEvent);
  }
}

function convertLinkAsStyle(
  element:HTMLLinkElement,
  postProcess:(styleElement:HTMLStyleElement)=>void,
) {
  const styleElement = document.createElement('style');
  const { href } = element;
  styleElement.dataset.webdockerhref = href;
  // todo fetch 兼容
  window.fetch(href)
    .then((res:any) => res.text())
    .then((styleContext:string) => {
      styleElement.appendChild(document.createTextNode(styleContext));
      postProcess(styleElement);
      manualInvokeElementOnLoad(element);
    })
    .catch(() => manualInvokeElementOnError(element));
  return styleElement;
}

const dynamicScriptAttachedCommentMap = new Map<HTMLScriptElement, Comment>();
const dynamicLinkAttachedInlineStyleMap = new Map<HTMLLinkElement, HTMLStyleElement>();

function getOverwrittenAppendChildOrInsertBefore(opts:{
  rawDOMAppendOrInsertBefore:<T extends Node>(newChild: T, refChild?: Node | null) => T;
  isInvokedByMicroApp:(element:HTMLElement) =>boolean;
  containerConfigGetter:(element:HTMLElement)=>ContainerConfig|undefined;
  target:DynamicDomMutationTarget;
}) {
  return function appendChildOrInsertBefore<T extends Node>(
    this:HTMLHeadElement|HTMLBodyElement,
    newChild:T,
    refChild:Node | null = null,
  ) {
    let element = newChild as any;
    const {
      rawDOMAppendOrInsertBefore, isInvokedByMicroApp, containerConfigGetter, target = 'body',
    } = opts;
    const containerConfig = containerConfigGetter(element);
    if (!isHijackingTag(element.tagName) || !isInvokedByMicroApp(element) || !containerConfig) {
      return rawDOMAppendOrInsertBefore.call(this, element, refChild);
    }
    if (element.tagName) {
      const {
        appWrapperGetter, proxy, appName,
      } = containerConfig;

      switch (element.tagName) {
        case LINK_TAG_NAME:
        case STYLE_TAG_NAME: {
          console.log('style element overwrite====>', element, window.location.pathname, document);
          let stylesheetElement:HTMLLinkElement |HTMLStyleElement = newChild as any;
          const appWrapper = appWrapperGetter();
          // 排除<link ref="icon" href="favicon.icon">
          const linkElementUsingStylesheet = element.tagName.toUpperCase() === LINK_TAG_NAME
          && (element as HTMLLinkElement).rel === 'stylesheet'
          && (element as HTMLLinkElement).href;
          if (linkElementUsingStylesheet) {
            stylesheetElement = convertLinkAsStyle(
              element,
              (styleElement) => css.process(appWrapper, styleElement, appName),
            );
            dynamicLinkAttachedInlineStyleMap.set(element, stylesheetElement);
          } else {
            css.process(appWrapper, stylesheetElement, appName);
          }
          const mountDOM = target === 'head' ? getAppWrapperHeadElement(appWrapper) : appWrapper;
          const referenceNode = mountDOM.contains(refChild) ? refChild : null;
          return rawDOMAppendOrInsertBefore.call(mountDOM, stylesheetElement, referenceNode);
        }
        case SCRIPT_TAG_NAME: {
          console.log('script element overwrite====>', element, window.location.pathname, document);
          const { src, text } = element;
          if (!isExecutableScriptType(element)) {
            return rawDOMAppendOrInsertBefore.call(this, element, refChild);
          }
          const appWrapper = appWrapperGetter();
          const mountDOM = target === 'head' ? getAppWrapperHeadElement(appWrapper) : appWrapper;
          const referenceNode = mountDOM.contains(refChild) ? refChild : null;

          // https://github.com/umijs/qiankun/issues/1175
          // https://hijiangtao.github.io/2022/06/11/JavaScript-Sandbox-Mechanism-and-Its-History/
          const scopedGlobalVariables = lexicalGlobals;
          if (src) {
            execScripts(null, [src], proxy, {
              fetch: window.fetch,
              strictGlobal: true,
              scopedGlobalVariables,
              beforeExec: () => {
                const isCurrentScriptConfigurable = () => {
                  const descriptor = Object.getOwnPropertyDescriptor(document, 'currentScript');
                  return !descriptor || descriptor.configurable;
                };
                if (isCurrentScriptConfigurable()) {
                  Object.defineProperty(document, 'currentScript', {
                    get() {
                      return element;
                    },
                    configurable: true,
                  });
                }
              },
              success: () => {
                manualInvokeElementOnLoad(element);
                element = null;
              },
              error: () => {
                manualInvokeElementOnError(element);
                element = null;
              },
            });
            const dynamicScriptCommentElement = document.createComment(`dynamic script ${src} replaced by webdocker`);
            dynamicScriptAttachedCommentMap.set(element, dynamicScriptCommentElement);
            return rawDOMAppendOrInsertBefore.call(mountDOM, dynamicScriptCommentElement, referenceNode);
          }

          // 内联脚本处理, 内联脚本不会触发onload，onerror event
          execScripts(null, [`<script>${text}</script>`], proxy, { strictGlobal: true, scopedGlobalVariables });
          const dynamicInlineScriptCommentElement = document.createComment('dynamic inline script replaced by webdocker');
          dynamicScriptAttachedCommentMap.set(element, dynamicInlineScriptCommentElement);
          return rawDOMAppendOrInsertBefore.call(mountDOM, dynamicInlineScriptCommentElement, referenceNode);
        }
        default:
          break;
      }
    }

    return rawDOMAppendOrInsertBefore.call(this, element, refChild);
  };
}

function getNewRemoveChild(
  rawHeadOrBodyRemoveChild:typeof HTMLElement.prototype.removeChild,
  containerConfigGetter:(element:HTMLElement)=>ContainerConfig,
  target:DynamicDomMutationTarget,
) {
  return function removeChild<T extends Node>(this:HTMLHeadElement | HTMLBodyElement, child:T) {
    const { tagName } = child as any;
    const containerConfig = containerConfigGetter(child as any);
    if (!isHijackingTag(tagName) || !containerConfig) return rawHeadOrBodyRemoveChild.call(this, child) as T;
    let attachedElement:Node;

    const { appWrapperGetter } = containerConfig;
    switch (tagName) {
      case STYLE_TAG_NAME:
      case LINK_TAG_NAME:
        attachedElement = dynamicLinkAttachedInlineStyleMap.get(child as any) || child;

        // todo style-component
        break;
      case SCRIPT_TAG_NAME: {
        attachedElement = dynamicScriptAttachedCommentMap.get(child as any) || child;
        break;
      }
      default: {
        attachedElement = child;
      }
    }
    const appWrapper = appWrapperGetter();
    const mountDOM = target === 'head' ? getAppWrapperHeadElement(appWrapper) : appWrapper;
    if (mountDOM.contains(attachedElement)) {
      return rawRemoveChild.call(attachedElement.parentNode, attachedElement) as T;
    }
    return rawHeadOrBodyRemoveChild.call(this, child) as T;
  };
}

export function patchHTMLDynamicAppendPrototypeFunctions(
  isInvokedByMicroApp:(element:HTMLElement) =>boolean,
  containerConfigGetter:(element:HTMLElement)=>ContainerConfig,
) {
  // 覆盖 appendChild,insertBefore方法
  if (HTMLHeadElement.prototype.appendChild === rawHeadAppendChild
       && HTMLBodyElement.prototype.appendChild === rawBodyAppendChild
       && HTMLHeadElement.prototype.insertBefore === rawHeadInsertBefore) {
    HTMLHeadElement.prototype.appendChild = getOverwrittenAppendChildOrInsertBefore(
      {
        rawDOMAppendOrInsertBefore: rawHeadAppendChild,
        containerConfigGetter,
        isInvokedByMicroApp,
        target: 'head',
      },
    ) as typeof rawHeadAppendChild;

    HTMLHeadElement.prototype.insertBefore = getOverwrittenAppendChildOrInsertBefore(
      {
        rawDOMAppendOrInsertBefore: rawHeadInsertBefore as any,
        containerConfigGetter,
        isInvokedByMicroApp,
        target: 'head',
      },
    ) as typeof rawHeadInsertBefore;

    HTMLBodyElement.prototype.appendChild = getOverwrittenAppendChildOrInsertBefore(
      {
        rawDOMAppendOrInsertBefore: rawBodyAppendChild,
        containerConfigGetter,
        isInvokedByMicroApp,
        target: 'body',
      },
    ) as typeof rawBodyAppendChild;
  }

  // 覆盖removeChild 方法
  if (HTMLHeadElement.prototype.removeChild === rawHeadRemoveChild
     && HTMLBodyElement.prototype.removeChild === rawBodyRemoveChild) {
    HTMLHeadElement.prototype.removeChild = getNewRemoveChild(
      rawHeadRemoveChild,
      containerConfigGetter,
      'head',
    );
    HTMLBodyElement.prototype.removeChild = getNewRemoveChild(
      rawBodyRemoveChild,
      containerConfigGetter,
      'body',
    );
  }

  // 恢复原有removeChild,appendChild,insertBefore 方法
  return function unpatch() {
    HTMLHeadElement.prototype.appendChild = rawHeadAppendChild;
    HTMLHeadElement.prototype.removeChild = rawHeadRemoveChild;
    HTMLHeadElement.prototype.insertBefore = rawHeadInsertBefore;
    HTMLBodyElement.prototype.appendChild = rawBodyAppendChild;
    HTMLBodyElement.prototype.removeChild = rawBodyRemoveChild;
  };
}
