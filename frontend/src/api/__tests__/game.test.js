import client from '../client';
import { fetchConfederate } from '../game';

jest.mock('../client', () => ({ get: jest.fn() }));

describe('game API', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('fetchConfederate', () => {
    it('calls client.get with /game/confederate endpoint', async () => {
      client.get.mockResolvedValueOnce('Alice');
      await fetchConfederate();
      expect(client.get).toHaveBeenCalledWith('/game/confederate');
    });

    it('returns the value directly without .data', async () => {
      client.get.mockResolvedValueOnce('Alice');
      const result = await fetchConfederate();
      expect(result).toBe('Alice');
    });
  });
});
