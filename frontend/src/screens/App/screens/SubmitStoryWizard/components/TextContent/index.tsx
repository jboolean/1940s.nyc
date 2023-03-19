import React, { ChangeEventHandler } from 'react';
import { StoryState } from 'screens/App/shared/types/Story';
import Button from 'shared/components/Button';
import TextArea from 'shared/components/TextArea';
import IntroGraph from '../IntroGraph';

import stylesheet from './TextContent.less';

const nextButtonLabelByStoryState: Record<StoryState, string> = {
  [StoryState.DRAFT]: 'Save Draft & Continue',
  [StoryState.PUBLISHED]: 'Unpublish & Save New Draft',
  [StoryState.SUBMITTED]: 'Update & Continue',
  [StoryState.REJECTED]: 'Save & Continue',
  [StoryState.USER_REMOVED]: 'Save New Draft & Continue',
};

export default function TextContent({
  textContent,
  onTextContentChange,
  onSubmit,
  isSubmitting,
  isValidToSave,
  isAudioStorytellingEnabled,
  storyState,
  onUnpublish,
}: {
  textContent: string;
  onTextContentChange: (newTextContent: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isValidToSave: boolean;
  isAudioStorytellingEnabled: boolean;
  storyState: StoryState;
  onUnpublish: () => void;
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
        placeholder="Share as little or much as you&rsquo;d like about this photo, the surrounding area, and your connection to it"
        value={textContent ?? ''}
        onChange={handleTextContentChange}
        ref={textInputRef}
      />
      <div>
        {storyState === StoryState.PUBLISHED ? (
          <Button
            buttonStyle="secondary"
            onClick={onUnpublish}
            disabled={isSubmitting}
          >
            Unpublish
          </Button>
        ) : null}
        <Button
          buttonStyle="primary"
          onClick={onSubmit}
          disabled={isSubmitting || !isValidToSave}
        >
          {nextButtonLabelByStoryState[storyState]}
        </Button>
      </div>
    </div>
  );
}
