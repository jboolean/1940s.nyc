import React from 'react';

import classnames from 'classnames';

import ImageSwitcher from './components/ImageSwitcher';

import { API_BASE } from 'utils/apiConstants';

import stylesheet from './ViewerPane.less';

import { useHistory, useParams } from 'react-router';
import Alternates from './components/Alternates';
import Overlay from './components/Overlay';

import { useStoryDraftStore } from '../SubmitStoryWizard';
import { useFeatureFlag } from 'screens/App/shared/stores/FeatureFlagsStore';
import FeatureFlag from 'screens/App/shared/types/FeatureFlag';

export default function ViewerPane({
  className,
}: {
  className: string;
}): JSX.Element {
  const { identifier: photoIdentifier } = useParams<{ identifier?: string }>();
  const history = useHistory();
  const initializeStoryDraft = useStoryDraftStore((state) => state.initialize);
  const isStorytellingEnabled = useFeatureFlag(FeatureFlag.STORYTELLING);

  return (
    <div className={classnames(stylesheet.container, className)}>
      <Overlay>
        <button
          className={stylesheet.closeButton}
          onClick={() =>
            history.push({ pathname: '..', hash: window.location.hash })
          }
        >
          Close
        </button>

        <div className={stylesheet.alternates}>
          <Alternates originalIdentifier={photoIdentifier} />
        </div>

        <p className={stylesheet.credit}>
          Photo © NYC Municipal Archives{' '}
          <a
            href={`${API_BASE}/photos/${photoIdentifier}/buy-prints`}
            target="_blank"
            rel="noopener noreferrer"
            className={stylesheet.purchase}
          >
            Buy Prints
          </a>
          {isStorytellingEnabled ? (
            <button
              onClick={() => {
                initializeStoryDraft(photoIdentifier);
              }}
            >
              Share Story
            </button>
          ) : null}
        </p>
      </Overlay>
      <ImageSwitcher
        className={stylesheet.image}
        src={`https://photos.1940s.nyc/jpg/${photoIdentifier}.jpg`}
      />
    </div>
  );
}
