import MerchInternalVariant from '../enum/MerchInternalVariant';
import MerchItemState from '../enum/MerchItemState';
import renderToteBag from '../business/merch/renderToteBag';
import { uploadPrintfile } from '../business/utils/printfileUtils';
import renderMerch from './renderMerchPrintfiles';

const getMany = jest.fn();
const update = jest.fn();
const qb: Record<string, unknown> = {};
for (const m of ['where', 'orderBy', 'limit']) {
  qb[m] = jest.fn(() => qb);
}
qb.getMany = getMany;

jest.mock('../createConnection', () => ({
  AppDataSource: {
    getRepository: () => ({ createQueryBuilder: () => qb, update }),
  },
}));
jest.mock('../business/merch/renderToteBag', () => jest.fn());
jest.mock('../business/utils/printfileUtils', () => ({
  uploadPrintfile: jest.fn(),
}));

function item(
  id: number,
  printfileAttempts?: number,
  customizationOptions: unknown = {
    variant: MerchInternalVariant.TOTE_BAG_SMALL,
    lat: 40.7,
    lng: -74,
    style: 'outline',
    foregroundColor: 'red',
    backgroundColor: 'creme',
  }
): object {
  return {
    id,
    internalVariant: MerchInternalVariant.TOTE_BAG_SMALL,
    printfileAttempts,
    customizationOptions,
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

  it('renders a tote and leaves it ready for fulfillment', async () => {
    getMany.mockResolvedValue([item(1)]);
    jest.mocked(renderToteBag).mockResolvedValue(Buffer.from('png'));

    await renderMerch();

    expect(uploadPrintfile).toHaveBeenCalledWith(1, Buffer.from('png'));
    expect(update).toHaveBeenLastCalledWith(1, {
      state: MerchItemState.READY_FOR_FULFILLMENT,
    });
  });

  it('moves an item with no customization options to printfile_failed', async () => {
    getMany.mockResolvedValue([item(1, undefined, null)]);

    await renderMerch();

    expect(renderToteBag).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(1, {
      state: MerchItemState.PRINTFILE_FAILED,
    });
    expectGiveUpMetric();
  });

  it('moves an item to printfile_failed once its attempts are used up', async () => {
    getMany.mockResolvedValue([item(1, 5)]);

    await renderMerch();

    expect(renderToteBag).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(1, {
      state: MerchItemState.PRINTFILE_FAILED,
    });
    expectGiveUpMetric();
  });

  it('records a failed render and leaves the item for another attempt', async () => {
    getMany.mockResolvedValue([item(1)]);
    jest.mocked(renderToteBag).mockRejectedValue(new Error('browser down'));

    await renderMerch();

    expect(update).toHaveBeenCalledWith(1, { printfileAttempts: 1 });
    expect(update).toHaveBeenCalledWith(1, {
      printfileError: 'Error: browser down',
    });
    expect(update).not.toHaveBeenCalledWith(1, {
      state: MerchItemState.PRINTFILE_FAILED,
    });
  });
});
