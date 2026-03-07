import { typeMessage } from '../typeMessage';

jest.useFakeTimers();

describe('typeMessage', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('calls onCharacter with successive partial strings', () => {
    const onCharacter = jest.fn();
    typeMessage('hi', { delay: 50, onCharacter });

    jest.advanceTimersByTime(50);
    expect(onCharacter).toHaveBeenNthCalledWith(1, 'h');

    jest.advanceTimersByTime(50);
    expect(onCharacter).toHaveBeenNthCalledWith(2, 'hi');
  });

  it('calls onComplete with the full message after all characters', () => {
    const onComplete = jest.fn();
    typeMessage('ab', { delay: 10, onComplete });

    jest.advanceTimersByTime(20);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('ab');
  });

  it('calls onComplete exactly once', () => {
    const onComplete = jest.fn();
    typeMessage('x', { delay: 10, onComplete });

    jest.advanceTimersByTime(1000);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('returns a numeric interval ID', () => {
    const id = typeMessage('a', { delay: 100 });
    expect(typeof id).toBe('number');
    jest.advanceTimersByTime(100);
  });

  it('uses 100ms delay by default', () => {
    const onCharacter = jest.fn();
    typeMessage('a', { onCharacter });

    jest.advanceTimersByTime(99);
    expect(onCharacter).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onCharacter).toHaveBeenCalledTimes(1);
  });

  it('does not call onCharacter before the first tick', () => {
    const onCharacter = jest.fn();
    typeMessage('hello', { delay: 50, onCharacter });

    expect(onCharacter).not.toHaveBeenCalled();
  });

  it('stops calling onCharacter after the message is complete', () => {
    const onCharacter = jest.fn();
    typeMessage('ab', { delay: 10, onCharacter });

    jest.advanceTimersByTime(20);
    expect(onCharacter).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(1000);
    expect(onCharacter).toHaveBeenCalledTimes(2);
  });
});
