import React from 'react';

import { useParams } from 'react-router';
import { API_BASE } from 'utils/apiConstants';

import Button, { ButtonStyledLink } from 'shared/components/Button';
import recordEvent from 'shared/utils/recordEvent';
import { useCorrectionsStore } from '../../Corrections';
import { openPrintModal } from '../../PrintModal';
import { useStoryDraftStore } from '../../SubmitStoryWizard';
import ColorizeButton from './ColorizeButton';

export default function ImageButtons(): React.JSX.Element {
  const { identifier: photoIdentifier } = useParams<{ identifier?: string }>();
  const initializeStoryDraft = useStoryDraftStore((state) => state.initialize);
  const initializeCorrections = useCorrectionsStore(
    (state) => state.initialize
  );

  const orderPrintEvent = {
    category: 'Image Viewer',
    action: 'Clicks Order Print',
  };
  const orderPrintProps = {
    buttonTheme: 'viewer',
    buttonStyle: 'secondary',
    'data-testid': 'order-print-button',
    children: 'Order Print',
  } as const;

  return (
    <div>
      <Button
        {...orderPrintProps}
        onClick={() => {
          recordEvent(orderPrintEvent);
          if (photoIdentifier) openPrintModal(photoIdentifier);
        }}
      />
      <ColorizeButton photoIdentifier={photoIdentifier} />
      <Button
        buttonTheme="viewer"
        buttonStyle="secondary"
        data-testid="know-this-place-button"
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
