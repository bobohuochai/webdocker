# Vue Microapp Entry

将原本微应用入口包装一下，导出 **{mount: (props?: {}) => void;unmount: () => void;}** 对象，使之可以被宿主应用使用。

## How to use
```vue(2.x)

import { mount } from "@webdocker/vue-microapp-entry"

const microApp = mount({el:'#app',router,store,render:h=>h(App)})

export default microApp

```

## 注意

微应用(vue2.x)使用Vue构造器启动才可使用该包改造。

```vue(2.x)

new Vue(el:'#app',render:h=>h(App))

```