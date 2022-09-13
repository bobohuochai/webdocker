import { mergeWith, concat } from 'lodash';
import getFrameworkFlagAddon from './frameworkFlag';
export default function getAddons(global) {
    return mergeWith({}, getFrameworkFlagAddon(global), function (v1, v2) { return concat(v1 !== null && v1 !== void 0 ? v1 : [], v2 !== null && v2 !== void 0 ? v2 : []); });
}
