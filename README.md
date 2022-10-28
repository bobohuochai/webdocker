
# webdocker

> 微前端解决方案

| 包 | 文档  | 描述 |
| ------|------------------| ---------- |
| @webdocker/core | https://git.pingpongx.org/front/micro-front/webdocker/-/tree/master/packages/core |  核心库 |
| @webdocker/data |https://git.pingpongx.org/front/micro-front/webdocker/-/tree/master/packages/webdocker-data  | 应用之间通信库  |
| @webdocker/vue-host-application | https://git.pingpongx.org/front/micro-front/webdocker/-/tree/master/packages/vue/vue-application | vue宿主应用桥接库 |
| @webdocker/vue-microapp-entry | https://git.pingpongx.org/front/micro-front/webdocker/-/tree/master/packages/vue/vue-microapp | vue 微应用入口桥接库 |

## 原因

为什么市面上有这么多微前端框架了，还要自己造一遍轮子。

- 针对公司内部需要，以lib形式组合各个部门的业务，对现有代码改动最小。
  
- 针对公司目前代码状况，作一些特殊处理：
  * 比如针对Vue全局变量的问题；
  * 比如放弃引入single-spa 库，也就是放弃了路由劫持的改造，由宿主应用和微应用自己处理路由（如果有需要的话），一般就是宿主应用需要分配一个微应用前缀，比如微应用/microapp/create,/microapp/1等路由，则宿主应用需要分配一个/microapp/* 的路由。
等等还有很多。

- 市面上微前端框架各有千秋，比如 **qiankun** 在sandbox 处理上比较出色，**alibabacloud-alfa** 在整个功能完善度上最高，**icestark** 比较容易入手。希望能集成各个框架的优势，取长补短。
  
- 遇到问题，可以马上投入解决，毕竟公司自己的东西，不需要在等待了别人了。⌚️ 就是一切

  


## 感谢

[qiankun](https://github.com/umijs/qiankun)

[alibabacloud-alfa](https://github.com/aliyun/alibabacloud-alfa)

[icestark](https://github.com/ice-lab/icestark)

## License

[MIT](LICENSE)
