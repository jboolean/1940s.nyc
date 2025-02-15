import EmailCampaignService from './src/business/email/EmailCampaignService';
import withSetup from './withSetup';

export const handler = withSetup(async () => {
  await EmailCampaignService.sendPendingEmails(false);
  await EmailCampaignService.sendPendingEmails(true);
});
