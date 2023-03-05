import 'source-map-support/register';
import 'reflect-metadata';
import createConnection from './src/createConnection';

import checkStaleStoriesImpl from './src/cron/checkStaleStories';
import syncMapImpl from './src/cron/syncMap';

async function setup(): Promise<void> {
  await createConnection();
}

export const checkStaleStories = async (): Promise<void> => {
  await setup();

  await checkStaleStoriesImpl();
};

export const syncMap = async (): Promise<void> => {
  await setup();

  await syncMapImpl();
};
