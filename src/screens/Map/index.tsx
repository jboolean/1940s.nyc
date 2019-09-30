import React from 'react';

import MainMap from './components/MainMap';
import ViewerPane from './components/ViewerPane';

import stylesheet from './Map.less';

interface State {
  activePhotoIdentifier: string | null;
}

export default class Map extends React.PureComponent<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      activePhotoIdentifier: null,
    };

    this.handlePhotoSelected = this.handlePhotoSelected.bind(this);
  }

  handlePhotoSelected(newPhotoIdentifier: string): void {
    this.setState({
      activePhotoIdentifier: newPhotoIdentifier,
    });
  }

  render(): React.ReactNode {
    const { activePhotoIdentifier } = this.state;

    return (
      <div className={stylesheet.container}>
        <MainMap onPhotoClick={this.handlePhotoSelected} />
        <ViewerPane photoIdentifier={activePhotoIdentifier} />
      </div>
    );
  }
}
