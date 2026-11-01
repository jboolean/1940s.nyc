import MerchInternalVariant from '../enum/MerchInternalVariant';
import MerchItemState from '../enum/MerchItemState';
import MerchOrderState from '../enum/MerchOrderState';
import { colorizeForPrint } from '../business/color/ColorService';
import renderToteBag from '../business/merch/renderToteBag';
import renderMerchPrintfiles, {
  MAX_PRINTFILE_ATTEMPTS,
} from './renderMerchPrintfiles';

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
jest.mock('../business/merch/renderToteBag', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve(Buffer.from('png'))),
}));
jest.mock('../business/utils/printfileUtils', () => ({
  copyOriginalToPrintJpeg: jest.fn(),
  uploadPrintfile: jest.fn(),
}));

const { copyOriginalToPrintJpeg, uploadPrintfile } = jest.requireMock<{
  copyOriginalToPrintJpeg: jest.Mock;
  uploadPrintfile: jest.Mock;
}>('../business/utils/printfileUtils');

function toteItem(id: number, attempts?: number): object {
  return {
    id,
    order: { id: 77 },
    internalVariant: MerchInternalVariant.TOTE_BAG_SMALL,
    printfileAttempts: attempts,
    customizationOptions: {
      variant: MerchInternalVariant.TOTE_BAG_SMALL,
      lat: 40.7,
      lng: -74,
      style: 'outline',
    },
  };
}

function printItem(id: number, colorize: boolean, attempts?: number): object {
  return {
    id,
    order: { id: 77 },
    internalVariant: MerchInternalVariant.PRINT_HPR_8X12,
    printfileAttempts: attempts,
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

describe('renderMerchPrintfiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('renders a tote and a print, uploading each with its own extension', async () => {
    getMany.mockResolvedValue([toteItem(1), printItem(2, false)]);
    await renderMerchPrintfiles();

    expect(renderToteBag).toHaveBeenCalledTimes(1);
    expect(uploadPrintfile).toHaveBeenCalledWith(1, 'png', expect.any(Buffer));
    expect(copyOriginalToPrintJpeg).toHaveBeenCalledWith(2, 'p2');
    expect(uploadPrintfile).not.toHaveBeenCalledWith(2, expect.anything());
    expect(update).toHaveBeenCalledWith(1, {
      state: MerchItemState.READY_FOR_FULFILLMENT,
    });
    expect(update).toHaveBeenCalledWith(2, {
      state: MerchItemState.READY_FOR_FULFILLMENT,
    });
  });

  it('colorizes a colorized print and uploads the jpeg', async () => {
    getMany.mockResolvedValue([printItem(3, true)]);
    jest.mocked(colorizeForPrint).mockResolvedValue(Buffer.from('jpg'));
    await renderMerchPrintfiles();

    expect(uploadPrintfile).toHaveBeenCalledWith(3, 'jpg', expect.any(Buffer));
  });

  it('counts the attempt before calling out, and a failure does not stop other items', async () => {
    getMany.mockResolvedValue([printItem(1, true), printItem(2, false)]);
    jest.mocked(colorizeForPrint).mockRejectedValue(new Error('palette down'));
    await renderMerchPrintfiles();

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
    getMany.mockResolvedValue([printItem(1, true, MAX_PRINTFILE_ATTEMPTS)]);
    await renderMerchPrintfiles();
    expect(colorizeForPrint).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(1, {
      state: MerchItemState.PRINTFILE_FAILED,
    });
    expectGiveUpMetric();
  });

  it('counts an item with no customization as a give-up', async () => {
    const unprintable: { customizationOptions?: unknown } = {
      ...printItem(3, false),
    };
    delete unprintable.customizationOptions;
    getMany.mockResolvedValue([unprintable]);

    await renderMerchPrintfiles();

    expect(update).toHaveBeenCalledWith(3, {
      state: MerchItemState.PRINTFILE_FAILED,
    });
    expectGiveUpMetric();
  });

  it('fails a tote that carries print-shaped options instead of rendering NaN', async () => {
    const mismatched = {
      ...toteItem(4),
      customizationOptions: {
        variant: MerchInternalVariant.PRINT_HPR_8X12,
        photoIdentifier: 'p4',
        colorize: false,
      },
    };
    getMany.mockResolvedValue([mismatched]);

    await renderMerchPrintfiles();

    expect(renderToteBag).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(4, {
      printfileError: 'Error: Tote bag item does not carry tote bag options',
    });
  });

  it('queries only customized items from orders that are not canceled', async () => {
    getMany.mockResolvedValue([]);
    await renderMerchPrintfiles();
    expect(qb.where).toHaveBeenCalledWith({ state: MerchItemState.CUSTOMIZED });
    expect(qb.andWhere).toHaveBeenCalledWith('order.state != :canceled', {
      canceled: MerchOrderState.CANCELED,
    });
  });
});
