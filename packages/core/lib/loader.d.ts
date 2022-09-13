import { LoadableApp, FrameworkConfiguration, AppLifeCycles } from './interface';
export declare function loadApp<T>(app: LoadableApp<T>, config?: FrameworkConfiguration, lifeCycles?: Pick<AppLifeCycles<T>, 'beforeMount' | 'beforeUnmount' | 'beforeLoad'>): Promise<{
    name: string;
    mount: () => Promise<void>;
    unmount: () => Promise<void>;
}>;
