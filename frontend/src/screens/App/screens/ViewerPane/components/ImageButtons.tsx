import React from 'react';

import { useParams } from 'react-router-dom';
import { API_BASE } from 'utils/apiConstants';

import Button, { ButtonStyledLink } from 'shared/components/Button';
import { useStoryDraftStore } from '../../SubmitStoryWizard';
import { useFeatureFlag } from 'screens/App/shared/stores/FeatureFlagsStore';
import FeatureFlag from 'screens/App/shared/types/FeatureFlag';
import useColorizationStore from '../stores/ColorizationStore';

export default function ImageButtons(): JSX.Element {
  const { identifier: photoIdentifier } = useParams<{ identifier?: string }>();
  const initializeStoryDraft = useStoryDraftStore((state) => state.initialize);
  const colorizationEnabled = useFeatureFlag(FeatureFlag.COLORIZATION);
  const { toggleColorization, isLoading, colorEnabledForIdentifier } =
    useColorizationStore();

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
      {colorizationEnabled && (
        <Button
          buttonTheme="viewer"
          buttonStyle="secondary"
          disabled={isLoading}
          onClick={() => {
            toggleColorization(photoIdentifier);
          }}
        >
          Color{isLoading && '...'} (
          {photoIdentifier === colorEnabledForIdentifier ? 'On' : 'Off'})
        </Button>
      )}
      <Button
        buttonTheme="viewer"
        buttonStyle="secondary"
        onClick={() => {
          initializeStoryDraft(photoIdentifier);
        }}
      >
        Know This Place?
      </Button>
    </div>
  );
}
