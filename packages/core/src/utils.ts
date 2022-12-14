import { once } from 'lodash';

export type AppInstance = {name:string, window:WindowProxy};
let currentRunningApp:AppInstance| null = null;

/**
 * get the app that running tasks at current tick
 */
export function getCurrentRunningApp() {
  return currentRunningApp;
}

export function setCurrentRunningApp(appInstance:AppInstance | null) {
  // set currentRunningApp and it's proxySandbox to global window, as its only use case is for document.createElement from now on, which hijacked by a global way
  currentRunningApp = appInstance;
}

let globalTaskPending = false;

/**
 * Run a callback before next task executing, and the invocation is idempotent in every singular task
 * That means even we called nextTask multi times in one task, only the first callback will be pushed to nextTick to be invoked.
 * @param cb
 */
export function nextTask(cb: () => void): void {
  if (!globalTaskPending) {
    globalTaskPending = true;
    Promise.resolve().then(() => {
      cb();
      globalTaskPending = false;
    });
  }
}

export function sleep(ms:number) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

export class Deferred<T> {
  promise:Promise<T>;

  // eslint-disable-next-line no-unused-vars
  resolve!:(value:T | PromiseLike<T>) => void;

  reject!:(reason?:any)=>void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

export const webdokcerHeadTagName = 'webdocker-head';

export function getDefaultTplWrapper(name: string) {
  return (tpl: string) => {
    // HTMLHeadElement.appendChild 新增脚本时，占位符

    let tplWithHead:string;
    if (tpl.indexOf('<head>') !== -1) {
      tplWithHead = tpl.replace('<head>', `<${webdokcerHeadTagName}>`)
        .replace('</head>', `</${webdokcerHeadTagName}>`);
    } else {
      tplWithHead = `<${webdokcerHeadTagName}></${webdokcerHeadTagName}>${tpl}`;
    }
    return `<div id="${name}" data-name="${name}">${tplWithHead}</div>`;
  };
}

// eslint-disable-next-line no-new-func
export const nativeGlobal = new Function('return this')();

const getGlobalAppInstanceMap = once<()=>Record<string, number>>(() => {
  if (!nativeGlobal.hasOwnProperty('__app_instance_name_map__')) {
    Object.defineProperty(nativeGlobal, '__app_instance_name_map__', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: {},
    });
  }
  return nativeGlobal.__app_instance_name_map__;
});

/**
   * Get app instance name with the auto-increment approach
   * @param appName
   */
export const genAppInstanceIdByName = (appName: string): string => {
  const globalAppInstanceMap = getGlobalAppInstanceMap();
  if (!(appName in globalAppInstanceMap)) {
    nativeGlobal.__app_instance_name_map__[appName] = 0;
    return appName;
  }

  globalAppInstanceMap[appName]++;
  return `${appName}_${globalAppInstanceMap[appName]}`;
};

export function toArray<T>(array:T | T[]) :T[] {
  return Array.isArray(array) ? array : [array];
}

/**
 * isPropertyReadonly
 * @param target
 * @param p
 * @returns boolean
 */
const frozenPropertyCacheMap = new WeakMap<any, Record<PropertyKey, boolean>>();
export function isPropertyFrozen(target: any, p?: PropertyKey): boolean {
  if (!target || !p) {
    return false;
  }

  const targetPropertiesFromCache = frozenPropertyCacheMap.get(target) || {};

  if (targetPropertiesFromCache[p]) {
    return targetPropertiesFromCache[p];
  }

  const propertyDescriptor = Object.getOwnPropertyDescriptor(target, p);
  const frozen = Boolean(
    propertyDescriptor
       && propertyDescriptor.configurable === false
       && (propertyDescriptor.writable === false || (propertyDescriptor.get && !propertyDescriptor.set)),
  );

  targetPropertiesFromCache[p] = frozen;
  frozenPropertyCacheMap.set(target, targetPropertiesFromCache);

  return frozen;
}

/**
 * lazy single instance
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const getSingle = (fn:Function) => {
  let instance:any = null;
  return function create(this:any, ...args:any[]) {
    if (!instance) {
      // eslint-disable-next-line prefer-spread
      instance = fn.apply(this, args);
    }
    return instance;
  };
};
