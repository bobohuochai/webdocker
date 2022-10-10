/**
 * 首次加载微应用比较慢，采用预加载机制
 */

import { Entry, importEntry } from 'import-html-entry';
import { AppConfig } from './interface';

/**
 * polyfill/shim for the `requestIdleCallback` and `cancelIdleCallback`.
 * https://github.com/pladaria/requestidlecallback-polyfill/blob/master/index.js
 */
window.requestIdleCallback = window.requestIdleCallback
 || function(cb) {
   const start = Date.now();
   return setTimeout(() => {
     cb({
       didTimeout: false,
       timeRemaining() {
         return Math.max(0, 50 - (Date.now() - start));
       },
     });
   }, 1);
 };

window.cancelIdleCallback = window.cancelIdleCallback
 || function(id) {
   clearTimeout(id);
 };

function prefetch(entry:Entry):void {
  window.requestIdleCallback(async () => {
    const { getExternalScripts, getExternalStyleSheets } = await importEntry(entry);
    window.requestIdleCallback(getExternalScripts);
    window.requestIdleCallback(getExternalStyleSheets);
  });
}

export function prefetchApps(apps:AppConfig[]) {
  if (apps && Array.isArray(apps)) {
    apps.forEach((app) => prefetch(app.entry));
  }
}
