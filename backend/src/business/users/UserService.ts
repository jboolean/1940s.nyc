import jwt from 'jsonwebtoken';
import { getRepository } from 'typeorm';
import User from '../../entities/User';
import required from '../utils/required';

const STAGE = required(process.env.STAGE, 'process.env.STAGE');

const JWT_SECRET = required(process.env.JWT_SECRET, 'process.env.JWT_SECRET');

const ISSUER = `${STAGE}.1940s.nyc`;

// This is to differentiate between user tokens and story tokens
const SUBJCET_PREFIX = 'user:';

export function createUserToken(userId: number): string {
  return jwt.sign({}, JWT_SECRET, {
    algorithm: 'HS256',
    issuer: ISSUER,
    subject: SUBJCET_PREFIX + userId.toString(),
  });
}

export function getUserFromToken(token: string): number | undefined {
  try {
    const { sub } = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
    }) as { sub: string };

    if (!sub.startsWith(SUBJCET_PREFIX)) {
      return undefined;
    }

    return parseInt(sub.slice(SUBJCET_PREFIX.length), 10);
  } catch (e) {
    console.error('Error verifying user token', e);
    return undefined;
  }
}

export async function createUser(
  ipAddress: string
): Promise<{ token: string; userId: number }> {
  const userRepository = getRepository(User);

  let user = new User();
  user.ipAddress = ipAddress;

  user = await userRepository.save(user);

  const token = createUserToken(user.id);

  return { token, userId: user.id };
}
