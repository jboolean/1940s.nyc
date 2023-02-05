import React, { ChangeEventHandler } from 'react';
import Button from 'shared/components/Button';
import TextArea from 'shared/components/TextArea';
import IntroGraph from '../IntroGraph';

import stylesheet from './TextContent.less';

export default function TextContent({
  textContent,
  onTextContentChange,
  onSubmit,
  isSubmitting,
  isValidToSave,
  isAudioStorytellingEnabled,
  isAlreadyPublished,
}: {
  textContent: string;
  onTextContentChange: (newTextContent: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isValidToSave: boolean;
  isAudioStorytellingEnabled: boolean;
  isAlreadyPublished: boolean;
}): JSX.Element {
  const handleTextContentChange: ChangeEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    onTextContentChange(event.target.value);
  };

  const textInputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, []);

  return (
    <div className={stylesheet.content}>
      <h1>Add your story</h1>
      {isAudioStorytellingEnabled ? null : <IntroGraph />}
      <TextArea
        className={stylesheet.writingArea}
        placeholder="Share as little or much as you&rsquo;d like about this photo and surrounding area"
        value={textContent ?? ''}
        onChange={handleTextContentChange}
        ref={textInputRef}
      />
      <div>
        <Button
          buttonStyle="primary"
          onClick={onSubmit}
          disabled={isSubmitting || !isValidToSave}
        >
          {isAlreadyPublished ? (
            <>Unpublish & Save Updated Draft</>
          ) : (
            <>Save Draft & Continue</>
          )}
        </Button>
      </div>
    </div>
  );
}
