# @webdocker/vue-host-application
宿主应用（Vue 2.x)使用@webdocker框架接入微应用

## 安装

```bash
npm install @webdocker/vue-host-application
```

## 使用
```vue
<template>
    <Application
        name=""
        class="test-class"
        :manifest="{styles:['https://dev-cdn17.pingpongx.com/lightyear_file/22.8.4.4.1/my-lib.css'],
        scripts:['https://dev-cdn17.pingpongx.com/lightyear_file/22.8.4.4.1/my-lib.umd.js']}"
        initialPath='/lightyear/collection/advanceCollectionhome'
        :config="{ sandbox: { iframe: true }, dynamicPatch: true }"
        />
    />
</template>
<script >
import Application from @webdocker/vue-host-application
export default {
  name: 'Example',
  components: {
    Application
  }
}
</script>
```

## Props

| property | type | description |
| ------ | --------- | --------------- |
| name | string | 必填，子应用名称 |
| manifest | object | 必填，{styles:string[],scripts:string[]}，子应用静态资源  |
| initialPath | string | 选填，微应用初始路径，只有在sandbox 为iframe 时生效 |
|config|object| 选填，{sandbox?: boolean \| { iframe: boolean;};dynamicPatch?: boolean;},默认开启proxy 沙箱，sandbox表示 是否使用沙箱，是否使用iframe沙箱库，dynamicPatch 表示微应用是否开启懒加载|


## Slots
| slot | description |
| ------ | --------------- |
| loading | 自定义微应用加载中组件 |
| error | 自定义微应用加载错误组件 |


## Events

| event | params | description |
| ------ |---------| --------------- |
| microAppDidMount| App:{ name: string; mount: () => Promise<void>; unmount: () => Promise<void>;} | 微应用加载完成事件 |
| microAppDidCatch | Error | 微应用加载错误事件 |
| microAppDidUnmount | App:同上 | 微应用卸载完成事件 |


  