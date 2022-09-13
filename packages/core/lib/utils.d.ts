export declare class Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
    constructor();
}
export declare function getDefaultTplWrapper(name: string): (tpl: string) => string;
export declare const nativeGlobal: any;
/**
   * Get app instance name with the auto-increment approach
   * @param appName
   */
export declare const genAppInstanceIdByName: (appName: string) => string;
export declare function toArray<T>(array: T | T[]): T[];
