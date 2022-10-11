export function isArray(value:any):boolean {
  return Object.prototype.toString.call(value) === '[object Array]';
}

export function isObject(value:any):boolean {
  return Object.prototype.toString.call(value) === '[object Object]';
}
