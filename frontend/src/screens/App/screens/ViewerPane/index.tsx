import React from 'react';

import ImageSwitcher from './components/ImageSwitcher';

import { API_BASE } from 'utils/apiConstants';

import stylesheet from './ViewerPane.less';
import { useHistory, useParams } from 'react-router';

export default function ViewerPane(): JSX.Element {
  const history = useHistory();
  const { identifier: photoIdentifier } = useParams<{ identifier?: string }>();
  return (
    <div className={stylesheet.container}>
      <button
        className={stylesheet.closeButton}
        onClick={() =>
          history.push({ pathname: '..', hash: window.location.hash })
        }
      >
        Close
      </button>

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
