import React from 'react';

import MainMap from './components/MainMap';
import ViewerPane from './components/ViewerPane';

import stylesheet from './Map.less';

interface State {
  activePhotoIdentifier: string | null;
}

export default class Map extends React.PureComponent<{}, State> {
  map?: MainMap;

  constructor(props: {}) {
    super(props);
    this.state = {
      activePhotoIdentifier: null,
    };

    this.handlePhotoSelected = this.handlePhotoSelected.bind(this);
  }

  handlePhotoSelected(newPhotoIdentifier: string): void {
    this.setState(
      {
        activePhotoIdentifier: newPhotoIdentifier,
      },
      () => {
        this.map.resize();
      }
    );
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
        <MainMap
          ref={ref => (this.map = ref)}
          className={stylesheet.map}
          onPhotoClick={this.handlePhotoSelected}
          panOnClick={false}
          activePhotoIdentifier={activePhotoIdentifier}
        />
      </div>
    );
  }
}
