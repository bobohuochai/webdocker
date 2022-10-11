/* eslint-disable default-case */
/* eslint-disable no-param-reassign */

import { DocumentProxy } from '../interface';

class Document {
  proxy:DocumentProxy;

  constructor() {
    const proxy = new Proxy(document, {
      set(target, name, value) {
        (target as any)[name] = value;
        return true;
      },
      get(target, name) {
        switch (name) {
          case 'createElement':
            return function createElement<K extends keyof HTMLElementTagNameMap>(
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
               * 标记位：标记离开微应用后动态加载的element 不会走以上逻辑。
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
