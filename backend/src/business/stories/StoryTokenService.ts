import jwt from 'jsonwebtoken';
import Story from '../../entities/Story';

const STAGE = process.env.STAGE;

if (!STAGE) {
  throw new Error('process.env.STAGE is not set');
}

const ISSUER = `${STAGE}.1940s.nyc`;

export function createStoryToken(storyId: Story['id']): string {
  return jwt.sign({}, process.env.JWT_SECRET, {
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
    jwt.verify(token, process.env.JWT_SECRET, {
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
    const { sub } = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
    }) as { sub: string };

    return parseInt(sub, 10);
  } catch (e) {
    console.error('Error verifying story token', e);
    return undefined;
  }
}
