import React from 'react';
import Button from 'shared/components/Button';

export default function Intro({
  onBeginTextStory,
}: {
  onBeginTextStory: () => void;
}): JSX.Element {
  return (
    <div>
      <h1>Add your story</h1>
      <p>
        Whether you lived here, you&rsquo;re a historian, or it&rsquo;s the set
        of your favorite New York novel, I&rsquo;d love if you shared your story
        and knowledge of this area with <i>1940s.nyc</i> visitors.
      </p>
      <Button buttonStyle="primary" onClick={onBeginTextStory}>
        Write
      </Button>
    </div>
  );
}
