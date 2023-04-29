import { getConnection, MoreThan, Repository } from 'typeorm';
import LedgerEntry from '../../entities/LedgerEntry';
import { TooManyRequests } from 'http-errors';
import LedgerEntryType from '../../enum/LedgerEntryType';

const RATE_LIMIT_LOOKBACK = 24 * 60 * 60 * 1000; // 24 hours

// We allow this much usage in the lookback window
const MAX_LOOKBACK_USAGES = 20;

const SINGLE_PHOTO_USAGE_AMOUNT_POSITIVE = 1;

async function hasEnoughBalance(
  ledgerRepository: Repository<LedgerEntry>,
  userId: number,
  amountToConsume: number
): Promise<boolean> {
  const { balance } = (await ledgerRepository
    .createQueryBuilder('entry')
    .select('SUM(entry.amount)', 'balance')
    .where({
      userId,
    })
    .getRawOne<{ balance: number }>()) ?? { balance: 0 };

  return balance >= amountToConsume;
}

async function isRateLimitExceeded(
  ledgerRepository: Repository<LedgerEntry>,
  userId: number
): Promise<boolean> {
  const { recentUsageSum } = (await ledgerRepository
    .createQueryBuilder('entry')
    .select('SUM(-entry.amount)', 'recentUsageSum')
    .where({
      userId,
      createdAt: MoreThan(new Date(Date.now() - RATE_LIMIT_LOOKBACK)),
      type: LedgerEntryType.USAGE, // <- only looking at usages, not balance
    })
    .getRawOne<{ recentUsageSum: number }>()) ?? { recentUsageSum: 0 };

  return recentUsageSum >= MAX_LOOKBACK_USAGES;
}

export class UsageCapError extends TooManyRequests {
  constructor() {
    super('Usage cap exceeded');
  }
}

/**
 * Wraps a function and ensures the user has not exceeded a usage cap before executing
 * the wrapped function. If the user has exceeded the cap, a UsageCapError is thrown.
 * @param userId
 * @param photoIdentifier
 * @param wrapped
 * @returns result of wrapped function
 */
export default async function withMeteredUsage<R>(
  userId: number,
  photoIdentifier: string,
  wrapped: () => Promise<R>
): Promise<R> {
  return getConnection().transaction(async (transactionalEntityManager) => {
    const ledgerRepository =
      transactionalEntityManager.getRepository(LedgerEntry);

    // Must have not exceeded the rate limit (regardless of balance) or have lifetime balance
    const isAllowed =
      !(await isRateLimitExceeded(ledgerRepository, userId)) ||
      (await hasEnoughBalance(
        ledgerRepository,
        userId,
        SINGLE_PHOTO_USAGE_AMOUNT_POSITIVE
      ));

    if (!isAllowed) {
      throw new UsageCapError();
    }

    // Create a new ledger entry
    const entry = new LedgerEntry();
    entry.userId = userId;
    entry.metadata = { photoIdentifier };
    entry.amount = -SINGLE_PHOTO_USAGE_AMOUNT_POSITIVE;
    entry.type = LedgerEntryType.USAGE;
    await ledgerRepository.save(entry);

    // if this throws, the transaction will be rolled back
    return await wrapped();
  });
}
