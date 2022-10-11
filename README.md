
# webdocker

> Micro Frontends solution for large application.

## Getting Started

### Install

```bash
npm install @webdocker/core 
```

### Main application

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
            scripts:[`https://dev-cdn17.pingpongx.com/lightyear_file/22.8.4.4.1/my-lib.umd.js`],
            styles:[ `https://dev-cdn17.pingpongx.com/lightyear_file/22.8.4.4.1/my-lib.css`]
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


### Micro app

Micro app should export lifecycles(umd) ways.

```javascript
import React from 'react'
import { createRoot } from 'react-dom/client'
import { unmountComponentAtNode } from 'react-dom'
import 'antd/dist/antd.css'
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

sub-application should be bundled as an UMD module, add the following configuration of webpack:

```javascript
module.exports = {
  output: {
    library: 'sub-app-name',
    libraryTarget: 'umd',
  },
};
```


## Thanks

[qiankun](https://github.com/umijs/qiankun)

[alibabacloud-alfa](https://github.com/aliyun/alibabacloud-alfa)

[icestark](https://github.com/ice-lab/icestark)

## License

[MIT](LICENSE)
