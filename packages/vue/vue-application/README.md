# @webdocker/vue-host-application
宿主应用（Vue 2.x)使用@webdocker框架接入微应用

## How to use
```vue(2.x)
<template>
    <Application
        name=""
        class="test-class"
        :manifest="{styles:['https://dev-cdn17.pingpongx.com/lightyear_file/22.8.4.4.1/my-lib.css'],
        scripts:['https://dev-cdn17.pingpongx.com/lightyear_file/22.8.4.4.1/my-lib.umd.js']}" />
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


