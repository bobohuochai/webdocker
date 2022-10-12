import { SandBox, WindowProxy } from '../interface';
import { getTargetValue, unscopedGlobals } from '../common';
import { createContext } from './context';
import { isPropertyFrozen, nativeGlobal } from '../utils';

type FakeWindow = Window & Record<PropertyKey, any>;
type SymbolTarget = 'target' | 'globalContext';

const useNativeWindowForBindingsProps = new Map<PropertyKey, boolean>([
  ['fetch', true],
]);

/*
 variables who are impossible to be overwritten need to be escaped from proxy sandbox for performance reasons
 see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/unscopables
 */
const unscopables = unscopedGlobals
  .reduce((previousValue, currentValue) => ({ ...previousValue, [currentValue]: true }), { __proto__: null });

// 直接修改window 对象
const variableWhiteList: PropertyKey[] = [
  // FIXME System.js used a indirect call with eval, which would make it scope escape to global
  // To make System.js works well, we write it back to global window temporary
  // see https://github.com/systemjs/systemjs/blob/457f5b7e8af6bd120a279540477552a07d5de086/src/evaluate.js#L106
  'System',

  // see https://github.com/systemjs/systemjs/blob/457f5b7e8af6bd120a279540477552a07d5de086/src/instantiate.js#L357
  '__cjsWrapper',

  // for react hot reload
  // see https://github.com/facebook/create-react-app/blob/66bf7dfc43350249e2f09d138a20840dae8a0a4a/packages/react-error-overlay/src/index.js#L180
  // https://github.com/umijs/qiankun/issues/1804
  '__REACT_ERROR_OVERLAY_GLOBAL_HOOK__',
];

// fakeWindow 和 rawWindow 相互独立的属性
// 微应用中类似写法window.Vue直接读取sandbox,不会读取globalContext
const variableBlackList:PropertyKey[] = ['Vue', 'browerCollector'];
/**
 * fastest(at most time) unique array method
 * @see https://jsperf.com/array-filter-unique/30
 */
function uniq(array: Array<string | symbol>) {
  return array.filter(function filter(this: PropertyKey[], element) {
    return element in this ? false : ((this as any)[element] = true);
  }, Object.create(null));
}

function createFakeWindow(global:Window) {
  const propertiesWithGetter = new Map<PropertyKey, boolean>();
  const fakeWindow = {} as FakeWindow;
  /*
   copy the non-configurable property of global to fakeWindow
   see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getOwnPropertyDescriptor
   > A property cannot be reported as non-configurable, if it does not exist as an own property of the target object or if it exists as a configurable own property of the target object.
   */
  Object.getOwnPropertyNames(global).filter((p) => {
    const descriptor = Object.getOwnPropertyDescriptor(global, p);
    return !descriptor?.configurable;
  }).forEach((p) => {
    const descriptor = Object.getOwnPropertyDescriptor(global, p);
    if (descriptor) {
      const hasGetter = Object.prototype.hasOwnProperty.call(descriptor, 'get');
      if (
        p === 'top'
        || p === 'parent'
        || p === 'self'
        || p === 'window'
      ) {
        descriptor.configurable = true;
        if (!hasGetter) {
          descriptor.writable = true;
        }
      }
      if (hasGetter) propertiesWithGetter.set(p, true);
      Object.defineProperty(fakeWindow, p, Object.freeze(descriptor));
    }
  });
  return { fakeWindow, propertiesWithGetter };
}

// 全局变量，记录沙箱激活的数量
// eslint-disable-next-line
let activeSandboxCount = 0;

export default class ProxySandbox implements SandBox {
  updatedValueSet = new Set<PropertyKey>();

  name: string;

  proxy: WindowProxy;

  globalContext: typeof window;

  sandboxRunning = true;

  // 最后设置的props
  latestSetProp: PropertyKey | null = null;

  active() {
    if (!this.sandboxRunning) activeSandboxCount++;
    this.sandboxRunning = true;
  }

  inactive() {
    if (--activeSandboxCount === 0) {
      variableWhiteList.forEach((p) => {
        if (this.proxy.hasOwnProperty(p)) {
          delete (this.globalContext as Record<string, any>)[p as string];
        }
      });
    }
    this.sandboxRunning = false;
  }

