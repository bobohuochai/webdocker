import { mergeWith, concat } from 'lodash';
import { AppLifeCycles } from '../interface';
import getFrameworkFlagAddon from './frameworkFlag';

export default function getAddons<T extends Record<string, any>>(global:Window):AppLifeCycles<T> {
  return mergeWith({}, getFrameworkFlagAddon(global), (v1, v2) => concat(v1 ?? [], v2 ?? []));
}
