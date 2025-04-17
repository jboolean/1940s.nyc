import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { getRepository } from 'typeorm';
import User from '../../entities/User';
import LoginOutcome from '../../enum/LoginOutcome';
import stripe from '../../third-party/stripe';
import EmailService from '../email/EmailService';
import MagicLinkTemplate from '../email/templates/MagicLinkTemplate';
import normalizeEmail from '../utils/normalizeEmail';
import required from '../utils/required';

const STAGE = required(process.env.STAGE, 'process.env.STAGE');

const JWT_SECRET = required(process.env.JWT_SECRET, 'process.env.JWT_SECRET');

const ISSUER = `${STAGE}.1940s.nyc`;

// This is to differentiate between user tokens and story tokens
const SUBJECT_PREFIX = 'user:';

export function createUserToken(userId: number): string {
  return jwt.sign({}, JWT_SECRET, {
    algorithm: 'HS256',
    issuer: ISSUER,
    subject: SUBJECT_PREFIX + userId.toString(),
  });
}

function createUserTokenForMagicLink(userId: number): string {
  return jwt.sign({}, JWT_SECRET, {
    algorithm: 'HS256',
    issuer: ISSUER,
    subject: SUBJECT_PREFIX + userId.toString(),
    expiresIn: '1h',
  });
}

export function getUserIdFromToken(
  token: string,
  {
    ignoreExpiration = false,
  }: {
    ignoreExpiration?: boolean;
  } = {}
): number | undefined {
  try {
    const { sub } = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      ignoreExpiration,
    }) as { sub: string };

    if (!sub.startsWith(SUBJECT_PREFIX)) {
      return undefined;
    }

    return parseInt(sub.slice(SUBJECT_PREFIX.length), 10);
  } catch (e) {
    console.error('Error verifying user token', e);
    return undefined;
  }
}

export function getUser(userId: number): Promise<User> {
  const userRepository = getRepository(User);
  return userRepository.findOneByOrFail({ id: userId });
}

/**
 * Attach the Stripe customer ID to the user.
 * Also set the email if the user was anonymous.
 *
 * Note: Use the returned user id, which will probably be the one passed in, but may be different in edge cases.
 *
 * If the email is already on another user, we will return that user.
 * If no user id is provided, we will create a new user.
 * To avoid these edge cases, have the user log in before creating the Stripe checkout session.
 * @param requestUserId
 * @param stripeCustomerId
 * @param email
 * @returns Id of cannonical user for this request
 */
export async function attachStripeCustomerAndDetermineUserId(
  stripeCustomerId: string,
  requestUserId?: number,
  email?: string
): Promise<number> {
  if (email) email = normalizeEmail(email);

  const userRepository = getRepository(User);
  let user: User | null = null;
  if (requestUserId) {
    user = await userRepository.findOneBy({ id: requestUserId });
  }
  const userByEmail = await userRepository.findOneBy({ email });
  if (userByEmail && userByEmail.id !== user?.id) {
    console.log(
      'Email already on another user, using that user',
      email,
      userByEmail.id
    );
    user = userByEmail;
  }
  if (!user) {
    user = new User();
    user = await userRepository.save(user);
  }

  user.stripeCustomerId = stripeCustomerId;
  if (email && user.isAnonymous) user.email = email;
  await userRepository.save(user);
  return user.id;
}

export async function getUserByStripeCustomerId(
  stripeCustomerId: string
): Promise<User | null> {
  const userRepository = getRepository(User);
  return userRepository.findOneBy({ stripeCustomerId });
}

export async function updateSupportSubscription(
  userId: number,
  stripeSupportSubscriptionId: string | null
): Promise<void> {
  const userRepository = getRepository(User);
  await userRepository.update(userId, { stripeSupportSubscriptionId });
}

export async function markEmailVerified(userId: number): Promise<void> {
  const userRepository = getRepository(User);
  await userRepository.update(userId, { isEmailVerified: true });
}

export async function createUser(
  ipAddress: string,
  email?: string
): Promise<{ token: string; userId: number }> {
  const userRepository = getRepository(User);

  let user = new User();
  user.ipAddress = ipAddress;

  if (email) user.email = normalizeEmail(email);

  user = await userRepository.save(user);

  const token = createUserToken(user.id);

  return { token, userId: user.id };
}

