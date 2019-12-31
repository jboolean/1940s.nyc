import React from 'react';

import classnames from 'classnames';

import stylesheet from './ViewerPane.less';

interface Props {
  photoIdentifier: string;
  onRequestClose: () => void;
}

export default class ViewerPane extends React.Component<Props> {
  render(): React.ReactNode {
    const { photoIdentifier } = this.props;
    return (
      <div
        className={classnames(stylesheet.container, {
          [stylesheet.isOpen]: !!photoIdentifier,
        })}
      >
        <button
          className={stylesheet.closeButton}
          onClick={() => this.props.onRequestClose()}
        >
          Close
        </button>
        <img
          className={stylesheet.image}
          src={`https://photos.1940s.nyc/jpg/${photoIdentifier}.jpg`}
        />
      </div>
    );
  }
}
