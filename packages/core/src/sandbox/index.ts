import ProxySandbox from './proxySandbox';
import { patchAtMounting } from '../patch';
import { FrameworkConfiguration } from '../interface';

type Freer = () => (...args: any[]) => void

export function createSandboxContainer(
  appName:string,
  elementGetter: () => HTMLElement,
  config: FrameworkConfiguration,
  globalContext?: typeof window,
) {
  const sandbox = new ProxySandbox(appName, globalContext);
  let mountingFreers:Freer[] = [];
  return {
    instance: sandbox,
    async mount() {
      sandbox.active();
      /* ------------------------------------------ 2. 开启全局变量补丁 ------------------------------------------*/
      // render 沙箱启动时开始劫持各类全局监听，尽量不要在应用初始化阶段有 事件监听/定时器 等副作用
      mountingFreers = patchAtMounting(appName, elementGetter, sandbox, config);
    },

    /**
     * 恢复 global 状态，使其能回到应用加载之前的状态
     */
    async unmount() {
      [...mountingFreers].map((free) => free());
      sandbox.inactive();
    },
  };
}
