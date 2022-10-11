export type EventCallback = (...args:any[])=>void
export interface EventEmitter {
  emit(key:string, value:any):void
  on(key:string, callback:EventCallback):void
  off(key:string, callback?:EventCallback):void
  has(key:string):boolean
}

export interface IO{
  get(key?:string):any
  set(key:string, value?:any):void
  on(key:string, callback:(value:any)=>void, force?:boolean):void
  off(key:string, callback?:(value:any)=>void):void
  has(key:string):boolean
}