  constructor(name:string, globalContext = window) {
    this.name = name;
    const { updatedValueSet } = this;
    this.globalContext = globalContext;
    // 通过createFakeWindow创建一个fakeWindow对象
    const { fakeWindow, propertiesWithGetter } = createFakeWindow(globalContext);

    const descriptorTargetMap = new Map<PropertyKey, SymbolTarget>();
    const hasOwnProperty = (key: PropertyKey) => fakeWindow.hasOwnProperty(key) || globalContext.hasOwnProperty(key);

    const proxy = new Proxy(fakeWindow, {
      set: (target: FakeWindow, p: PropertyKey, value: any): boolean => {
        if (this.sandboxRunning) {
          // 判断window上有该属性，并获取到属性的 writable, configurable, enumerable等值。
          if (!target.hasOwnProperty(p) && globalContext.hasOwnProperty(p)) {
            const descriptor = Object.getOwnPropertyDescriptor(globalContext, p);
            const { writable, configurable, enumerable } = descriptor!;
            if (writable) {
              // 通过defineProperty把值复制到代理对象上，
              Object.defineProperty(target, p, {
                configurable,
                enumerable,
                writable,
                value,
              });
            }
          } else {
            // window上没有属性，支持设置值
            // eslint-disable-next-line no-param-reassign
            target[p] = value;
          }

          if (variableWhiteList.indexOf(p) !== -1) {
            // eslint-disable-next-line no-param-reassign
            (globalContext as Record<string, any>)[p as string] = value;
          }

          // 记录变更记录
          updatedValueSet.add(p);

          this.latestSetProp = p;

          return true;
        }
        // 在 strict-mode 下，Proxy 的 handler.set 返回 false 会抛出 TypeError，在沙箱卸载的情况下应该忽略错误
        return true;
      },
      get: (target: FakeWindow, p: PropertyKey): any => {
        // todo Vue ，browerCollector 和宿主应用独立
        if (variableBlackList.indexOf(p) !== -1) return target[p];
        if (p === Symbol.unscopables) return unscopables;
        // 判断用window.top, window.parent等也返回代理对象，在ifream环境也会返回代理对象。做到了真正的隔离，
        if (p === 'window' || p === 'self') {
          return proxy;
        }

        if (p === 'globalThis') {
          return proxy;
        }

        if (
          p === 'top'
          || p === 'parent'
        ) {
          if (globalContext === globalContext.parent) {
            return proxy;
          }
          return (globalContext as any)[p];
        }

        // hasOwnProperty的值表示为globalContext.hasOwnProperty
        if (p === 'hasOwnProperty') {
          return hasOwnProperty;
        }
        // 重写 document createElement 方法
        // 新增 _evalScriptInSandbox 标记 动态新增element时 区分是否是微应用中创建的
        if (p === 'document') {
          return createContext().document;
        }

        if (p === 'eval') {
          return eval;
        }

        // 返回当前值
        // eslint-disable-next-line no-nested-ternary
        const actualTarget = propertiesWithGetter.has(p) ? globalContext : p in target ? target : globalContext;
        const value = actualTarget[p];

        // frozen value should return directly, see https://github.com/umijs/qiankun/issues/2015
        if (isPropertyFrozen(actualTarget, p)) {
          return value;
        }

        /* Some dom api must be bound to native window, otherwise it would cause exception like 'TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation'
           See this code:
             const proxy = new Proxy(window, {});
             const proxyFetch = fetch.bind(proxy);
             proxyFetch('https://qiankun.com');
        */
        const boundTarget = useNativeWindowForBindingsProps.get(p) ? nativeGlobal : globalContext;

        return getTargetValue(boundTarget, value);
      },
      // trap in operator
      // see https://github.com/styled-components/styled-components/blob/master/packages/styled-components/src/constants.js#L12
      has(target: FakeWindow, p: string | number | symbol): boolean {
        return p in target || p in globalContext;
      },

      getOwnPropertyDescriptor(target: FakeWindow, p: string | number | symbol): PropertyDescriptor | undefined {
        /*
         as the descriptor of top/self/window/mockTop in raw window are configurable but not in proxy target, we need to get it from target to avoid TypeError
         see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getOwnPropertyDescriptor
         > A property cannot be reported as non-configurable, if it does not exists as an own property of the target object or if it exists as a configurable own property of the target object.
         */
        if (target.hasOwnProperty(p)) {
          const descriptor = Object.getOwnPropertyDescriptor(target, p);
          descriptorTargetMap.set(p, 'target');
          return descriptor;
        }

        if (globalContext.hasOwnProperty(p)) {
          const descriptor = Object.getOwnPropertyDescriptor(globalContext, p);
          descriptorTargetMap.set(p, 'globalContext');
          // A property cannot be reported as non-configurable, if it does not exists as an own property of the target object
          if (descriptor && !descriptor.configurable) {
            descriptor.configurable = true;
          }
          return descriptor;
        }

        return undefined;
      },

      // trap to support iterator with sandbox
      ownKeys(target: FakeWindow): ArrayLike<string | symbol> {
        return uniq(Reflect.ownKeys(globalContext).concat(Reflect.ownKeys(target)));
      },

      defineProperty(target: Window, p: PropertyKey, attributes: PropertyDescriptor): boolean {
        const from = descriptorTargetMap.get(p);
        /*
         Descriptor must be defined to native window while it comes from native window via Object.getOwnPropertyDescriptor(window, p),
         otherwise it would cause a TypeError with illegal invocation.
         */
        switch (from) {
          case 'globalContext':
            return Reflect.defineProperty(globalContext, p, attributes);
          default:
            return Reflect.defineProperty(target, p, attributes);
        }
      },

      deleteProperty: (target: FakeWindow, p: string | number | symbol): boolean => {
        if (target.hasOwnProperty(p)) {
          // eslint-disable-next-line no-param-reassign
          delete target[p];
          updatedValueSet.delete(p);

          return true;
        }

        return true;
      },

      // makes sure `window instanceof Window` returns truthy in micro app
      getPrototypeOf() {
        return Reflect.getPrototypeOf(globalContext);
      },
    });

    this.proxy = proxy;

    activeSandboxCount++;
  }
}
