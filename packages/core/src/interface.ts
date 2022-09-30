declare global {
  interface Window {
    __POWERED_BY_WEBDOCKER__?: boolean;
    __INJECTED_PUBLIC_PATH_BY_WEBDOKCER__?: string;
  }
}
export type WindowProxy = Window

export type SandBox = {
  /** 沙箱的名字 */
  name: string;
  /** 沙箱导出的代理实体 */
  proxy: WindowProxy;
  /** 沙箱是否在运行中 */
  sandboxRunning: boolean;
  /** latest set property */
  latestSetProp?: PropertyKey | null;
  /** 启动沙箱 */
  active: () => void;
  /** 关闭沙箱 */
  inactive: () => void;
}

export interface LoadableApp<T extends Record<string, any>> {
  name:string
  entry:{ styles?: string[], scripts?: string[], html?: string };
  container:string | HTMLElement,
  props?:T
}

export type LifecycleFn<T extends Record<string, any>> = (app?:LoadableApp<T>, global?:typeof window)=>Promise<any>

export type FrameworkLifecycles<T extends Record<string, any>> = {
  beforeMount?: LifecycleFn<T> | Array<LifecycleFn<T>>; // function before app mount
  beforeUnmount?: LifecycleFn<T> | Array<LifecycleFn<T>>;
  beforeLoad?:LifecycleFn<T> | Array<LifecycleFn<T>>;
}

export type ExportLifeCycleFn<ExtraProps extends Record<string, any>> = (config:ExtraProps
& LoadableApp<ExtraProps>) =>Promise<any>

export type AppLifecycles<ExtraProps> = {
  mount: ExportLifeCycleFn<ExtraProps>
  unmount: ExportLifeCycleFn<ExtraProps>
}

export type FrameworkConfiguration = {
  globalContext?:typeof window,
  sandbox?:boolean,
  dynamicPatch?:boolean
}

export type ContainerConfig = {
  appName: string;
  proxy: WindowProxy;
  dynamicStyleSheetElements: Array<HTMLStyleElement | HTMLLinkElement>;
  appWrapperGetter: (...args:any[])=>any;
};
