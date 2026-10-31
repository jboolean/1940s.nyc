import { colorizeForPrint } from '../business/color/ColorService';
import {
  copyOriginalToPrintJpeg,
  uploadPrintJpeg,
} from '../business/utils/printfileUtils';
import MerchInternalVariant from '../enum/MerchInternalVariant';
import MerchItemState from '../enum/MerchItemState';
import renderPrintfiles, { MAX_PRINTFILE_ATTEMPTS } from './renderPrintfiles';

const getMany = jest.fn();
const update = jest.fn();
const qb: Record<string, unknown> = {};
for (const m of [
  'innerJoinAndSelect',
  'where',
  'andWhere',
  'orderBy',
  'limit',
]) {
  qb[m] = jest.fn(() => qb);
}
qb.getMany = getMany;

jest.mock('../createConnection', () => ({
  AppDataSource: {
    getRepository: () => ({ createQueryBuilder: () => qb, update }),
  },
}));
jest.mock('../business/color/ColorService', () => ({
  colorizeForPrint: jest.fn(),
}));
jest.mock('../business/utils/printfileUtils', () => ({
  copyOriginalToPrintJpeg: jest.fn(),
  uploadPrintJpeg: jest.fn(),
}));

function item(id: number, colorize: boolean, attempts?: number): object {
  const options = {
    variant: MerchInternalVariant.PRINT_HPR_8X12,
    photoIdentifier: `p${id}`,
    colorize,
    ...(attempts !== undefined && { printfile: { attempts } }),
  };
  return {
    id,
    internalVariant: MerchInternalVariant.PRINT_HPR_8X12,
    customizationOptions: options,
  };
}

describe('renderPrintfiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('colorizes at print quality when asked and copies the original otherwise', async () => {
    getMany.mockResolvedValue([item(1, true), item(2, false)]);
    jest.mocked(colorizeForPrint).mockResolvedValue(Buffer.from('x'));
    await renderPrintfiles();
    expect(colorizeForPrint).toHaveBeenCalledWith('p1');
    expect(uploadPrintJpeg).toHaveBeenCalledWith(1, Buffer.from('x'));
    expect(copyOriginalToPrintJpeg).toHaveBeenCalledWith(2, 'p2');
    expect(update).toHaveBeenCalledWith(1, {
      state: MerchItemState.READY_FOR_FULFILLMENT,
    });
    expect(update).toHaveBeenCalledWith(2, {
      state: MerchItemState.READY_FOR_FULFILLMENT,
    });
  });

  it('records a failure, keeps the item retryable, and still processes other items', async () => {
    getMany.mockResolvedValue([item(1, true), item(2, false)]);
    jest.mocked(colorizeForPrint).mockRejectedValue(new Error('palette down'));
    await renderPrintfiles();
    expect(update).toHaveBeenCalledWith(1, {
      customizationOptions: expect.objectContaining({
        printfile: {
          attempts: 1,
          lastError: expect.stringContaining('palette down') as string,
        },
      }) as unknown,
      state: MerchItemState.AWAITING_PRINTFILE,
    });
    expect(update).toHaveBeenCalledWith(2, {
      state: MerchItemState.READY_FOR_FULFILLMENT,
    });
  });

  it('gives up visibly after repeated failures', async () => {
    getMany.mockResolvedValue([item(1, true, MAX_PRINTFILE_ATTEMPTS - 1)]);
    jest.mocked(colorizeForPrint).mockRejectedValue(new Error('still down'));
    await renderPrintfiles();
    expect(update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ state: MerchItemState.PRINTFILE_FAILED })
    );
  });
});
