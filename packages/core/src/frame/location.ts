/**
 * iframe window location 代理
 */
class LocationProxy {
  proxy:Location;

  constructor(location:Location) {
    const tempLocation = location as any;
    this.proxy = new Proxy({}, {
      set(_, name, value) {
        switch (name) {
          case 'href':
            break;
          default:
            tempLocation[name] = value;
        }
        return true;
      },
      get(target, name) {
        if (typeof tempLocation[name] === 'function') {
          return tempLocation[name].bind && tempLocation[name].bind(target);
        }
        return tempLocation[name];
      },
    }) as Location;
  }
}

export default LocationProxy;
