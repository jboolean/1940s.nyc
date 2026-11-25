import { AppDataSource } from '../../createConnection';
import EmailCampaignService from './EmailCampaignService';

jest.mock('./EmailService', () => ({
  __esModule: true,
  default: { templateExists: jest.fn(() => Promise.resolve(false)) },
}));

jest.mock('../../createConnection', () => ({
  AppDataSource: { query: jest.fn() },
}));

it('rejects a campaign whose template does not exist', async () => {
  await expect(
    EmailCampaignService.enqueueEmailCampaign(
      'missing',
      false,
      new Date('2100-01-01')
    )
  ).rejects.toMatchObject({
    status: 400,
    message: 'Email template "missing" does not exist',
  });
  expect(AppDataSource.query).not.toHaveBeenCalled();
});
