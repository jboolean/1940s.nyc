import React, { ChangeEventHandler } from 'react';
import Button from 'shared/components/Button';
import TextArea from 'shared/components/TextArea';

import stylesheet from './TextContent.less';

export default function TextContent({
  textContent,
  onTextContentChange,
  onSubmit,
  isSubmitting,
  isValidToSave,
  isAudioStorytellingEnabled,
}: {
  textContent: string;
  onTextContentChange: (newTextContent: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isValidToSave: boolean;
  isAudioStorytellingEnabled: boolean;
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
      {isAudioStorytellingEnabled ? null : (
        <>
          <p>
            Whether you lived here, you&rsquo;re a historian, or it&rsquo;s the
            set of your favorite New York novel, I&rsquo;d love if you shared
            your story and knowledge of this area with <i>1940s.nyc</i>{' '}
            visitors.
          </p>
        </>
      )}
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
          Save Draft & Continue
        </Button>
      </div>
    </div>
  );
}
