import { colorizeForPrint } from '../business/color/ColorService';
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

function item(
  id: number,
  colorize: boolean,
  printfileAttempts?: number
): object {
  return {
    id,
    order: { id: 77 },
    internalVariant: MerchInternalVariant.PRINT_HPR_8X12,
    printfileAttempts,
    customizationOptions: {
      variant: MerchInternalVariant.PRINT_HPR_8X12,
      photoIdentifier: `p${id}`,
      colorize,
    },
  };
}

describe('renderPrintfiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('counts the attempt before calling out, and a failure does not stop other items', async () => {
    getMany.mockResolvedValue([item(1, true), item(2, false)]);
    jest.mocked(colorizeForPrint).mockRejectedValue(new Error('palette down'));
    await renderPrintfiles();

    const firstUpdate = update.mock.calls[0] as [number, object];
    expect(firstUpdate[0]).toBe(1);
    expect(firstUpdate[1]).toMatchObject({ printfileAttempts: 1 });
    expect(update).toHaveBeenCalledWith(1, {
      printfileError: 'Error: palette down',
    });
    expect(update).toHaveBeenCalledWith(2, {
      state: MerchItemState.READY_FOR_FULFILLMENT,
    });
  });

  it('moves an item to printfile_failed once its attempts are used up', async () => {
    getMany.mockResolvedValue([item(1, true, 5)]);
    await renderPrintfiles();
    expect(colorizeForPrint).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(1, {
      state: MerchItemState.PRINTFILE_FAILED,
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
