import { renderHook, act } from '@testing-library/react';

import { useConnectionStatus } from '../useConnectionStatus';
import { onConnectionStatusChange } from '../../connection';

jest.mock('../../connection', () => ({
  onConnectionStatusChange: jest.fn(),
}));

describe('useConnectionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns connecting initially', () => {
    onConnectionStatusChange.mockReturnValue(jest.fn());
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe('connecting');
  });

  it('subscribes via onConnectionStatusChange on mount', () => {
    onConnectionStatusChange.mockReturnValue(jest.fn());
    renderHook(() => useConnectionStatus());
    expect(onConnectionStatusChange).toHaveBeenCalledTimes(1);
    expect(onConnectionStatusChange).toHaveBeenCalledWith(expect.any(Function));
  });

  it('status updates when listener is called', () => {
    let capturedListener;
    const cleanupFn = jest.fn();
    onConnectionStatusChange.mockImplementation(fn => {
      capturedListener = fn;
      return cleanupFn;
    });
    const { result } = renderHook(() => useConnectionStatus());
    act(() => { capturedListener('failed'); });
    expect(result.current).toBe('failed');
  });

  it('calls cleanup on unmount', () => {
    const cleanupFn = jest.fn();
    onConnectionStatusChange.mockReturnValue(cleanupFn);
    const { unmount } = renderHook(() => useConnectionStatus());
    unmount();
    expect(cleanupFn).toHaveBeenCalled();
  });
});