export function createMagicLinkUrl(
  apiBase: string,
  userId: number,
  returnToPath?: string
): URL {
  const loginUrl: URL = new URL(
    '/authentication/login-with-magic-link',
    apiBase
  );

  const magicLinkToken = createUserTokenForMagicLink(userId);

  const params = new URLSearchParams();
  params.append('token', magicLinkToken);
  if (returnToPath) {
    params.append('returnToPath', returnToPath);
  }

  loginUrl.search = params.toString();
  return loginUrl;
}

async function sendMagicLink(
  emailAddress: string,
  userId: number,
  apiBase: string,
  returnToPath?: string
): Promise<void> {
  const loginUrl = createMagicLinkUrl(apiBase, userId, returnToPath);

  const emailMessage = MagicLinkTemplate.createTemplatedEmail({
    to: emailAddress,
    templateContext: {
      loginUrl: loginUrl.toString(),
      email: emailAddress,
    },
    metadata: {
      userId: String(userId),
    },
    // Prevent threading
    referenceMessageId: randomUUID(),
  });

  await EmailService.sendTemplateEmail(emailMessage);
}

export async function sendMagicLinkToUser(
  userId: number,
  apiBase: string,
  returnToPath?: string
): Promise<void> {
  const user = await getUser(userId);
  if (!user.email) {
    return;
  }

  return sendMagicLink(user.email, userId, apiBase, returnToPath);
}

/**
 * The user wishes to log into the account with email, which may or may not exist.
 * This determines what to do, which ultimately drives the UI.
 * Either:
 *  - We're already logged in, or
 *  - The account exists, so we send a magic link to log in, or
 *  - We update the email on the current account
 * @param requestedEmail
 * @param authenticatedUserId
 */
export async function processLoginRequest(
  requestedEmail: string,
  authenticatedUserId: number,
  apiBase: string,
  returnToPath?: string,
  requireVerifiedEmail = false,
  newEmailBehavior: 'update' | 'reject' = 'update'
): Promise<LoginOutcome> {
  const userRepository = getRepository(User);

  const currentUser = await userRepository.findOneByOrFail({
    id: authenticatedUserId,
  });

  if (currentUser.email === requestedEmail) {
    // We're already logged in

    if (requireVerifiedEmail && !currentUser.isEmailVerified) {
      // If we require a verified email, and the current user's email is not verified,
      // send a new magic link
      await sendMagicLink(
        required(currentUser.email, 'email'),
        currentUser.id,
        apiBase,
        returnToPath
      );
      return LoginOutcome.SentLinkToVerifyEmail;
    }

    return LoginOutcome.AlreadyAuthenticated;
  }

  const userByEmail = await userRepository.findOneBy({
    email: normalizeEmail(requestedEmail),
  });

  if (userByEmail) {
    // Sent link to switch to existing account
    await sendMagicLink(
      required(userByEmail.email, 'email'),
      userByEmail.id,
      apiBase,
      returnToPath
    );
    return LoginOutcome.SentLinkToExistingAccount;
  } else {
    if (newEmailBehavior === 'update' || currentUser.isAnonymous) {
      // Either account is anonymous or the current user is changing their email
      // Stays logged in, but updates account info
      currentUser.email = normalizeEmail(requestedEmail);
      currentUser.isEmailVerified = false;
      await userRepository.save(currentUser);

      if (currentUser.stripeCustomerId) {
        try {
          await stripe.customers.update(currentUser.stripeCustomerId, {
            email: currentUser.email,
          });
        } catch (e) {
          console.error('Error updating Stripe customer', e);
        }
      }

      if (requireVerifiedEmail) {
        // We require a verified email, and this user's email has just changed.
        await sendMagicLink(
          required(currentUser.email, 'email'),
          currentUser.id,
          apiBase,
          returnToPath
        );
        return LoginOutcome.SentLinkToVerifyEmail;
      }

      return LoginOutcome.UpdatedEmailOnAuthenticatedAccount;
    } else {
      return LoginOutcome.AccountDoesNotExist;
    }
  }
}
