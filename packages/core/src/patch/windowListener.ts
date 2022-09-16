/* eslint-disable no-param-reassign */

import { noop } from 'lodash';

const rawWindowAddListener = window.addEventListener;
const rawWindowRemoveListener = window.removeEventListener;
export default function patch(global:Window) {
  const listenerMap = new Map<string, EventListenerOrEventListenerObject[]>();
  global.addEventListener = (
    type:string,
    listener:EventListenerOrEventListenerObject,
    options:boolean | EventListenerOptions,
  ) => {
    const listeners = listenerMap.get(type) || [];
    listenerMap.set(type, [...listeners, listener]);
    return rawWindowAddListener.call(window, type, listener, options);
  };

  global.removeEventListener = (
    type:string,
    listener:EventListenerOrEventListenerObject,
    options:boolean|EventListenerOptions,
  ) => {
    const storedListeners = listenerMap.get(type);
    if (storedListeners && storedListeners.length && storedListeners.indexOf(listener) !== -1) {
      storedListeners.splice(storedListeners.indexOf(listener), 1);
    }
    return rawWindowRemoveListener.call(window, type, listener, options);
  };

  return function free() {
    listenerMap.forEach((listeners, type) => {
      [...listeners].forEach((listener) => { global.removeEventListener(type, listener); });
    });
    global.addEventListener = rawWindowAddListener;
    global.removeEventListener = rawWindowRemoveListener;
    return noop;
  };
}
