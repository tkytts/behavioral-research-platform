import { getConfederatesStart, getScriptForOrder } from '../confederates';
import * as confederatesApi from '../../api/confederates';

jest.mock('../../api/confederates');

describe('confederates data', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getConfederatesStart', () => {
    it('calls getConfederates and remaps to femaleData/maleData', async () => {
      const femaleData = [{ name: 'Female1', order: 1, gender: 'F' }];
      const maleData = [{ name: 'Male1', order: 1, gender: 'M' }];

      confederatesApi.getConfederates.mockResolvedValueOnce({ female: femaleData, male: maleData });

      const result = await getConfederatesStart();

      expect(confederatesApi.getConfederates).toHaveBeenCalled();
      expect(result).toEqual({ femaleData, maleData });
    });

    it('propagates errors from getConfederates', async () => {
      confederatesApi.getConfederates.mockRejectedValueOnce(new Error('Network error'));

      await expect(getConfederatesStart()).rejects.toThrow('Network error');
    });
  });

  describe('getScriptForOrder', () => {
    it('calls getScript with the given order', async () => {
      const script = { orders: [1, 10], message_groups: {}, resolutions: [] };
      confederatesApi.getScript.mockResolvedValueOnce(script);

      const result = await getScriptForOrder(1);

      expect(confederatesApi.getScript).toHaveBeenCalledWith(1);
      expect(result).toEqual(script);
    });

    it('propagates errors from getScript', async () => {
      confederatesApi.getScript.mockRejectedValueOnce(new Error('Not found'));

      await expect(getScriptForOrder(99)).rejects.toThrow('Not found');
    });
  });
});
