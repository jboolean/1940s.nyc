import React from 'react';
import { StoryState } from 'screens/App/shared/types/Story';
import Button from 'shared/components/Button';
import TipTapEditor from 'shared/components/TipTapEditor';
import IntroGraph from '../IntroGraph';

import stylesheet from './TextContent.less';

const nextButtonLabelByStoryState: Record<StoryState, string> = {
  [StoryState.DRAFT]: 'Save Draft & Continue',
  [StoryState.PUBLISHED]: 'Unpublish & Save New Draft',
  [StoryState.SUBMITTED]: 'Update & Continue',
  [StoryState.REJECTED]: 'Save & Continue',
  [StoryState.USER_REMOVED]: 'Save New Draft & Continue',
};

const unpublishButtonLabelByStoryState: Record<
  StoryState.PUBLISHED | StoryState.SUBMITTED,
  string
> = {
  [StoryState.PUBLISHED]: 'Unpublish',
  [StoryState.SUBMITTED]: 'Remove',
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
  return (
    <div className={stylesheet.content}>
      <h1>Add your story</h1>
      {isAudioStorytellingEnabled ? null : <IntroGraph />}
      <TipTapEditor
        className={stylesheet.writingArea}
        placeholder="Share as little or much as you&rsquo;d like about this photo, the surrounding area, and your connection to it"
        aria-label="Story content"
        content={textContent ?? ''}
        editable={true}
        onChange={onTextContentChange}
      />
      <div>
        {storyState === StoryState.PUBLISHED ||
        storyState === StoryState.SUBMITTED ? (
          <Button
            buttonStyle="secondary"
            onClick={onUnpublish}
            disabled={isSubmitting}
          >
            {unpublishButtonLabelByStoryState[storyState]}
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
