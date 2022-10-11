export type EventCallback = (...args:any[])=>void
export interface EventEmitter {
  emit(key:string, value:any):void
  on(key:string, callback:EventCallback):void
  off(key:string, callback?:EventCallback):void
  has(key:string):boolean
}
