
# webdocker

> 微前端解决方案

## 开始使用

### 安装

```bash
npm install @webdocker/core 
```

### 宿主应用

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
        }})
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


### 微应用

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

## 原因

为什么市面上有这么多微前端框架了，还要自己造一遍轮子。

- 针对公司内部需要，以lib形式组合各个部门的业务，对现有代码改动最小。
  
- 针对公司目前代码状况，作一些特殊处理：
  * 比如针对Vue全局变量的问题；
  * 比如放弃引入single-spa 库，也就是放弃了路由劫持的改造，由宿主应用和微应用自己处理路由（如果有需要的话），一般就是宿主应用需要分配一个微应用前缀，比如微应用/microapp/create,/microapp/1等路由，则宿主应用需要分配一个/microapp/* 的路由。
等等还有很多。

- 市面上微前端框架各有千秋，比如 **qiankun** 在sandbox 处理上比较出色，**alibabacloud-alfa** 在整个功能完善度上最高，**icestark** 比较容易入手。希望能集成各个框架的优势，取长补短。
  
- 遇到问题，可以马上投入解决，毕竟公司自己的东西，不需要在等待了别人了。⌚️ 就是一切

- 一点私心，知其所以然，造轮子的过程，理解框架怎么写出来的过程实在太棒了。😄 🚀
  


## 感谢

[qiankun](https://github.com/umijs/qiankun)

[alibabacloud-alfa](https://github.com/aliyun/alibabacloud-alfa)

[icestark](https://github.com/ice-lab/icestark)

## License

[MIT](LICENSE)
