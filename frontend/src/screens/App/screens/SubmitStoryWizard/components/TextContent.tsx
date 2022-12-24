import React, { ChangeEventHandler } from 'react';
import Button from 'shared/components/Button';
import TextArea from 'shared/components/TextArea';

import stylesheet from './textContent.less';

export default function TextContent({
  textContent,
  onTextContentChange,
  onSubmit,
  isSubmitting,
  isValidToSave,
}: {
  textContent: string;
  onTextContentChange: (newTextContent: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isValidToSave: boolean;
}): JSX.Element {
  const handleTextContentChange: ChangeEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    onTextContentChange(event.target.value);
  };

  return (
    <div className={stylesheet.content}>
      <h1>Add your story</h1>
      <TextArea
        className={stylesheet.writingArea}
        placeholder="Share as little or much as you&rsquo;d like"
        value={textContent ?? ''}
        onChange={handleTextContentChange}
      />
      <div>
        <Button
          buttonStyle="primary"
          onClick={onSubmit}
          disabled={isSubmitting || !isValidToSave}
        >
          Save & Continue
        </Button>
      </div>
    </div>
  );
}
