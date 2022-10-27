/**
 * iframe javascript 执行上下文
 */
import Location from './location';
import Document from './document';
import History from './history';
import Window from './window';
import { SandBox, SandboxType } from '../interface';

export type IframeContextConfig = {
  url?:string
  id:string,
  enableScriptEscape?:boolean
  externals?:string[]
}

class Context implements SandBox {
  name:string;

  sandboxRunning:boolean;

  baseFrame:HTMLIFrameElement;

  location:globalThis.Location;

  document:globalThis.Document;

  history:globalThis.History;

  proxy:globalThis.Window;

  window:globalThis.Window;

  sandboxType = SandboxType.IFRAME;

  _listenerMap;

  body;

  latestSetProp;

  constructor(config:IframeContextConfig, iframe:HTMLIFrameElement) {
    this.name = config.id;
    this.baseFrame = iframe;
    console.log('iframe window', (iframe.contentWindow! as any).browerCollector);
    this.location = new Location(iframe.contentWindow!.location).proxy;
    this.history = new History(config.id, iframe.contentWindow!).proxy;
    this.body = document.body;
    this.document = new Document(this).proxy;
    const instanceWindow = new Window(this, iframe, config);
    // eslint-disable-next-line no-multi-assign
    this.window = this.proxy = instanceWindow.proxy;
    this.sandboxRunning = false;
    this._listenerMap = new Map();
    this.latestSetProp = instanceWindow.latestSetProp;
  }

  updateBody(dom:HTMLElement) {
    this.body = dom;
  }

  async loadScripts(url:string) {
    const resp = await fetch(url);
    const code = await resp.text();
    this.evalScript(code, url);
  }

  evalScript(code:string, url = '') {
    // eslint-disable-next-line no-new-func
    const evalFunction = new Function(`
      return function ({window,location,history,document}){
        with(window.__WEBDOCER_GLOBAL_VARS__){
            try{
                ${code}
            }catch(err){
                console.log(err)
            }
        }
      }//@ sourceMappingURL=${url}
    `);
    evalFunction().call(this.proxy, { ...this });
  }

  inactive() {
    // todo
    this.sandboxRunning = false;
    if (this.baseFrame) {
      if (this.baseFrame.parentNode) {
        this.baseFrame.parentNode.removeChild(this.baseFrame);
      } else {
        this.baseFrame.setAttribute('src', 'about:blank');
      }
    }
  }

  active() {
    this.sandboxRunning = true;
  }

  static create(config:IframeContextConfig):Promise<Context> {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', config.url ? config.url : '/webdockerapi.json');
      iframe.style.cssText = 'position: absolute; top: -20000px; width: 100%; height: 1px;';
      document.body.appendChild(iframe);
      // the onload event will no trigger when src is about:blank
      if (config.url === 'about:blank') {
        resolve(new Context(config, iframe));
        return;
      }
      iframe.onload = () => {
        resolve(new Context(config, iframe));
      };
    });
  }

  static async remove(context:Context) {
    if (context.inactive) {
      context.inactive();
    }
  }
}

export default Context;
