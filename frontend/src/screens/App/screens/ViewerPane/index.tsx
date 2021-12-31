import React from 'react';

import classnames from 'classnames';

import ImageSwitcher from './components/ImageSwitcher';

import { API_BASE } from 'utils/apiConstants';

import stylesheet from './ViewerPane.less';
import { useHistory, useParams } from 'react-router';
import Alternates from './components/Alternates';

export default function ViewerPane({
  className,
}: {
  className: string;
}): JSX.Element {
  const history = useHistory();

  const [isHovering, setIsHovering] = React.useState(false);
  const handleMouseOver = (): void => {
    setIsHovering(true);
  };

  const handleMouseOut = (): void => {
    setIsHovering(false);
  };

  const { identifier: photoIdentifier } = useParams<{ identifier?: string }>();
  return (
    <div
      className={classnames(stylesheet.container, className)}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseOut}
    >
      <button
        className={stylesheet.closeButton}
        onClick={() =>
          history.push({ pathname: '..', hash: window.location.hash })
        }
      >
        Close
      </button>

      {/* showing this results in API calls and photo loading - only do it if hovered */}
      {isHovering ? (
        <div className={stylesheet.alternates}>
          <Alternates originalIdentifier={photoIdentifier} />
        </div>
      ) : null}

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
      </p>

      <ImageSwitcher
        className={stylesheet.image}
        src={`https://photos.1940s.nyc/jpg/${photoIdentifier}.jpg`}
      />
    </div>
  );
}
