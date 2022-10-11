# @webdocker/data

> webdocker apps communication solution. [webdocker docs](https://git.pingpongx.org/front/micro-front/webdocker).



## Installation

```bash
npm install @webdocker/data --save
```

## API

### Store

Global Store, unified management of all variables

- get(key)
- set(key, value)
- on(key, callback, force), when `force` is true, callback will be called immediately when initializing
- off(key, callback)

#### example

```javascript
//  宿主应用或微应用
import { store } from '@webdocker/data';

const userInfo = { name: 'Tom', age: 18 };
store.set('user', userInfo); // set UserInfo
store.set('language', 'CH');

//  宿主应用或微应用
import { store } from '@webdocker/data';

const userInfo = store.get('user'); // get UserInfo

function showLang(lang) {
  console.log(`current language is ${lang}`);
}

store.on('language', showLang, true); // add callback for 'language', callback will be called whenever 'language' is changed

store.off('language', showLang); // remove callback for 'language'
```


### Event

Global Event, unified management of all events

- on(key, callback)  `callback` will be called with (...rest)
- off(key, callback)
- emit(key, ...rest)

#### example

```javascript
// 宿主应用或微应用
import { event } from '@webdocker/data';

function fresh(needFresh) {
  if (!needFresh) return;

  fetch('/api/fresh/message').then(res => {
    // ...
  });
}

event.on('freshMessage', fresh);

//  宿主应用或微应用
import { event } from '@webdocker/data';

event.emit('freshMessage', false);
// ...
event.emit('freshMessage', true);
```



## License

[MIT](LICENSE)
