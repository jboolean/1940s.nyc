import React from 'react';

import { LayerId } from './components/MainMap';
import classnames from 'classnames';

import stylesheet from './MapPane.less';
import MainMap from './components/MainMap';

interface Props {
  onPhotoClick: (identifier: string) => void;
  activePhotoIdentifier?: string;
  className?: string;
}

interface State {
  layer: LayerId;
}

export default class MapPane extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      layer: 'photos-1940s',
    };

    this.handleLayerChange = this.handleLayerChange.bind(this);
  }

  handleLayerChange(layer: LayerId): void {
    this.setState({
      layer,
    });
  }

  render(): React.ReactNode {
    const { layer } = this.state;
    const { activePhotoIdentifier, className, onPhotoClick } = this.props;

    return (
      <div className={classnames(stylesheet.container, className)}>
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
          className={stylesheet.map}
          onPhotoClick={onPhotoClick}
          panOnClick={false}
          activePhotoIdentifier={activePhotoIdentifier}
          layer={layer}
        />
      </div>
    );
  }
}
