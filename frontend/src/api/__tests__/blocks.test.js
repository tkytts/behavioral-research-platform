import { getSuggestions } from '../blocks';
import client from '../client';

jest.mock('../client');

describe('blocks API', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getSuggestions', () => {
    it('calls client.get with /api/suggestions endpoint', async () => {
      const mockData = [['answer1', 'answer2']];
      client.get.mockResolvedValueOnce(mockData);

      const result = await getSuggestions();

      expect(client.get).toHaveBeenCalledWith('/suggestions');
      expect(result).toEqual(mockData);
    });

    it('propagates errors from client', async () => {
      const error = new Error('Network error');
      client.get.mockRejectedValueOnce(error);

      await expect(getSuggestions()).rejects.toThrow('Network error');
    });
  });
});
