describe('connection module', () => {
  let mockOn;
  let mockOff;
  let mockStart;
  let mockInvoke;
  let mockOnreconnected;
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
    mockWithUrl = jest.fn().mockReturnThis();
    mockWithAutomaticReconnect = jest.fn().mockReturnThis();

    const mockConnection = {
      on: mockOn,
      off: mockOff,
      start: mockStart,
      invoke: mockInvoke,
      onreconnected: mockOnreconnected
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

  describe('invoke override', () => {
    it('waits for connection before invoking', async () => {
      let resolveStart;
      mockStart.mockReturnValueOnce(new Promise(resolve => {
        resolveStart = resolve;
      }));
      mockInvoke.mockResolvedValueOnce('result');

      const connection = require('../connection').default;

      // Start invoke (should wait for connection)
      const invokePromise = connection.invoke('TestMethod', 'arg1');

      // Resolve connection
      resolveStart();

      const result = await invokePromise;
      expect(result).toBe('result');
    });
  });
});
