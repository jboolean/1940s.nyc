import React from 'react';

import MainMap from './screens/MainMap';
import { LayerId } from './screens/MainMap';
import ViewerPane from './screens/ViewerPane';

import stylesheet from './App.less';

interface State {
  activePhotoIdentifier: string | null;
  layer: LayerId;
}

export default class App extends React.PureComponent<{}, State> {
  map?: MainMap;

  constructor(props: {}) {
    super(props);
    this.state = {
      activePhotoIdentifier: null,
      layer: 'photos-1940s',
    };

    this.handlePhotoSelected = this.handlePhotoSelected.bind(this);
    this.handleLayerChange = this.handleLayerChange.bind(this);
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

  handleLayerChange(layer: LayerId): void {
    this.setState({
      layer,
    });
  }

  render(): React.ReactNode {
    const { activePhotoIdentifier, layer } = this.state;

    return (
      <div className={stylesheet.container}>
        {activePhotoIdentifier ? (
          <ViewerPane
            photoIdentifier={activePhotoIdentifier}
            onRequestClose={this.handlePhotoSelected.bind(this, null)}
          />
        ) : null}
        <div className={stylesheet.mapContainer}>
          <div className={stylesheet.layers}>
            {([
              { name: 'Street', value: 'photos-1940s' },
              { name: 'Street (1937)', value: 'district-1937' },
              { name: 'Buildings (1916)', value: 'atlas-1916' },
              { name: 'Buildings (1956)', value: 'atlas-1956' },
              { name: 'Arial (1924)', value: 'arial-1924' },
              { name: 'Arial (1951)', value: 'arial-1951' },
            ] as { name: string; value: LayerId }[]).map(option => (
              <label key={option.value}>
                <input
                  key={option.value}
                  type="radio"
                  name="layer"
                  value={layer}
                  checked={option.value === layer}
                  onChange={() => this.handleLayerChange(option.value)}
                />
                {option.name}
              </label>
            ))}
          </div>
          <MainMap
            ref={ref => (this.map = ref)}
            className={stylesheet.map}
            onPhotoClick={this.handlePhotoSelected}
            panOnClick={false}
            activePhotoIdentifier={activePhotoIdentifier}
            layer={layer}
          />
        </div>
      </div>
    );
  }
}
