import Context from './context';
import { patchAtMounting } from '../patch';
import { FrameworkConfiguration, SandboxType } from '../interface';

type Freer = () => (...args: any[]) => void

export async function createIframeContainer(
  appId:string,
  elementGetter: () => HTMLElement,
  config: FrameworkConfiguration,
) {
  const sandbox = await Context.create({ id: appId });

  let mountingFreers:Freer[] = [];
  return {
    instance: sandbox,
    sandboxType: SandboxType.IFRAME,
    async mount() {
      /* ------------------------------------------ 2. 开启全局变量补丁 ------------------------------------------*/
      // render 沙箱启动时开始劫持各类全局监听，尽量不要在应用初始化阶段有 事件监听/定时器 等副作用
      mountingFreers = patchAtMounting(appId, elementGetter, sandbox, config);
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
