import checkStaleStoriesImpl from './src/cron/checkStaleStories';
import withSetup from './withSetup';

export const handler = withSetup(checkStaleStoriesImpl);
