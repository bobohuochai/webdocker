import ProxySandbox from './proxySandbox';
export declare function createSandboxContainer(appName: string, globalContext?: typeof window): {
    instance: ProxySandbox;
    mount(): Promise<void>;
    unmount(): Promise<void>;
};
