/* eslint-disable @typescript-eslint/no-empty-function */

import ProxySandbox from '../src/sandbox/proxySandbox';
import { isBoundedFunction } from '../src/common';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window extends Record<string, any> {
    nonEnumerableValue: string;
  }
}

test('iterator should be workde the same as the raw window', () => {
  Object.defineProperty(window, 'nonEnumerableValue', {
    writable: true,
    configurable: true,
    value: 1,
    enumerable: false,
  });
  const { proxy } = new ProxySandbox('iterator');
  expect(Object.keys(proxy)).toEqual(Object.keys(window));
  expect(Object.getOwnPropertyNames(proxy)).toEqual(Object.getOwnPropertyNames(window));

  proxy.nonEnumerableValue = window.nonEnumerableValue;
  proxy.parseFloat = window.parseFloat;
  // test the iterator order
  const sandboxKeys = [];

  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const p in proxy) {
    sandboxKeys.push(p);
  }
  const rawWindowKeys = [];
  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const p in window) {
    rawWindowKeys.push(p);
  }
  expect(sandboxKeys).toEqual(rawWindowKeys);
});

test('window.self & window.window & window.top & window.parent & window.globalThis should equals with sandbox', () => {
  const { proxy } = new ProxySandbox('self');
  expect(proxy.self).toEqual(proxy);
  expect(proxy.window).toEqual(proxy);
  expect(proxy.top).toEqual(proxy);
  expect(proxy.parent).toEqual(proxy);
  expect(proxy.globalThis).toEqual(proxy);
});

test('eval should never be represented', () => {
  const { proxy } = new ProxySandbox('test-eval');
  window.proxy = proxy;
  const code = ' ;(function(window){with(window){ var testProp = function(wrequire){ eval("window.testEval=wrequire()"); }; testProp(() => "helloProxy");}})(window.proxy)';
  const geval = eval;
  geval(code);

  expect(proxy.testEval).toBe('helloProxy');
  expect(window.testEval).toBeUndefined();
});

test('hasOwnProperty should works well', () => {
  const { proxy } = new ProxySandbox('test-hasOwnProperty');
  proxy.testName = 'hasOwnProperty';
  expect(proxy.testName).toBe('hasOwnProperty');
  expect(window.testName).toBeUndefined();

  expect(proxy.hasOwnProperty('testName')).toBeTruthy();
  expect(window.hasOwnProperty('testName')).toBeFalsy();

  expect(Object.getOwnPropertyDescriptor(proxy, 'testName')).toEqual({
    value: 'hasOwnProperty',
    configurable: true,
    enumerable: true,
    writable: true,
  });
});

