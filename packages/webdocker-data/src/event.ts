/* eslint-disable import/no-mutable-exports */
import { getCache, setCache } from './cache';
import { EventEmitter, EventCallback } from './type';
import { isArray } from './utils';

const eventCacheKey = 'WebDocker_EventEmitter';

class Event implements EventEmitter {
  eventEmitter:Record<string, EventCallback[]>;

  constructor() {
    this.eventEmitter = {};
  }

  has(key:string) {
    const callbacks = this.eventEmitter[key];
    return isArray(callbacks) && callbacks.length > 0;
  }

  emit(key: string, ...args): void {
    const callbacks = this.eventEmitter[key];
    if (!isArray(callbacks) || (isArray(callbacks) && callbacks.length === 0)) {
      console.warn(`[@webdocker/data] event.emit:no callback for ${key}`);
      return;
    }
    callbacks.forEach((cb) => {
      cb(...args);
    });
  }

  on(key: string, callback: EventCallback): void {
    if (!this.eventEmitter[key]) {
      this.eventEmitter[key] = [];
    }
    this.eventEmitter[key].push(callback);
  }

  off(key: string, callback?: EventCallback): void {
    if (!this.eventEmitter[key]) {
      console.warn(`[@webdocker/data] event.off:no callback fro ${key}`);
      return;
    }
    if (callback === undefined) {
      this.eventEmitter[key] = undefined;
      return;
    }
    this.eventEmitter[key] = this.eventEmitter[key].filter((cb) => cb !== callback);
  }
}

let event:Event = getCache(eventCacheKey);

if (!event) {
  event = new Event();
  setCache<Event>(eventCacheKey, event);
}
export default event;
