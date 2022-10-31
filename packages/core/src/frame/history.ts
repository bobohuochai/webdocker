/* eslint-disable no-param-reassign */
class History {
  proxy:globalThis.History;

  constructor(id:string, frame:globalThis.Window) {
    if (!id) { this.proxy = frame.history; return; }
    const postMessage = () => {
      frame.postMessage({
        type: `${id}:history-change`,
        data: JSON.parse(JSON.stringify(frame.location)),
      }, '*');
    };
    const originalPushStatus = frame.history.pushState;
    const originalReplaceStatus = frame.history.replaceState;
    frame.history.pushState = (...args:any[]) => {
      const ret = originalPushStatus.apply(frame.history, [...args] as any);
      postMessage();
      return ret;
    };
    frame.history.replaceState = (...args:any[]) => {
      const ret = originalReplaceStatus.apply(frame.history, [...args] as any);
      postMessage();
      return ret;
    };

    this.proxy = frame.history;
  }
}

export default History;
