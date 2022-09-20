import { SandBox, WindowProxy } from '../interface';
export default class ProxySandbox implements SandBox {
    updatedValueSet: Set<PropertyKey>;
    name: string;
    proxy: WindowProxy;
    globalContext: typeof window;
    sandboxRunning: boolean;
    latestSetProp: PropertyKey | null;
    active(): void;
    inactive(): void;
    constructor(name: string, globalContext?: Window & typeof globalThis);
}
