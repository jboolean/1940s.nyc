import React from 'react';

import ImageSwitcher from './components/ImageSwitcher';

import { API_BASE } from 'utils/apiConstants';

import stylesheet from './ViewerPane.less';

interface Props {
  photoIdentifier: string;
  onRequestClose: () => void;
}

export default class ViewerPane extends React.Component<Props> {
  render(): React.ReactNode {
    const { photoIdentifier } = this.props;
    return (
      <div className={stylesheet.container}>
        <button
          className={stylesheet.closeButton}
          onClick={() => this.props.onRequestClose()}
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
}
