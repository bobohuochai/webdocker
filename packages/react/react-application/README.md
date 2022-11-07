# @webdocker/react-host-application
宿主应用（react)使用@webdocker框架接入微应用

## 安装

```bash
npm install @webdocker/react-host-application
```

## 使用
```tsx
/* eslint-disable import/no-extraneous-dependencies */
import React from 'react'
import Appcation from '@webdocker/react-host-application'

export default function LightYearMicroApp() {
  return (
    <Appcation
      name="LightYearMicroApp"
      manifest={{
        scripts: [
          'https://dev-cdn17.pingpongx.com/lightyear_file/22.8.4.4.1/my-lib.umd.js',
        ],
        styles: [
          'https://dev-cdn17.pingpongx.com/lightyear_file/22.8.4.4.1/my-lib.css',
        ],
      }}
      initialPath="/lightyear/collection/advanceCollectionhome"
      config={{ sandbox: { iframe: true }, dynamicPatch: true }}
    />
  )
}
```

## Props

| property | type | description |
| ------ | --------- | --------------- |
| name | string | 必填，子应用名称 |
| manifest | object | 必填，{styles:string[],scripts:string[]}，子应用静态资源  |
| initialPath | string | 选填，微应用初始路径，只有在sandbox 为iframe 时生效 |
|config|object| 选填，{sandbox?: boolean \| { iframe: boolean;};dynamicPatch?: boolean;},默认开启proxy 沙箱,sandbox 表示 是否使用沙箱，是否使用iframe沙箱库，dynamicPatch 默认不开启懒加载， 表示微应用是否开启懒加载,|
|loading|boolean\|object|选填，boolean\|React.ReactElement|
|error|boolean\|object|选填，boolean\|React.ReactElement|
|microAppDidMount|function|选填，微应用加载完成后的处理函数|
|microAppDidUnmount|function|选填，微应用卸载完成后的处理函数|
|microAppDidCatch|function|选填，微应用加载错误处理函数|


