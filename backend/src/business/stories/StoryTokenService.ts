import jwt from 'jsonwebtoken';
import Story from '../../entities/Story';
import required from '../utils/required';

const STAGE = required(process.env.STAGE, 'process.env.STAGE');

const JWT_SECRET = required(process.env.JWT_SECRET, 'process.env.JWT_SECRET');

const ISSUER = `${STAGE}.1940s.nyc`;

export function createStoryToken(storyId: Story['id']): string {
  return jwt.sign({}, JWT_SECRET, {
    algorithm: 'HS256',
    issuer: ISSUER,
    subject: storyId.toString(),
  });
}

export function verifyStoryToken(
  token: string,
  expectedStoryId: Story['id']
): boolean {
  try {
    jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      subject: expectedStoryId.toString(),
    });
    return true;
  } catch (e) {
    console.error('Error verifying story token', e);
    return false;
  }
}

export function getStoryFromToken(token: string): Story['id'] | undefined {
  try {
    const { sub } = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
    }) as { sub: string };

    return parseInt(sub, 10);
  } catch (e) {
    console.error('Error verifying story token', e);
    return undefined;
  }
}
