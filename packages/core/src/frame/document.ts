/* eslint-disable default-case */
/* eslint-disable no-param-reassign */

import { DocumentProxy } from '../interface';
import Context from './context';

class Document {
  proxy:DocumentProxy;

  constructor(context:Context) {
    const proxy = new Proxy(document, {
      set(target, name, value) {
        (target as any)[name] = value;
        return true;
      },
      get(target, name) {
        switch (name) {
          case 'body':
            return context.body;
          case 'location':
            return context.location;
          // react-router used window = document.defaultView when create createBrowserHistory
          case 'defaultView':
            return context.proxy;
          case 'createElement':
            return function overwriteCreateElement<K extends keyof HTMLElementTagNameMap>(
              tagName:K,
              options?:ElementCreationOptions,
            ) {
              const el = document.createElement(
                tagName,
                options,
              );
              /*
               * FIXME:动态加载element时，标记element是在沙箱中创建的。
               * 当 element 类型 为javascript 时，需要在沙箱中执行；
               * 当 element 类型 为style 时，需要加上prefix。
               * 标记位：离开微应用后动态加载的element 不会走以上逻辑。
               */
              (el as any)._evalScriptInSandbox = true;
              return el;
            };
        }
        if (typeof (target as any)[name] === 'function') {
          return (target as any)[name].bind && (target as any)[name].bind(target);
        }
        return (target as any)[name];
      },
    });
    this.proxy = proxy;
  }
}

export default Document;
