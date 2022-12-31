import React from 'react';

import classnames from 'classnames';

import ImageSwitcher from './components/ImageSwitcher';

import stylesheet from './ViewerPane.less';

import { useHistory, useParams } from 'react-router';
import Alternates from './components/Alternates';
import Overlay from './components/Overlay';

import ImageButtons from './components/ImageButtons';
import Stories from './components/Stories';
import { useFeatureFlag } from 'screens/App/shared/stores/FeatureFlagsStore';
import FeatureFlag from 'screens/App/shared/types/FeatureFlag';
import { PHOTO_BASE } from 'shared/utils/apiConstants';

export default function ViewerPane({
  className,
}: {
  className: string;
}): JSX.Element {
  const { identifier: photoIdentifier } = useParams<{ identifier?: string }>();
  const history = useHistory();
  const isStorytellingEnabled = useFeatureFlag(FeatureFlag.STORYTELLING);

  return (
    <div className={classnames(stylesheet.container, className)}>
      <Overlay>
        <div className={stylesheet.overlayContentWrapper}>
          <div className={stylesheet.floorFade} />

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

          {isStorytellingEnabled ? (
            <div className={stylesheet.stories}>
              <Stories photoIdentifier={photoIdentifier} />
            </div>
          ) : null}

          <div className={stylesheet.buttons}>
            <ImageButtons />
          </div>

          <p className={stylesheet.credit}>Photo © NYC Municipal Archives </p>
        </div>
      </Overlay>
      <ImageSwitcher
        className={stylesheet.image}
        src={`${PHOTO_BASE}/jpg/${photoIdentifier}.jpg`}
      />
    </div>
  );
}
