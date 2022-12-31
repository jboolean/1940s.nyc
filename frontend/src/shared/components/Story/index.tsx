import React from 'react';
import { Story } from 'screens/App/shared/types/Story';

import stylesheet from './Story.less';

export default function Story({ story }: { story: Story }): JSX.Element {
  return (
    <div className={stylesheet.story}>
      <div className={stylesheet.storytellerName}>{story.storytellerName}</div>
      <div className={stylesheet.storytellerSubtitle}>
        {story.storytellerSubtitle}
      </div>

      <p className={stylesheet.textContent}>{story.textContent}</p>
    </div>
  );
}
