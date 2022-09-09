import { LoadableApp } from './interface';
export declare function getDefaultTplWrapper(name: string): (tpl: string) => string;
export declare function loadApp<T>({ container, name, entry }: LoadableApp<T>): Promise<{
    mount: () => void;
}>;
