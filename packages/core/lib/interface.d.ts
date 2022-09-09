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
