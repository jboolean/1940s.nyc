import 'reflect-metadata';
import 'source-map-support/register';
import createConnection from './src/createConnection';

import checkStaleStoriesImpl from './src/cron/checkStaleStories';
import generateStoryTitlesImpl from './src/cron/generateStoryTitles';
import renderMerchPrintfilesImpl from './src/cron/renderMerchPrintfiles';
import syncMapImpl from './src/cron/syncMap';

import { CaptureConsole as CaptureConsoleIntegration } from '@sentry/integrations';
import * as Sentry from '@sentry/node';

// Importing @sentry/tracing patches the global hub for tracing to work.
import '@sentry/tracing';
import EmailCampaignService from './src/business/email/EmailCampaignService';

async function setup(): Promise<void> {
  await createConnection();

  Sentry.init({
    dsn: 'https://5c9a98d156614bac899b541f69d9b7f3@o4504630310600704.ingest.sentry.io/4504630315974657',

    tracesSampleRate: 1.0,
    environment: process.env.STAGE,
    integrations: [
      new CaptureConsoleIntegration({
        // array of methods that should be captured
        // defaults to ['log', 'info', 'warn', 'error', 'debug', 'assert']
        levels: ['warn', 'error'],
      }),
    ],
  });
}

const withSetup = async (impl: () => Promise<void>): Promise<void> => {
  await setup();
  await impl();
};

export const checkStaleStories = (): Promise<void> =>
  withSetup(checkStaleStoriesImpl);

export const syncMap = (): Promise<void> => withSetup(syncMapImpl);

export const generateStoryTitles = (): Promise<void> =>
  withSetup(generateStoryTitlesImpl);

export const sendEmailCampaigns = withSetup(async (): Promise<void> => {
  await EmailCampaignService.sendPendingEmails(false);
  await EmailCampaignService.sendPendingEmails(true);
});

export const renderMerchPrintfiles = (): Promise<void> =>
  withSetup(renderMerchPrintfilesImpl);
