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
