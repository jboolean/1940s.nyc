import axios from 'axios';
import { Forbidden } from 'http-errors';
import isNumber from 'lodash/isNumber';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SK;

type RecaptchaVerifyResponse = {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
  score: number;
  action: string;
};

// Validate grecaptcha token
export const validateRecaptchaToken = async (
  token: string,
  ip?: string
): Promise<RecaptchaVerifyResponse> => {
  const resp = await axios.post<RecaptchaVerifyResponse>(
    'https://www.google.com/recaptcha/api/siteverify',
    {
      secret: RECAPTCHA_SECRET_KEY,
      response: token,
      remoteip: ip,
    },
    { headers: { 'content-type': 'application/x-www-form-urlencoded' } }
  );
  return resp.data;
};

// Returns the score, or throws Forbidden if the token is not valid
export const verifyRecaptchaToken = async (
  token: string,
  ip?: string
): Promise<number> => {
  const recaptchaResult = await validateRecaptchaToken(token, ip);

  if (!recaptchaResult.success || !isNumber(recaptchaResult.score)) {
    console.error('Recaptcha error', recaptchaResult['error-codes']);
    throw new Forbidden('Recaptcha failed');
  }

  return recaptchaResult.score;
};
