/* eslint-disable default-case */
/* eslint-disable no-param-reassign */
import Context, { IframeContextConfig } from './context';
import { isBoundedFunction, isConstructable, unscopedGlobals } from '../common';

const globalFnName = ['setTimeout', 'setInterval', 'clearInterval', 'clearTimeout'];
const defaultExternals = [
  'requestAnimationFrame',
  'webkitRequestAnimationFrame',
  'mozRequestAnimationFrame',
  'oRequestAnimationFrame',
  'msRequestAnimationFrame',
  'cancelAnimationFrame',
  'webkitCancelAnimationFrame',
  'mozCancelAnimationFrame',
  'oCancelAnimationFrame',
  'msCancelAnimationFrame',
];

/*
 variables who are impossible to be overwritten need to be escaped from proxy sandbox for performance reasons
 see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/unscopables
 */
const unscopables = unscopedGlobals
  .reduce((previousValue, currentValue) => ({ ...previousValue, [currentValue]: true }), { __proto__: null });

class WindowProxy {
  proxy:Window;

  // 最后设置的props
  latestSetProp: PropertyKey | null = null;

  constructor(context:Context, iframe:HTMLIFrameElement, options:IframeContextConfig) {
    const externals = [
      ...defaultExternals,
      ...(options.externals || []),
    ];
    const __WEBDOCER_GLOBAL_VARS__:any = {};

    globalFnName.forEach((name) => {
      if (externals.includes(name)) {
        return;
      }
      __WEBDOCER_GLOBAL_VARS__[name] = (iframe.contentWindow! as any)[name].bind(iframe.contentWindow);
    });

    const proxy:Window = new Proxy(iframe.contentWindow!, {
      set: (target, name, value) => {
        (target as any)[name] = value;
        __WEBDOCER_GLOBAL_VARS__[name] = value;
        console.log('latestSetProp===>', name);
        this.latestSetProp = name;
        return true;
      },
      get(target, name) {
        if (name === Symbol.unscopables) return unscopables;

        // 判断用window,self,globalThis等也返回代理对象
        if (name === 'window' || name === 'self') {
          return proxy;
        }

        if (name === 'globalThis') {
          return proxy;
        }

        const tempTarget = target as any;

        switch (name) {
          case 'document':
            return context.document;
          case 'location':
            return context.location;
          case 'history':
            return context.history;
          case '__WEBDOCER_GLOBAL_VARS__':
            return __WEBDOCER_GLOBAL_VARS__;
        }

        if (__WEBDOCER_GLOBAL_VARS__[name]) {
          return __WEBDOCER_GLOBAL_VARS__[name];
        }
        const value = tempTarget[name];
        if (typeof value === 'function' && !isBoundedFunction(value) && !isConstructable(value)) {
          return value.bind && value.bind(target);
        }
        return value;
      },
    });
    this.proxy = proxy;
  }
}

export default WindowProxy;
