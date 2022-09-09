import type { AppLifeCycles } from '../interface';

export default function getAddOn(global:Window):AppLifeCycles<any> {
  return {
    async beforeMount() {
      // eslint-disable-next-line no-param-reassign
      global.__POWERED_BY_WEBDOCKER__ = true;
    },
    async beforeUnmount() {
      // eslint-disable-next-line no-param-reassign
      global.__POWERED_BY_WEBDOCKER__ = false;
    },
  };
}
