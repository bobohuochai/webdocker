/* eslint-disable import/no-mutable-exports */
import { getCache, setCache } from './cache';
import { IO } from './type';
import { isArray } from './utils';

const storeCacheKey = 'WebDocker_Store';

class Store implements IO {
  store:Record<string, any>;

  storeEvents:Record<string, Array<(value:any)=>void>>;

  constructor() {
    this.store = {};
    this.storeEvents = {};
  }

  has(key: string): boolean {
    const storeCallbacks = this.storeEvents[key];
    return isArray(storeCallbacks) && storeCallbacks.length > 0;
  }

  on(key: string, callback: (value: any) => void, force?: boolean): void {
    if (!this.storeEvents[key]) {
      this.storeEvents[key] = [];
    }
    this.storeEvents[key].push(callback);
    if (force) {
      callback(this.store[key]);
    }
  }

  off(key: string, callback?: (value: any) => void): void {
    if (!this.storeEvents[key]) {
      console.warn(`[@webdocker/data] store.off:no callback fro ${key}`);
      return;
    }
    if (callback === undefined) {
      this.storeEvents[key] = undefined;
      return;
    }
    this.storeEvents[key] = this.storeEvents[key].filter((cb) => cb !== callback);
  }

  get(key?: string) {
    if (key === undefined) {
      return this.store;
    }
    return this.store[key];
  }

  set<T>(key: string, value?: T): void {
    this._setValue(key, value);
  }

  _setValue(key:string, value:any) {
    this.store[key] = value;
    this._emit(key);
  }

  _emit(key:string) {
    const callbacks = this.storeEvents[key];
    if (!isArray(callbacks) || (isArray(callbacks) && callbacks.length === 0)) {
      console.warn(`[@webdocker/data] store.set:no callback for ${key}`);
      return;
    }
    const value = this.store[key];
    callbacks.forEach((cb) => {
      cb(value);
    });
  }
}

let store = getCache(storeCacheKey);

if (!store) {
  store = new Store();
  setCache(storeCacheKey, store);
}

export default store;