test('document should work well with MutationObserver', () => {
  const docmentProxy = new ProxySandbox('document').proxy;

  const observer = new MutationObserver((mutations) => {
    if (mutations[0]) {
      expect(mutations[0].target).toBe(document.body);
      observer.disconnect();
    }
  });
  observer.observe(docmentProxy.document, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  docmentProxy.document.body.innerHTML = '<div></div>';
});

test('bounded function should not be rebounded', () => {
  const { proxy } = new ProxySandbox('bounded-test');
  const fn = () => {};
  const boundedFn = fn.bind(null);
  proxy.fn1 = fn;
  proxy.fn2 = boundedFn;
  expect(proxy.fn1 === fn).toBeFalsy();
  expect(proxy.fn2 === boundedFn).toBeTruthy();
  expect(isBoundedFunction(boundedFn)).toBeTruthy();
});

test('the prototype should be kept while we create a function with prototype on proxy', () => {
  const proxy = new ProxySandbox('new-function').proxy as any;

  function test() {}

  proxy.fn = test;
  expect(proxy.fn === test).toBeFalsy();
  expect(proxy.fn.prototype).toBe(test.prototype);
});

test('falsy values should return as expected', () => {
  const { proxy } = new ProxySandbox('falsy-value-test');
  proxy.falsevar = false;
  proxy.nullvar = null;
  proxy.zero = 0;
  expect(proxy.falsevar).toBe(false);
  expect(proxy.nullvar).toBe(null);
});

test('should return true while [[GetPrototypeOf]] invaoked by proxy object', () => {
  // window.__proto__ not equals window prototype in jest environment
  // eslint-disable-next-line no-proto
  expect(window.__proto__ === Object.getPrototypeOf(window)).toBeFalsy();
  // we must to set the prototype of window as jest modified window `__proto__` property but not changed it internal [[Prototype]] property
  // eslint-disable-next-line no-proto
  Object.setPrototypeOf(window, window.__proto__);
  const { proxy } = new ProxySandbox('getPropertyOf');
  expect(proxy instanceof Window).toBeTruthy();
  expect(Object.getPrototypeOf(proxy)).toBe(Object.getPrototypeOf(window));
});

test('native window function calling should always be bound with window', () => {
  window.nativaWindowFunction = function nativaWindowFunction(this:any) {
    if (this !== undefined && this !== window) {
      throw new Error('Illegal Invocation');
    }
    return 'success';
  };
  const { proxy } = new ProxySandbox('test-function');
  expect(proxy.nativaWindowFunction()).toBe('success');
});

test('descriptor of non-configurable and non-enumrable property existed in raw window should be the same after modified in sandbox', () => {
  Object.defineProperty(window, 'nonConfigurableProp', { configurable: false, writable: true });
  Object.defineProperty(window, 'nonConfigurablePropWithAccessor', {
    configurable: false,
    get() {},
    set() {},
  });
  Object.defineProperty(window, 'enumerableProp', { enumerable: true, writable: true });
  Object.defineProperty(window, 'nonEnumerableProp', { enumerable: false, writable: true });

  const { proxy } = new ProxySandbox('set-test');
  proxy.nonConfigurableProp = (<any>window).nonConfigurableProp;
  proxy.nonConfigurablePropWithAccessor = 123;
  expect(proxy.nonConfigurablePropWithAccessor).toBe(undefined);
  expect(window.nonConfigurablePropWithAccessor).toBe(undefined);

  proxy.enumerableProp = 123;
  proxy.nonEnumerableProp = 456;
  expect(proxy.enumerableProp).toBe(123);
  expect(proxy.nonEnumerableProp).toBe(456);
  expect(Object.keys(proxy)).toEqual(Object.keys(window));
  expect(Object.keys(proxy).includes('nonEnumerableProp')).toBeFalsy();
  expect(Object.keys(proxy).includes('enumerableProp')).toBeTruthy();
  expect(window.enumerableProp).toBe(undefined);
  expect(window.nonEnumerableProp).toBe(undefined);
  expect(Object.getOwnPropertyDescriptor(proxy, 'nonEnumerableProp')).toEqual({
    enumerable: false,
    writable: true,
    configurable: false,
    value: 456,
  });
  expect(Object.getOwnPropertyDescriptor(window, 'nonEnumerableProp')).toEqual({
    enumerable: false,
    writable: true,
    configurable: false,
  });
});

test('window.Vue & window.browerCollector should not equal with the sandbox', () => {
  Object.defineProperty(window, 'Vue', {
    value: 123,
    writable: true,
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'browerCollector', {
    value: 'blackVar',
    writable: true,
    enumerable: true,
    configurable: true,
  });
  const { proxy } = new ProxySandbox('variableBlacklist');
  expect(proxy.Vue).toBe(undefined);
  expect(window.Vue).toBe(123);
  expect(proxy.browerCollector).toBe(undefined);
  expect(window.browerCollector).toBe('blackVar');
});

test('should work well while the property existed in global context before', () => {
  Object.defineProperty(window, 'readOnlyPropertyInGlobalContext', {
    value: 1,
    writable: false,
    configurable: true,
  });
  const { proxy } = new ProxySandbox('readonlu-sandbox');
  proxy.readOnlyPropertyInGlobalContext = 456;
  expect(proxy.readOnlyPropertyInGlobalContext).toBe(1);

  Object.defineProperty(window, 'hasSetAccessorInGlobalContext', {
    get() {
      return 1;
    },
    set() {

    },
    configurable: true,
  });

  const { proxy: proxySet } = new ProxySandbox('set-sandbox');
  proxySet.hasSetAccessorInGlobalContext = 2;
  expect(proxySet.hasSetAccessorInGlobalContext).toBe(2);
});
