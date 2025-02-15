import generateStoryTitlesImpl from './src/cron/generateStoryTitles';

import withSetup from './withSetup';

export const handler = withSetup(generateStoryTitlesImpl);
