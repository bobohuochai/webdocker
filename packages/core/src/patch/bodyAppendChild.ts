/* eslint-disable no-param-reassign */

/**
 * dialog,select,popper 等组件造成的全局样式逃离
 */
import { noop } from 'lodash';

const rawBodyAppendChild = document.body.appendChild;
// 饿了么组件
const defaultWhilteListClass = ['pp-select-dropdown', 'pp-popper', 'pp-dialog__wrapper',
  'el-select-dropdown', 'el-popper', 'el-dialog__wrapper'];
export default function patch(appInstanceId:string, globalComponentClass?:boolean|string[]) {
  document.body.appendChild = function appendChildWrapper<T extends Node>(node:T) {
    const componentClassName = (node as any).className as string;
    let globalClass = [...defaultWhilteListClass];
    if (globalComponentClass && typeof globalComponentClass === 'object' && globalComponentClass.length) {
      globalClass = [...defaultWhilteListClass, ...globalComponentClass];
    }
    if (globalClass.some(
      (cls:string) => componentClassName.indexOf(cls) !== -1,
    )) {
      const appElement = document.getElementById(appInstanceId);
      if (appElement) {
        appElement.appendChild(node);
      } else {
        rawBodyAppendChild.call(document.body, node);
      }
    } else {
      rawBodyAppendChild.call(document.body, node);
    }
    return node;
  };
  return function free() {
    document.body.appendChild = rawBodyAppendChild;
    return noop;
  };
}
