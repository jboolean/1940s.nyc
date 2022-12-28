import React from 'react';
import Button from 'shared/components/Button';

export default function ThankYou({
  onCloseClicked,
}: {
  onCloseClicked: () => void;
}): JSX.Element {
  return (
    <div>
      <h1>Thank you for sharing</h1>
      <p>
        I love hearing everyone&rsquo;s stories, and I&rsquo;ll publish yours as
        soon as I can.
      </p>
      <Button buttonStyle="primary" onClick={onCloseClicked}>
        Done
      </Button>
    </div>
  );
}
