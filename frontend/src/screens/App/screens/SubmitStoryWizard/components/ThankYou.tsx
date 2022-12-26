import React from 'react';

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
      <button onClick={onCloseClicked}>Done</button>
    </div>
  );
}
