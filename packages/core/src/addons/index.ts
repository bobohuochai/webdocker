import { mergeWith, concat } from 'lodash';
import { FrameworkLifecycles } from '../interface';
import getFrameworkFlagAddon from './frameworkFlag';

export default function getAddons<T extends Record<string, any>>(global:Window):FrameworkLifecycles<T> {
  return mergeWith(
    {},
    getFrameworkFlagAddon(global),
    (v1, v2) => concat(v1 ?? [], v2 ?? []),
  );
}
