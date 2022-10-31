import Context from '../src/frame/context';

describe('iframe', () => {
  window.test1 = 1;
  const id = 'context-test1';
  const divElement = document.createElement('div');
  divElement.innerHTML = 'test';
  divElement.setAttribute('id', id);
  document.body.append(divElement);

  it('context window works will', async () => {
    const context = await Context.create({
      id: 'test-context-window',
      url: 'about:blank',
    });
    expect(context.window.test1).toBe(undefined);
    expect(context.window.self).toEqual(context.window);
  });

  it('context body works will', async () => {
    const context = await Context.create({
      id: 'test-context-body',
      url: 'about:blank',
    });
    expect(context.body.firstChild?.textContent).toEqual('test');
  });

  it('context document works will', async () => {
    const context = await Context.create({
      id: 'test-context-document',
      url: 'about:blank',
    });
    const tempStyle = context.document.createElement('style') as any;
    expect(tempStyle._evalScriptInSandbox).toBe(true);
  });

  it('context location and history work will', async () => {
    const context = await Context.create({
      id: 'test-context-location-history',
      url: 'about:blank',
    });
    context.history.replaceState(null, '', '/test');
    expect(context.location.pathname).toBe('/test');
    expect(window.location.pathname).toBe('/');
  });
});
