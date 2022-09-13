import { AppLifeCycles } from '../interface';
export default function getAddons<T extends Record<string, any>>(global: Window): AppLifeCycles<T>;
