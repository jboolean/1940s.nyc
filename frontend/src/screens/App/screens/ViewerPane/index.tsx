import React from 'react';

import classnames from 'classnames';

import ImageSwitcher from './components/ImageSwitcher';

import stylesheet from './ViewerPane.less';

import { useHistory, useParams } from 'react-router';
import Alternates from './components/Alternates';
import Overlay from './components/Overlay';

import ImageButtons from './components/ImageButtons';

export default function ViewerPane({
  className,
}: {
  className: string;
}): JSX.Element {
  const { identifier: photoIdentifier } = useParams<{ identifier?: string }>();
  const history = useHistory();

  return (
    <div className={classnames(stylesheet.container, className)}>
      <Overlay>
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

        <div className={stylesheet.buttons}>
          <ImageButtons />
        </div>

        <p className={stylesheet.credit}>Photo © NYC Municipal Archives </p>
      </Overlay>
      <ImageSwitcher
        className={stylesheet.image}
        src={`https://photos.1940s.nyc/jpg/${photoIdentifier}.jpg`}
      />
    </div>
  );
}
