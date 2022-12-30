import React from 'react';
import Button from 'shared/components/Button';
import IntroGraph from './IntroGraph';

export default function Intro({
  onBeginTextStory,
}: {
  onBeginTextStory: () => void;
}): JSX.Element {
  return (
    <div>
      <h1>Add your story</h1>
      <IntroGraph />
      <Button buttonStyle="primary" onClick={onBeginTextStory}>
        Write
      </Button>
    </div>
  );
}
