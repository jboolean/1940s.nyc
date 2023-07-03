import { TooManyRequests } from 'http-errors';
import { getConnection, MoreThan, Repository } from 'typeorm';
import LedgerEntry from '../../entities/LedgerEntry';
import LedgerEntryType from '../../enum/LedgerEntryType';

const RATE_LIMIT_LOOKBACK = 24 * 60 * 60 * 1000; // 24 hours

// We allow this much usage in the lookback window
const MAX_LOOKBACK_USAGES = 3;

const SINGLE_PHOTO_USAGE_AMOUNT_POSITIVE = 1;

export async function getBalance(
  userId: number,
  ledgerRepository?: Repository<LedgerEntry>
): Promise<number> {
  if (!ledgerRepository) {
    ledgerRepository = getConnection().getRepository(LedgerEntry);
  }
  const { balance } = (await ledgerRepository
    .createQueryBuilder('entry')
    .select('SUM(entry.amount)', 'balance')
    .where({
      userId,
    })
    .getRawOne<{ balance: number }>()) ?? { balance: 0 };

  return balance;
}

async function hasEnoughBalance(
  userId: number,
  amountToConsume: number,
  ledgerRepository?: Repository<LedgerEntry>
): Promise<boolean> {
  if (!ledgerRepository) {
    ledgerRepository = getConnection().getRepository(LedgerEntry);
  }
  const balance = await getBalance(userId, ledgerRepository);

  return balance >= amountToConsume;
}

async function isRateLimitExceeded(
  userId: number,
  ledgerRepository: Repository<LedgerEntry>
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
export async function withMeteredUsage<R>(
  userId: number,
  photoIdentifier: string,
  wrapped: () => Promise<R>
): Promise<R> {
  return getConnection().transaction(async (transactionalEntityManager) => {
    const ledgerRepository =
      transactionalEntityManager.getRepository(LedgerEntry);

    // Must have not exceeded the rate limit (regardless of balance) or have lifetime balance
    const isAllowed =
      !(await isRateLimitExceeded(userId, ledgerRepository)) ||
      (await hasEnoughBalance(
        userId,
        SINGLE_PHOTO_USAGE_AMOUNT_POSITIVE,
        ledgerRepository
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

const CENTS_PER_CREDIT = 10;

/**
 * This exists because there is not a formal pay-for-credits flow in the app, but
 * I want to reduce rate-limiting on users who contribute.
 *
 * So, in response to a payment, we grant credits to the user at a hardcoded rate.
 *
 * This is not advertised in the app, but hopefully reduces rate-limiting for users who contribute.
 * (it would be annoying if you donate and then still get rate-limited)
 * @param userId
 * @param amountCents
 * @param paymentIntentId
 */
export async function grantCreditsForPayment(
  userId: number,
  amountCents: number,
  paymentIntentId: string
): Promise<void> {
  const ledgerRepository = getConnection().getRepository(LedgerEntry);

  const balance = await getBalance(userId, ledgerRepository);

  // Credits are granted at a fixed rate
  // Plus an amnesty for negative balances

  const creditsFromPayment = Math.floor(amountCents / CENTS_PER_CREDIT);
  const amnesty = balance < 0 ? -balance : 0;

  const creditsToGrant = creditsFromPayment + amnesty;

  // Create a new ledger entry
  const entry = new LedgerEntry();
  entry.userId = userId;
  entry.amount = creditsToGrant;
  entry.type = LedgerEntryType.CREDIT;
  entry.metadata = {
    paymentIntentId,
    amountCents,
  };
  await ledgerRepository.save(entry);
}
