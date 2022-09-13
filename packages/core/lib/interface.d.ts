declare global {
    interface Window {
        __POWERED_BY_WEBDOCKER__?: boolean;
        __INJECTED_PUBLIC_PATH_BY_WEBDOKCER__?: string;
    }
}
export declare type WindowProxy = Window;
export declare type SandBox = {
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
};
export interface LoadableApp<T extends Record<string, any>> {
    name: string;
    entry: {
        styles?: string[];
        scripts?: string[];
        html?: string;
    };
    container: string | HTMLElement;
    props?: T;
}
export declare type LifeCycleFn<T extends Record<string, any>> = (app?: LoadableApp<T>, global?: typeof window) => Promise<any>;
export declare type AppLifeCycles<T extends Record<string, any>> = {
    beforeMount?: LifeCycleFn<T> | Array<LifeCycleFn<T>>;
    beforeUnmount?: LifeCycleFn<T> | Array<LifeCycleFn<T>>;
    mount?: LifeCycleFn<T> | Array<LifeCycleFn<T>>;
    unmount?: LifeCycleFn<T> | Array<LifeCycleFn<T>>;
    beforeLoad?: LifeCycleFn<T> | Array<LifeCycleFn<T>>;
};
export declare type FrameworkConfiguration = {
    globalContext?: typeof window;
    sandbox?: boolean;
};
