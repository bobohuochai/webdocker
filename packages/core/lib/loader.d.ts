import { LoadableApp, FrameworkConfiguration, FrameworkLifecycles } from './interface';
export declare function loadApp<T>(app: LoadableApp<T>, config?: FrameworkConfiguration, lifeCycles?: FrameworkLifecycles<T>): Promise<{
    name: string;
    mount: () => Promise<void>;
    unmount: () => Promise<void>;
}>;
