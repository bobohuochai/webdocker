import { SandBox } from '../interface';
export declare function patchAtMounting(sandbox: SandBox): (() => (...args: any[]) => void)[];
