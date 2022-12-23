import React from 'react';

export default function Intro({
  onBeginTextStory,
}: {
  onBeginTextStory: () => void;
}): JSX.Element {
  return (
    <div>
      <h1>
        Whether you lived here, you&rsquo;re a historian, or it&rsquo;s the set
        of your favorite New York novel, I&rsquo;d love to hear your story.
      </h1>
      <button onClick={onBeginTextStory}>Write</button>
    </div>
  );
}
