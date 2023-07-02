import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { getRepository } from 'typeorm';
import User from '../../entities/User';
import LoginOutcome from '../../enum/LoginOutcome';
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

export function getUserIdFromToken(token: string): number | undefined {
  try {
    const { sub } = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
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

export function getUser(userId: number): Promise<User | null> {
  const userRepository = getRepository(User);
  return userRepository.findOneBy({ id: userId });
}

/**
 * Attach the Stripe customer ID to the user.
 * Also set the email if the user was anonymous.
 * @param userId
 * @param stripeCustomerId
 * @param email
 */
export async function attachStripeCustomer(
  userId: number,
  stripeCustomerId: string,
  email?: string
): Promise<void> {
  const userRepository = getRepository(User);
  const user = await userRepository.findOneByOrFail({ id: userId });
  user.stripeCustomerId = stripeCustomerId;
  if (email && user.isAnonymous) user.email = email;
  await userRepository.save(user);
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

async function sendMagicLink(
  emailAddress: string,
  userId: number,
  apiBase: string,
  returnToPath?: string
): Promise<void> {
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

/**
 * The user wishes to log into the account with email, which may or may not exist.
 * This determines what to do, which ultimately drives the UI.
 * Either:
 *  - We're already logged in, or
 *  - An account doesn't exist yet, and the current account is anonymous, in which attach the email to it, or
 *  - An account doesn't exist, but we can't name the current account because it has a different email, in which case we create a new account and send a magic link, or
 *  - The account exists, so we send a magic link to log in
 * @param requestedEmail
 * @param authenticatedUserId
 */
export async function processLoginRequest(
  requestedEmail: string,
  authenticatedUserId: number,
  ipAddress: string,
  apiBase: string,
  returnToPath?: string
): Promise<LoginOutcome> {
  const userRepository = getRepository(User);

  const currentUser = await userRepository.findOneBy({
    id: authenticatedUserId,
  });

  if (!currentUser) {
    // This should have been a real user id
    throw new Error('Cannot find authenticated user');
  }

  if (currentUser.email === requestedEmail) {
    // We're already logged in
    return LoginOutcome.AlreadyAuthenticated;
  }

  const userByEmail = await userRepository.findOneBy({
    email: normalizeEmail(requestedEmail),
  });

  if (userByEmail) {
    await sendMagicLink(
      required(userByEmail.email, 'email'),
      userByEmail.id,
      apiBase,
      returnToPath
    );
    return LoginOutcome.SentLinkToExistingAccount;
  } else {
    if (currentUser.isAnonymous) {
      currentUser.email = normalizeEmail(requestedEmail);
      await userRepository.save(currentUser);
      return LoginOutcome.NamedAnonymousAccount;
    } else {
      // We can't attach the email to the current account because it has a different email
      const newUserCreds = await createUser(ipAddress, requestedEmail);

      await sendMagicLink(
        requestedEmail,
        newUserCreds.userId,
        apiBase,
        returnToPath
      );

      return LoginOutcome.SentLinkToNewAccount;
    }
  }
}
