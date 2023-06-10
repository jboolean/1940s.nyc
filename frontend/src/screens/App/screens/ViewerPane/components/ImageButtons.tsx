import React from 'react';

import { useParams } from 'react-router-dom';
import { API_BASE } from 'utils/apiConstants';

import Button, { ButtonStyledLink } from 'shared/components/Button';
import { useStoryDraftStore } from '../../SubmitStoryWizard';
import ColorizeButton from './ColorizeButton';
import recordEvent from 'shared/utils/recordEvent';

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
        onClick={() => {
          recordEvent({
            category: 'Image Viewer',
            action: 'Clicks Order Print',
          });
        }}
      >
        Order Print
      </ButtonStyledLink>
      <ColorizeButton photoIdentifier={photoIdentifier} />
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
