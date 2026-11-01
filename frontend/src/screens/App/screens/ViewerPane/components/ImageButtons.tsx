import React from 'react';

import { useParams } from 'react-router';
import { API_BASE } from 'utils/apiConstants';

import Button, { ButtonStyledLink } from 'shared/components/Button';
import recordEvent from 'shared/utils/recordEvent';
import { useFeatureFlag } from '../../../shared/stores/FeatureFlagsStore';
import FeatureFlag from '../../../shared/types/FeatureFlag';
import { useCorrectionsStore } from '../../Corrections';
import { openPrintModal } from '../../PrintModal';
import { ORDER_PRINT_EXTERNAL_LINK_MESSAGE } from '../../PrintModal/archivesLink';
import { useStoryDraftStore } from '../../SubmitStoryWizard';
import ColorizeButton from './ColorizeButton';

export default function ImageButtons(): React.JSX.Element {
  const { identifier: photoIdentifier } = useParams<{ identifier?: string }>();
  const initializeStoryDraft = useStoryDraftStore((state) => state.initialize);
  const initializeCorrections = useCorrectionsStore(
    (state) => state.initialize
  );

  const printOrdersEnabled = useFeatureFlag(FeatureFlag.PRINT_ORDERS);

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
      {printOrdersEnabled ? (
        <Button
          {...orderPrintProps}
          onClick={() => {
            recordEvent(orderPrintEvent);
            if (photoIdentifier) openPrintModal(photoIdentifier);
          }}
        />
      ) : (
        <ButtonStyledLink
          {...orderPrintProps}
          href={`${API_BASE}/photos/${photoIdentifier}/buy-prints`}
          target="_blank"
          onClick={() => {
            recordEvent(orderPrintEvent);
            alert(ORDER_PRINT_EXTERNAL_LINK_MESSAGE);
            return true;
          }}
        />
      )}
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
