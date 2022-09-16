/* eslint-disable no-param-reassign */

import { noop } from 'lodash';

const rawWindowInterval = window.setInterval;

const rawWindowClearInterval = window.clearInterval;

export default function patch(global:Window) {
  let intervalIds:number[] = [];

  global.clearInterval = (intervalId:number) => {
    intervalIds = intervalIds.filter((id) => id !== intervalId);
    return rawWindowClearInterval.call(window, intervalId);
  };

  global.setInterval = (handler: CallableFunction, timeout?: number | undefined, ...args: any[]) => {
    /**
     * Passing the 'this' object with .call won't work
     * because this will change the value of this inside setTimeout itself
     * while we want to change the value of this inside myArray.myMethod.
     * In fact, it will be an error because setTimeout code expects this to be the window object:
     * https://developer.mozilla.org/en-US/docs/Web/API/setInterval
     */
    const intervalId:number = rawWindowInterval(handler, timeout, ...args);
    intervalIds = [...intervalIds, intervalId];
    return intervalId;
  };
  return function free() {
    intervalIds.forEach((id) => global.clearInterval(id));
    global.clearInterval = rawWindowClearInterval;
    global.setInterval = rawWindowInterval;
    return noop;
  };
}
