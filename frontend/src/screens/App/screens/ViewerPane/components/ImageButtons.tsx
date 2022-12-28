import React from 'react';

import { useParams } from 'react-router-dom';
import { API_BASE } from 'utils/apiConstants';

import { useFeatureFlag } from 'screens/App/shared/stores/FeatureFlagsStore';
import FeatureFlag from 'screens/App/shared/types/FeatureFlag';
import { useStoryDraftStore } from '../../SubmitStoryWizard';
import Button, { ButtonStyledLink } from 'shared/components/Button';

export default function ImageButtons(): JSX.Element {
  const { identifier: photoIdentifier } = useParams<{ identifier?: string }>();
  const initializeStoryDraft = useStoryDraftStore((state) => state.initialize);
  const isStorytellingEnabled = useFeatureFlag(FeatureFlag.STORYTELLING);

  return (
    <div>
      <ButtonStyledLink
        buttonTheme="viewer"
        buttonStyle="secondary"
        href={`${API_BASE}/photos/${photoIdentifier}/buy-prints`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Order Print
      </ButtonStyledLink>
      {isStorytellingEnabled ? (
        <Button
          buttonTheme="viewer"
          buttonStyle="secondary"
          onClick={() => {
            initializeStoryDraft(photoIdentifier);
          }}
        >
          Share Your Story
        </Button>
      ) : null}
    </div>
  );
}
