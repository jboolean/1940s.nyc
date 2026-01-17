import React from 'react';
import Markdown from 'react-markdown';
import { Story } from 'screens/App/shared/types/Story';

import stylesheet from './Story.less';
import autoLink from 'shared/utils/autoLink';

function NewTabLink({
  children,
  ...props
}: React.PropsWithChildren): JSX.Element {
  return (
    <a {...props} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
}

export default function Story({ story }: { story: Story }): JSX.Element {
  return (
    <div className={stylesheet.story}>
      <div className={stylesheet.storytellerName}>{story.storytellerName}</div>
      <div className={stylesheet.storytellerSubtitle}>
        {story.storytellerSubtitle}
      </div>

      <Markdown
        allowedElements={['strong', 'em', 'ul', 'ol', 'li', 'a', 'p']}
        unwrapDisallowed={true}
        // override the component used for anchor tags to always redirect to a new tab
        components={{
          a: NewTabLink,
        }}
      >
        {autoLink(story.textContent || '')}
      </Markdown>
    </div>
  );
}
