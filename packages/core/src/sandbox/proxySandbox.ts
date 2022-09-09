import { SandBox, WindowProxy } from '../interface';
import { getTargetValue } from '../common';

type FakeWindow = Window & Record<PropertyKey, any>;
type SymbolTarget = 'target' | 'globalContext';

/*
 variables who are impossible to be overwrite need to be escaped from proxy sandbox for performance reasons
 */
const unscopables = {
  undefined: true,
  Array: true,
  Object: true,
  String: true,
  Boolean: true,
  Math: true,
  Number: true,
  Symbol: true,
  parseFloat: true,
  Float32Array: true,
  isNaN: true,
  Infinity: true,
  Reflect: true,
  Float64Array: true,
  Function: true,
  Map: true,
  NaN: true,
  Promise: true,
  Proxy: true,
  Set: true,
  parseInt: true,
  requestAnimationFrame: true,
};

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
  console.log('fakeWindow===>', fakeWindow);
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
    --activeSandboxCount;
    this.sandboxRunning = false;
  }

  constructor(name:string, globalContext = window) {
    this.name = name;
    const { updatedValueSet } = this;
    console.log('parent global==>', globalContext);
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

          // 记录变更记录
          updatedValueSet.add(p);

          this.latestSetProp = p;

          return true;
        }
        // 在 strict-mode 下，Proxy 的 handler.set 返回 false 会抛出 TypeError，在沙箱卸载的情况下应该忽略错误
        return true;
      },
      get(target: FakeWindow, p: PropertyKey): any {
        // todo Vue ，browerCollector 和宿主应用独立
        if (p === 'Vue' || p === 'browerCollector') return target[p];
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

        if (p === 'document') {
          return document;
        }

        if (p === 'eval') {
          return eval;
        }

        // 返回当前值
        // eslint-disable-next-line no-nested-ternary
        const value = propertiesWithGetter.has(p)
          ? (globalContext as any)[p]
          : p in target
            ? (target as any)[p]
            : (globalContext as any)[p];
        return getTargetValue(globalContext, value);
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
