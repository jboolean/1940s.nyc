import React from 'react';

import { useParams } from 'react-router-dom';
import { API_BASE } from 'utils/apiConstants';

import Button, { ButtonStyledLink } from 'shared/components/Button';
import recordEvent from 'shared/utils/recordEvent';
import { useCorrectionsStore } from '../../Corrections';
import { useStoryDraftStore } from '../../SubmitStoryWizard';
import ColorizeButton from './ColorizeButton';

const ORDER_PRINT_EXTERNAL_LINK_MESSAGE =
  'You are leaving 1940s.nyc for the Department of Records and Information Services (DORIS), with which 1940s.nyc is not affilliated. 1940s.nyc cannot help with orders placed through DORIS. ' +
  'Copies are from the original negatives will not include colorization from 1940s.nyc. ';
export default function ImageButtons(): JSX.Element {
  const { identifier: photoIdentifier } = useParams<{ identifier?: string }>();
  const initializeStoryDraft = useStoryDraftStore((state) => state.initialize);
  const initializeCorrections = useCorrectionsStore(
    (state) => state.initialize
  );

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
          alert(ORDER_PRINT_EXTERNAL_LINK_MESSAGE);
          return true;
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
      <ButtonStyledLink
        buttonTheme="viewer"
        buttonStyle="secondary"
        href={`${API_BASE}/photos/${photoIdentifier}/download`}
        onClick={() => {
          recordEvent({
            category: 'Image Viewer',
            action: 'Clicks Download',
          });
          return true;
        }}
      >
        Download
      </ButtonStyledLink>
      <Button
        buttonTheme="viewer"
        buttonStyle="secondary"
        onClick={() => {
          initializeCorrections(photoIdentifier);
        }}
      >
        Fix
      </Button>
    </div>
  );
}
