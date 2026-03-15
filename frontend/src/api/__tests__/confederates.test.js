import { getConfederates, getScript } from '../confederates';
import client from '../client';

jest.mock('../client');

describe('confederates API', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getConfederates', () => {
    it('calls client.get with /confederates endpoint', async () => {
      const mockData = { female: [], male: [] };
      client.get.mockResolvedValueOnce(mockData);

      const result = await getConfederates();

      expect(client.get).toHaveBeenCalledWith('/confederates');
      expect(result).toEqual(mockData);
    });

    it('propagates errors from client', async () => {
      const error = new Error('Network error');
      client.get.mockRejectedValueOnce(error);

      await expect(getConfederates()).rejects.toThrow('Network error');
    });
  });

  describe('getScript', () => {
    it('calls client.get with /scripts?order=1 endpoint', async () => {
      const mockScript = { orders: [1, 10], message_groups: {}, resolutions: [] };
      client.get.mockResolvedValueOnce(mockScript);

      const result = await getScript(1);

      expect(client.get).toHaveBeenCalledWith('/scripts?order=1');
      expect(result).toEqual(mockScript);
    });

    it('propagates errors from client', async () => {
      const error = new Error('Network error');
      client.get.mockRejectedValueOnce(error);

      await expect(getScript(1)).rejects.toThrow('Network error');
    });
  });
});
