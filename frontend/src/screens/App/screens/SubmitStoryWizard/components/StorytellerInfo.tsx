import React from 'react';
import Button from 'shared/components/Button';
import Labeled from 'shared/components/Labeled';
import TextInput from 'shared/components/TextInput';

import stylesheet from './StorytellerInfo.less';

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
    <div className={stylesheet.container}>
      <h1>Add your story</h1>

      <div className={stylesheet.form}>
        <Labeled
          labelText="Name to display"
          renderInput={({ id }) => (
            <TextInput
              id={id}
              type="text"
              value={storytellerName}
              onChange={({ target: { value } }) => {
                onStorytellerNameChange(value);
              }}
            />
          )}
        />

        <Labeled
          labelText="Relationship to this place"
          renderInput={({ id }) => (
            <TextInput
              id={id}
              value={storytellerSubtitle}
              onChange={({ target: { value } }) => {
                onStorytellerSubtitleChange(value);
              }}
              placeholder="e.g. Resident, historian, my favorite spot…"
              maxLength={40}
            />
          )}
        />

        <Labeled
          labelText="Email (never made public)"
          renderInput={({ id }) => (
            <TextInput
              id={id}
              type="email"
              value={storytellerEmail}
              onChange={({ target: { value } }) => {
                onStorytellerEmailChange(value);
              }}
            />
          )}
        />
      </div>

      <p className={stylesheet.finePrint}>
        By using this site you agree to the{' '}
        <a href="/terms.html" target="_blank">
          Terms of Use
        </a>
      </p>

      {/* This text is legally required by reCAPTCHA because the badge is hidden */}
      <p className={stylesheet.finePrint}>
        This site is protected by reCAPTCHA and the Google{' '}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noreferrer"
        >
          Privacy Policy
        </a>{' '}
        and{' '}
        <a
          href="https://policies.google.com/terms"
          target="_blank"
          rel="noreferrer"
        >
          Terms of Service
        </a>{' '}
        apply.
      </p>

      <div className={stylesheet.buttons}>
        <Button
          buttonStyle="secondary"
          onClick={onGoBackToToContentStepClick}
          disabled={isSubmitting}
        >
          Back
        </Button>

        <Button
          buttonStyle="primary"
          onClick={onSubmit}
          disabled={isSubmitting || !isStoryValidToSubmit}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
