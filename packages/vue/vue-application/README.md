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
|config|object| 选填，webdocker相关配置,详情见下文|

## config 属性详情

| property | type | description |
| ------ |-------------|---------------|
|sandbox|boolean\| {iframe: boolean}|选填，默认开启proxy 沙箱，当值为布尔类型时表示是否开启沙箱；当值为{iframe:true} 表示开启iframe 沙箱。 |
|dynamicPatch| boolean |选填，默认为true,表示微应用是否懒加载|
|globalComponentClassPatch| boolean \| string[] | 选填，默认为['pp-select-dropdown', 'pp-popper', 'pp-dialog__wrapper','el-select-dropdown', 'el-popper', 'el-dialog__wrapper'],当值为布尔类型时，表示是否需要拦截弹窗，下拉等组件样式逃离问题，当值为string[]时，表示该组件的class，表示该组件也需要拦截样式问题 |



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


  