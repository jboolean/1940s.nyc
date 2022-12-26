import React from 'react';
import FourtiesModal from 'shared/components/Modal';

import Intro from './components/Intro';
import StorytellerInfo from './components/StorytellerInfo';
import TextContent from './components/TextContent';
import ThankYou from './components/ThankYou';
import Step from './shared/types/Step';

import useStoryDraftStore, {
  useStoryDraftStoreComputeds,
} from './StoryDraftStore';

const StoryWizardContent = (): JSX.Element | null => {
  const {
    step,
    draftStory,
    isSaving,

    beginTextStory,
    setTextContent,
    saveContent,
    setStorytellerName,
    setStorytellerSubtitle,
    setStorytellerEmail,
    submitStorytellerInfo,
    goBackToContentStep,
    close,
  } = useStoryDraftStore();

  const { isValidToSaveContentDraft, isValidToSubmit } =
    useStoryDraftStoreComputeds();

  switch (step) {
    case Step.INTRO:
      return <Intro onBeginTextStory={beginTextStory} />;
    case Step.CONTENT_TEXT:
      return (
        <TextContent
          textContent={draftStory.textContent ?? ''}
          onTextContentChange={setTextContent}
          onSubmit={saveContent}
          isSubmitting={isSaving}
          isValidToSave={isValidToSaveContentDraft}
        />
      );
    case Step.STORYTELLER_INFO:
      return (
        <StorytellerInfo
          storytellerName={draftStory.storytellerName}
          storytellerSubtitle={draftStory.storytellerSubtitle}
          storytellerEmail={draftStory.storytellerEmail}
          onGoBackToToContentStepClick={goBackToContentStep}
          onStorytellerNameChange={setStorytellerName}
          onStorytellerSubtitleChange={setStorytellerSubtitle}
          onStorytellerEmailChange={setStorytellerEmail}
          onSubmit={submitStorytellerInfo}
          isSubmitting={isSaving}
          isStoryValidToSubmit={isValidToSubmit}
        />
      );
    case Step.THANK_YOU:
      return <ThankYou onCloseClicked={close} />;
  }
  return null;
};

export default function SubmitStoryWizard(): JSX.Element {
  const isOpen = useStoryDraftStore((state) => state.isOpen);
  const onRequestClose = useStoryDraftStore((state) => state.close);

  return (
    <FourtiesModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      size="large"
      isCloseButtonVisible={true}
    >
      <StoryWizardContent />
    </FourtiesModal>
  );
}

// expose the store so the initialize action can be called from wherever the button is
export { useStoryDraftStore };
