import { event } from '../src/index';

describe('event', () => {
  test('event should work well', () => {
    const eventFunction = jest.fn();
    const eventKey = 'testEvent';
    expect(event.has(eventKey)).toBe(false);
    event.on(eventKey, eventFunction);
    expect(event.has(eventKey)).toBe(true);
    event.emit(eventKey, 'testData');
    expect(eventFunction).toBeCalledTimes(1);
    expect(eventFunction).toBeCalledWith('testData');
    event.off(eventKey, eventFunction);
    expect(event.has(eventKey)).toBe(false);
  });
});
