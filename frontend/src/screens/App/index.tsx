import React from 'react';

import ViewerPane from './screens/ViewerPane';
import MapPane from './screens/MapPane';

import stylesheet from './App.less';

interface State {
  activePhotoIdentifier: string | null;
}

export default class App extends React.PureComponent<{}, State> {
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
        {activePhotoIdentifier ? (
          <ViewerPane
            photoIdentifier={activePhotoIdentifier}
            onRequestClose={this.handlePhotoSelected.bind(this, null)}
          />
        ) : null}
        <MapPane
          className={stylesheet.mapContainer}
          activePhotoIdentifier={activePhotoIdentifier}
          onPhotoClick={this.handlePhotoSelected}
        />
      </div>
    );
  }
}
