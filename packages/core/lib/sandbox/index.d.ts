import ProxySandbox from './proxySandbox';
export declare function createSandboxContainer(appName: string, globalContext?: typeof window): {
    instance: ProxySandbox;
    mount(): Promise<void>;
    /**
     * 恢复 global 状态，使其能回到应用加载之前的状态
     */
    unmount(): Promise<void>;
};
