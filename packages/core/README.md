
# webdocker/core

> 微前端核心库


### 安装

```bash
npm install @webdocker/core 
```


## API

  - [loadApp]
  - [prefetchApps]

#### loadApp(app,config,lifeCycles)

##### 参数

| 函数参数 | type | description |
| ------ | --------- | --------------- |
| app | LoadableApp  | 必填，微应用配置 |
｜config| FrameworkConfiguration| 选填，框架配置｜
｜lifeCycles| FrameworkLifecycles|选填， 生命周期函数Hooks|

##### 返回
- `Promise<{ name: string; mount: () => Promise<void>; unmount: () => Promise<void>;}>`

##### 类型

- LoadableApp
  
| 字段 | type | description |
| ------ | --------- | --------------- |
| name | string  | 必填，微应用名称 |
| entry| '{ styles:string[],scripts:string[]}' | 必填，微应用资源路径 
| container| string | HTMLElement| 必填，微应用容器 |
| initialPath | string | 选填，微应用url |


- FrameworkConfiguration

| 字段 | type | description |
| ------ | --------- | --------------- |
| sandbox | boolean | { iframe:boolean}  | 选填，沙箱类型 |
| dynamicPatch | boolean | 选填，微应用是否需要开启懒加载


##### 开始使用

在使用vue框架的宿主应用加载微应用应用

```vue
<template>
  <div id="lightyear-container"></div>
</template>

<script>
import webDocker from '@webdocker/core'

export default  {
    name:'LightyearDymanic',
    data(){
        return {app:null}
    },
   async mounted(){
       this.app =await webDocker.loadApp({name:'LightYear',container:'#lightyear-container',entry:{
            scripts:[`microapp js url`],
            styles:[ `microapp css url`]
        }, initialPath: '/test'}，{ sandbox: { iframe: true }, dynamicPatch: true })
       this.app.mount()
    },
    beforeDestroy(){
      if(this.app) {
        this.app.unmount()
      }
     
    }
}
</script>

```


#### prefetchApps(appConfig[])

##### 参数

| 函数参数 | type | description |
| ------ | --------- |  ---------------  |
| appConfig | {name:string,entry:{ styles?: string[] scripts?:string[];} | 必填，微应用配置 |


### 开始使用

在宿主应用中预加载微应用

```javascript
import { prefetchApps } from '@webdocker/core'

prefetchApps([
  {
    name: 'I18nMicroApp',
    entry: {
      scripts: [
        `js url`,
      ],
      styles: [`css url`]
    }
  }
])
```




### 微应用要求

微应用应该以umd的方式导出生命周期对象。

```javascript
import React from 'react'
import { createRoot } from 'react-dom/client'
import { unmountComponentAtNode } from 'react-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/lib/locale/zh_CN'
import addModalWrapper from '@/components/hoc/addModalWrapper'
import Layout from '@/components/layout'


let rootElem = document.querySelector('#root')

function render(props) {
  const { container = rootElem } = props
  rootElem = container
  const root = createRoot(rootElem)
  import(
    /* webpackChunkName: "[constant]" */
    '@/components/layout/index'
  ).then(res => {
    const App = addModalWrapper(res.default)
    root.render(
      <ConfigProvider locale={zhCN}>
        <App />
      </ConfigProvider>,
    )
  })
}

const microExportInfo = {
  mount: render,
  unmount() {
    unmountComponentAtNode(rootElem)
  },
}

if (!window.__POWERED_BY_WEBDOCKER__) {
  render({})
}

export default microExportInfo

```

微应用应该打包成UMD模块，添加webpack 如下配置：

```javascript
module.exports = {
  output: {
    library: 'micro-app-name',
    libraryTarget: 'umd',
  },
};
```

## License

[MIT](LICENSE)
