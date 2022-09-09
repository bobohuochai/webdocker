import { once } from 'lodash';

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

export function getDefaultTplWrapper(name: string) {
  return (tpl: string) => `<div id="${name}" data-name="${name}">${tpl}</div>`;
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
