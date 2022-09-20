/* eslint-disable no-param-reassign */
import type { FrameworkLifecycles } from '../interface';

export default function getAddOn(global:Window):FrameworkLifecycles<any> {
  return {
    async beforeLoad() {
      global.__POWERED_BY_WEBDOCKER__ = true;
    },
    async beforeMount() {
      global.__POWERED_BY_WEBDOCKER__ = true;
    },
    async beforeUnmount() {
      global.__POWERED_BY_WEBDOCKER__ = false;
    },
  };
}
