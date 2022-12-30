import axios from 'axios';

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
