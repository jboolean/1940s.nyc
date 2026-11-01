import { colorizeForPrint } from '../business/color/ColorService';
import MerchInternalVariant from '../enum/MerchInternalVariant';
import MerchItemState from '../enum/MerchItemState';
import renderPrintfiles from './renderPrintfiles';

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
  uploadPrintfile: jest.fn(),
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

// The metric arrives as a CloudWatch EMF line, so the assertion reads it back the way the agent does.
function expectGiveUpMetric(): void {
  const lines = jest
    .mocked(console.log)
    .mock.calls.map(([line]) => String(line))
    .filter((line) => line.startsWith('{'))
    .map((line) => JSON.parse(line) as Record<string, unknown>);

  expect(lines).toHaveLength(1);
  const { _aws, ...values } = lines[0];
  const aws = _aws as Record<string, unknown>;
  expect(typeof aws.Timestamp).toBe('number');
  delete aws.Timestamp;
  expect(aws).toEqual({
    CloudWatchMetrics: [
      {
        Namespace: 'fourtiesnyc/merch',
        Dimensions: [['Stage']],
        Metrics: [{ Name: 'PrintfileGiveUp', Unit: 'Count' }],
      },
    ],
  });
  expect(typeof values.Stage).toBe('string');
  expect(values.PrintfileGiveUp).toBe(1);
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
    expectGiveUpMetric();
  });

  it('counts an item with no print customization as a give-up', async () => {
    const unprintable: { customizationOptions?: unknown } = {
      ...item(3, false),
    };
    delete unprintable.customizationOptions;
    getMany.mockResolvedValue([unprintable]);

    await renderPrintfiles();

    expect(update).toHaveBeenCalledWith(3, {
      state: MerchItemState.PRINTFILE_FAILED,
    });
    expectGiveUpMetric();
  });
});
