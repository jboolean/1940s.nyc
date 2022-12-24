import React from 'react';

export default function StorytellerInfo({
  storytellerName,
  storytellerSubtitle,
  storytellerEmail,
  isSubmitting,
  isStoryValidToSubmit,

  onStorytellerEmailChange,
  onStorytellerNameChange,
  onStorytellerSubtitleChange,
  onGoBackToToContentStepClick,
  onSubmit,
}: {
  storytellerName: string;
  storytellerSubtitle: string;
  storytellerEmail: string;
  isSubmitting: boolean;
  isStoryValidToSubmit: boolean;

  onStorytellerNameChange: (newStorytellerName: string) => void;
  onStorytellerSubtitleChange: (newStorytellerSubtitle: string) => void;
  onStorytellerEmailChange: (newStorytellerEmail: string) => void;
  onGoBackToToContentStepClick: () => void;
  onSubmit: () => void;
}): JSX.Element {
  return (
    <div>
      <label>
        Name
        <input
          type="text"
          value={storytellerName}
          onChange={({ target: { value } }) => {
            onStorytellerNameChange(value);
          }}
        />
      </label>
      <label>
        Subtitle (e.g. Resident, historian, my favorite spot…)
        <input
          type="text"
          value={storytellerSubtitle}
          onChange={({ target: { value } }) => {
            onStorytellerSubtitleChange(value);
          }}
        />
      </label>
      <label>
        Email (never made public)
        <input
          type="email"
          value={storytellerEmail}
          onChange={({ target: { value } }) => {
            onStorytellerEmailChange(value);
          }}
        />
      </label>
      <button
        onClick={onSubmit}
        disabled={isSubmitting || !isStoryValidToSubmit}
      >
        Submit
      </button>

      <button onClick={onGoBackToToContentStepClick} disabled={isSubmitting}>
        Back
      </button>
    </div>
  );
}
