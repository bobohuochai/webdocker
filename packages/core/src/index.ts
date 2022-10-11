/**
 * https://github.com/umijs/qiankun
 * 模仿乾坤微前端
 */
import { loadApp } from './loader';
import { prefetchApps } from './prefetch';

export { loadApp } from './loader';

export { prefetchApps } from './prefetch';

export * from './interface';

export default { loadApp, prefetchApps };
