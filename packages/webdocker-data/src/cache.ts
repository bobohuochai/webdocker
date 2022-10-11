const namespace = '_WEBDOCKER_CACHE';

export const getCache = (key:string):any => {
  const webdocker = window[namespace];
  return webdocker && webdocker[key] ? webdocker[key] : null;
};

export const setCache = (key:string, value:any):void => {
  if (!window[namespace]) {
    window[namespace] = {};
  }
  window[namespace][key] = value;
};
