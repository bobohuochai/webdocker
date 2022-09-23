import Vue, { ComponentOptions } from 'vue';

declare global {
  interface Window {
    __POWERED_BY_WEBDOCKER__?: boolean;
    __INJECTED_PUBLIC_PATH_BY_WEBDOKCER__?: string;
  }
}
let instance:Vue|null = null;
export const mount = (options:ComponentOptions<Vue>) => {
  const { el, ...rest } = options;
  // 正常启动
  if (!window.__POWERED_BY_WEBDOCKER__) {
    return new Vue({
      el,
      ...rest,
    });
  }
  // 微服务模式
  return {
    mount: (props = {}) => {
      const { container } = props as any;
      instance = new Vue({
        el: container,
        ...rest,
      });
    },
    unmount: () => {
      if (instance) {
        instance.$destroy();
        instance.$el.innerHTML = '';
        instance = null;
      }
    },
  };
};
