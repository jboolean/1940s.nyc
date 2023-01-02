import React from 'react';

import { useParams } from 'react-router-dom';
import { API_BASE } from 'utils/apiConstants';

import Button, { ButtonStyledLink } from 'shared/components/Button';
import { useStoryDraftStore } from '../../SubmitStoryWizard';

export default function ImageButtons(): JSX.Element {
  const { identifier: photoIdentifier } = useParams<{ identifier?: string }>();
  const initializeStoryDraft = useStoryDraftStore((state) => state.initialize);

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
