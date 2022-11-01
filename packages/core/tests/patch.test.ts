import setIntervalPatch from '../src/patch/interval';

function sleep(ms:number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

test('setInterval patcher work', async () => {
  const free = setIntervalPatch(window);
  const clearedListener = jest.fn();
  const unclearedListener = jest.fn();
  const unclearedListenerWithArgs = jest.fn();

  const interval1 = window.setInterval(clearedListener, 60);
  window.setInterval(unclearedListener, 10);
  window.setInterval(unclearedListenerWithArgs, 30, 'hello');
  window.clearInterval(interval1);

  await sleep(23);

  free();

  expect(clearedListener).toBeCalledTimes(0);
  expect(unclearedListener).toBeCalledTimes(2);
  expect(unclearedListenerWithArgs).toBeCalledTimes(0);
});
