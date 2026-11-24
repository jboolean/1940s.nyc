import axios from 'axios';
import type * as express from 'express';
import EmailCampaignService from '../business/email/EmailCampaignService';
import { EmailCampaignController } from './EmailCampaignController';

jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('../business/email/EmailCampaignService', () => ({
  __esModule: true,
  default: { addToMailingList: jest.fn().mockResolvedValue(undefined) },
}));

const mockedPost = axios.post as jest.Mock;
const req = { ip: '1.2.3.4' } as express.Request;

describe('EmailCampaignController.addEmailToMailingList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('adds the address when reCAPTCHA passes', async () => {
    mockedPost.mockResolvedValue({ data: { success: true, score: 0.9 } });

    await new EmailCampaignController().addEmailToMailingList(
      { address: 'a@b.c', source: 'signup-form' },
      'token',
      req
    );

    expect(EmailCampaignService.addToMailingList).toHaveBeenCalledWith(
      'a@b.c',
      'signup-form'
    );
  });

  it('rejects and adds nothing when reCAPTCHA fails', async () => {
    mockedPost.mockResolvedValue({ data: { success: false } });

    await expect(
      new EmailCampaignController().addEmailToMailingList(
        { address: 'a@b.c' },
        'bad-token',
        req
      )
    ).rejects.toMatchObject({ status: 403 });
    expect(EmailCampaignService.addToMailingList).not.toHaveBeenCalled();
  });
});
