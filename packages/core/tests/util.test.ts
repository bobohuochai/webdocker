import {
  genAppInstanceIdByName, Deferred, getDefaultTplWrapper, toArray,
} from '../src/utils';

test('should genAppInstanceIdByName works well', () => {
  const instanceId1 = genAppInstanceIdByName('appName');
  expect(instanceId1).toBe('appName');

  const instanceId2 = genAppInstanceIdByName('appName');
  expect(instanceId2).toBe('appName_1');

  const instanceId3 = genAppInstanceIdByName('appName');
  expect(instanceId3).toBe('appName_2');
});

test('should Deferred works well', async () => {
  const defer = new Deferred();
  setTimeout(() => {
    defer.resolve(233);
  });
  const ret = await defer.promise;
  expect(ret).toBe(233);
});

test('should getDefaultTplWrapper works well', () => {
  const tpl = '<div>webdocker</div>';
  const factory = getDefaultTplWrapper('name1');
  const ret = factory(tpl);
  expect(ret).toBe('<div id="name1" data-name="name1"><div>webdocker</div></div>');
});

test('should toArray works well', () => {
  const retNoArr = toArray(1);
  expect(retNoArr).toEqual([1]);
  const retArr = toArray([1]);
  expect(retArr).toEqual([1]);
});
