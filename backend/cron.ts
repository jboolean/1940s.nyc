import 'source-map-support/register';
import 'reflect-metadata';
import createConnection from './src/createConnection';

import checkStaleStoriesImpl from './src/cron/checkStaleStories';
import syncMapImpl from './src/cron/syncMap';
import generateStoryTitlesImpl from './src/cron/generateStoryTitles';

import * as Sentry from '@sentry/node';
import { CaptureConsole as CaptureConsoleIntegration } from '@sentry/integrations';

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

export const checkStaleStories = async (): Promise<void> => {
  await setup();

  await checkStaleStoriesImpl();
};

export const syncMap = async (): Promise<void> => {
  await setup();

  await syncMapImpl();
};

export const generateStoryTitles = async (): Promise<void> => {
  await setup();

  await generateStoryTitlesImpl();
};

export const sendEmailCampaigns = async (): Promise<void> => {
  await setup();

  await EmailCampaignService.sendPendingEmails(false);
  await EmailCampaignService.sendPendingEmails(true);
};
