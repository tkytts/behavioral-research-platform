describe('connection module', () => {
  let mockOn;
  let mockOff;
  let mockStart;
  let mockInvoke;
  let mockOnreconnected;
  let mockOnreconnecting;
  let mockWithUrl;
  let mockWithAutomaticReconnect;

  beforeEach(() => {
    jest.resetModules();

    // Setup fresh mocks for each test
    mockOn = jest.fn();
    mockOff = jest.fn();
    mockStart = jest.fn();
    mockInvoke = jest.fn();
    mockOnreconnected = jest.fn();
    mockOnreconnecting = jest.fn();
    mockWithUrl = jest.fn().mockReturnThis();
    mockWithAutomaticReconnect = jest.fn().mockReturnThis();

    const mockConnection = {
      on: mockOn,
      off: mockOff,
      start: mockStart,
      invoke: mockInvoke,
      onreconnected: mockOnreconnected,
      onreconnecting: mockOnreconnecting
    };

    // Mock SignalR with doMock (works with resetModules)
    jest.doMock('@microsoft/signalr', () => ({
      HubConnectionBuilder: jest.fn(() => ({
        withUrl: mockWithUrl,
        withAutomaticReconnect: mockWithAutomaticReconnect,
        build: jest.fn(() => mockConnection)
      }))
    }));

    // Mock config
    jest.doMock('../config', () => ({
      __esModule: true,
      default: { hubUrl: 'http://test-server/gamehub' }
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('builds connection with correct hub URL', () => {
    mockStart.mockResolvedValueOnce(undefined);

    require('../connection');

    expect(mockWithUrl).toHaveBeenCalledWith('http://test-server/gamehub');
  });

  it('enables automatic reconnect', () => {
    mockStart.mockResolvedValueOnce(undefined);

    require('../connection');

    expect(mockWithAutomaticReconnect).toHaveBeenCalled();
  });

  it('starts connection on module load', () => {
    mockStart.mockResolvedValueOnce(undefined);

    require('../connection');

    expect(mockStart).toHaveBeenCalled();
  });

  it('exports connectionReady promise', async () => {
    mockStart.mockResolvedValueOnce(undefined);

    const { connectionReady } = require('../connection');

    await expect(connectionReady).resolves.toBeUndefined();
  });

  it('adds emit alias to connection', () => {
    mockStart.mockResolvedValueOnce(undefined);

    const connection = require('../connection').default;

    expect(connection.emit).toBeDefined();
  });

  it('resolves connectionReady even on connection error (retry handled by invoke)', async () => {
    const error = new Error('Connection failed');
    mockStart.mockRejectedValueOnce(error);

    const { connectionReady } = require('../connection');

    await expect(connectionReady).resolves.toBeUndefined();
  });

  it('registers onreconnecting handler', () => {
    mockStart.mockResolvedValueOnce(undefined);
    require('../connection');
    expect(mockOnreconnecting).toHaveBeenCalledWith(expect.any(Function));
  });

  it('registers onreconnected handler', () => {
    mockStart.mockResolvedValueOnce(undefined);
    require('../connection');
    expect(mockOnreconnected).toHaveBeenCalledWith(expect.any(Function));
  });

  it('connectionReady is pending while reconnecting, then resolves on reconnected', async () => {
    mockStart.mockResolvedValueOnce(undefined);
    const mod = require('../connection');

    // Simulate reconnecting: fire the onreconnecting callback
    const reconnectingHandler = mockOnreconnecting.mock.calls[0][0];
    reconnectingHandler();

    // connectionReady should now be a new pending promise
    let resolved = false;
    mod.connectionReady.then(() => { resolved = true; });
    await Promise.resolve(); // flush microtasks
    expect(resolved).toBe(false);

    // Simulate reconnected: fire the onreconnected callback
    const reconnectedHandler = mockOnreconnected.mock.calls[0][0];
    reconnectedHandler();

    await mod.connectionReady;
    expect(resolved).toBe(true);
  });

  describe('listener pattern', () => {
    it('exports onConnectionStatusChange as a function', () => {
      mockStart.mockResolvedValueOnce(undefined);
      const { onConnectionStatusChange } = require('../connection');
      expect(typeof onConnectionStatusChange).toBe('function');
    });

    it('listener receives connected when start resolves', async () => {
      mockStart.mockResolvedValueOnce(undefined);
      const { onConnectionStatusChange } = require('../connection');
      const listener = jest.fn();
      onConnectionStatusChange(listener);
      await Promise.resolve(); // flush start().then()
      expect(listener).toHaveBeenCalledWith('connected');
    });

    it('listener receives failed when start rejects', async () => {
      mockStart.mockRejectedValueOnce(new Error('Connection failed'));
      const { onConnectionStatusChange } = require('../connection');
      const listener = jest.fn();
      onConnectionStatusChange(listener);
      await Promise.resolve(); // flush rejected .then()
      await Promise.resolve(); // flush .catch()
      expect(listener).toHaveBeenCalledWith('failed');
    });

    it('listener receives reconnecting when onreconnecting fires', () => {
      mockStart.mockResolvedValueOnce(undefined);
      const { onConnectionStatusChange } = require('../connection');
      const listener = jest.fn();
      onConnectionStatusChange(listener);
      const reconnectingCb = mockOnreconnecting.mock.calls[0][0];
      reconnectingCb();
      expect(listener).toHaveBeenCalledWith('reconnecting');
    });

    it('listener receives connected when onreconnected fires', () => {
      mockStart.mockResolvedValueOnce(undefined);
      const { onConnectionStatusChange } = require('../connection');
      const listener = jest.fn();
      onConnectionStatusChange(listener);
      const reconnectedCb = mockOnreconnected.mock.calls[0][0];
      reconnectedCb();
      expect(listener).toHaveBeenCalledWith('connected');
    });

    it('cleanup function removes listener', () => {
      mockStart.mockResolvedValueOnce(undefined);
      const { onConnectionStatusChange } = require('../connection');
      const listener = jest.fn();
      const cleanup = onConnectionStatusChange(listener);
      cleanup();
      const reconnectingCb = mockOnreconnecting.mock.calls[0][0];
      reconnectingCb();
      expect(listener).not.toHaveBeenCalled();
    });

    it('multiple listeners all receive notifications', () => {
      mockStart.mockResolvedValueOnce(undefined);
      const { onConnectionStatusChange } = require('../connection');
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      onConnectionStatusChange(listener1);
      onConnectionStatusChange(listener2);
      const reconnectingCb = mockOnreconnecting.mock.calls[0][0];
      reconnectingCb();
      expect(listener1).toHaveBeenCalledWith('reconnecting');
      expect(listener2).toHaveBeenCalledWith('reconnecting');
    });
  });
});
