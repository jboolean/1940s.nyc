import axios from 'axios';
import type * as express from 'express';
import EmailCampaignService from '../business/email/EmailCampaignService';
import * as UserService from '../business/users/UserService';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';
import { AuthenticationController } from './AuthenticationController';
import { EmailCampaignController } from './EmailCampaignController';

jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('./auth/userAuthUtils', () => ({
  getUserFromRequestOrCreateAndSetCookie: jest.fn(),
}));
jest.mock('../business/users/UserService', () => ({
  processLoginRequest: jest.fn(),
}));
jest.mock('../business/email/EmailCampaignService', () => ({
  __esModule: true,
  default: { addToMailingList: jest.fn() },
}));

const req = { ip: '1.2.3.4' } as express.Request;

beforeEach(() => jest.clearAllMocks());

it.each([
  [
    'request-login',
    () =>
      new AuthenticationController().requestLogin(
        { requestedEmail: 'a@b.c' },
        'bad-token',
        req
      ),
    () => UserService.processLoginRequest,
  ],
  [
    'mailing-list',
    () =>
      new EmailCampaignController().addEmailToMailingList(
        { address: 'a@b.c' },
        'bad-token',
        req
      ),
    () => EmailCampaignService.addToMailingList,
  ],
])(
  '%s rejects an invalid reCAPTCHA token and sends nothing',
  async (_name, call, getSideEffect) => {
    (axios.post as jest.Mock).mockResolvedValue({ data: { success: false } });

    await expect(call()).rejects.toMatchObject({ status: 403 });
    expect(getSideEffect()).not.toHaveBeenCalled();
  }
);

it('/me with no cookie returns no email and creates no user', async () => {
  const result = await new AuthenticationController().getMe(req);

  expect(result).toEqual({ email: null });
  expect(getUserFromRequestOrCreateAndSetCookie).not.toHaveBeenCalled();
});
