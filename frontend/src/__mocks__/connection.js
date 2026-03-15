// Mock for connection.js
const mockConnection = {
  on: jest.fn(),
  off: jest.fn(),
  invoke: jest.fn().mockResolvedValue(undefined),
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  onreconnected: jest.fn(),
  onclose: jest.fn(),
};

export const connectionReady = Promise.resolve();
export const onConnectionStatusChange = jest.fn().mockReturnValue(jest.fn());
export default mockConnection;
