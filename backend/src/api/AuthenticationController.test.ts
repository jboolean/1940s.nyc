import axios from 'axios';
import type * as express from 'express';
import * as UserService from '../business/users/UserService';
import LoginOutcome from '../enum/LoginOutcome';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';
import { AuthenticationController } from './AuthenticationController';

jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('./auth/userAuthUtils', () => ({
  getUserFromRequestOrCreateAndSetCookie: jest.fn().mockResolvedValue(7),
}));
jest.mock('../business/users/UserService', () => ({
  getUser: jest.fn().mockResolvedValue({ id: 7, email: 'a@b.c' }),
  processLoginRequest: jest
    .fn()
    .mockResolvedValue('sent_link_to_existing_account'),
}));

const mockedPost = axios.post as jest.Mock;

const makeReq = (user?: { id: number }): express.Request =>
  ({
    ip: '1.2.3.4',
    protocol: 'https',
    get: () => 'api.example.com',
    user,
  }) as unknown as express.Request;

describe('AuthenticationController.requestLogin', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends the login email when reCAPTCHA passes', async () => {
    mockedPost.mockResolvedValue({ data: { success: true, score: 0.9 } });

    const result = await new AuthenticationController().requestLogin(
      { requestedEmail: 'a@b.c' },
      'token',
      makeReq()
    );

    expect(result).toEqual({
      outcome: LoginOutcome.SentLinkToExistingAccount,
    });
    expect(mockedPost).toHaveBeenCalledWith(
      'https://www.google.com/recaptcha/api/siteverify',
      expect.objectContaining({ response: 'token', remoteip: '1.2.3.4' }),
      expect.anything()
    );
    expect(UserService.processLoginRequest).toHaveBeenCalled();
  });

  it('rejects and sends nothing when reCAPTCHA fails', async () => {
    mockedPost.mockResolvedValue({
      data: { success: false, 'error-codes': ['invalid-input-response'] },
    });

    await expect(
      new AuthenticationController().requestLogin(
        { requestedEmail: 'a@b.c' },
        'bad-token',
        makeReq()
      )
    ).rejects.toMatchObject({ status: 403 });
    expect(getUserFromRequestOrCreateAndSetCookie).not.toHaveBeenCalled();
    expect(UserService.processLoginRequest).not.toHaveBeenCalled();
  });
});

describe('AuthenticationController.getMe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns no email and creates no user when there is no user cookie', async () => {
    const result = await new AuthenticationController().getMe(makeReq());

    expect(result).toEqual({ email: null });
    expect(getUserFromRequestOrCreateAndSetCookie).not.toHaveBeenCalled();
  });

  it('returns the email of the user in the cookie', async () => {
    const result = await new AuthenticationController().getMe(
      makeReq({ id: 7 })
    );

    expect(result).toEqual({ email: 'a@b.c' });
    expect(UserService.getUser).toHaveBeenCalledWith(7);
  });
});
