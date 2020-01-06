import React from 'react';

import { OverlayId } from './components/MainMap';
import classnames from 'classnames';
import { Feature, Point } from 'geojson';
import { closest } from 'utils/photosApi';
import noop from 'lodash/noop';

import stylesheet from './MapPane.less';
import MainMap from './components/MainMap';
import Search from './components/Search';
import Geolocate from './components/Geolocate';

interface Props {
  onPhotoClick: (identifier: string) => void;
  activePhotoIdentifier?: string;
  className?: string;
}

interface State {
  overlay: OverlayId | null;
}

export default class MapPane extends React.Component<Props, State> {
  map?: MainMap;

  constructor(props: Props) {
    super(props);
    this.state = {
      overlay: null,
    };

    this.handleOverlayChange = this.handleOverlayChange.bind(this);
    this.handleSearchFeatureSelected = this.handleSearchFeatureSelected.bind(
      this
    );
    this.handleGeolocated = this.handleGeolocated.bind(this);
  }

  handleOverlayChange(overlay: OverlayId): void {
    this.setState({
      overlay,
    });
  }

  handleSearchFeatureSelected(feature: Feature<Point>): void {
    const [lng, lat] = feature.geometry.coordinates;
    this.map.goTo({ lng, lat });

    closest({ lng, lat }).then(this.props.onPhotoClick, noop);
  }

  handleGeolocated(position: { lat: number; lng: number }): void {
    this.map.goTo(position);
    closest(position).then(this.props.onPhotoClick, noop);
  }

  render(): React.ReactNode {
    const { overlay } = this.state;
    const { activePhotoIdentifier, className, onPhotoClick } = this.props;

    return (
      <div className={classnames(stylesheet.container, className)}>
        <div className={stylesheet.topControls}>
          <Search onFeatureSelected={this.handleSearchFeatureSelected} />
          <Geolocate onGeolocated={this.handleGeolocated} />
        </div>
        <div className={stylesheet.overlays}>
          {([
            { name: 'Street', value: null },
            { name: 'Street (1937)', value: 'district' },
            { name: 'Buildings (1916)', value: 'atlas-1916' },
            { name: 'Buildings (1956)', value: 'atlas-1956' },
            { name: 'Arial (1924)', value: 'arial-1924' },
            { name: 'Arial (1951)', value: 'arial-1951' },
          ] as { name: string; value: OverlayId | null }[]).map(option => (
            <label key={option.value}>
              <input
                key={option.value || 'default'}
                type="radio"
                name="overlay"
                value={overlay || ''}
                checked={option.value === overlay}
                onChange={() => this.handleOverlayChange(option.value)}
              />
              {option.name}
            </label>
          ))}
        </div>
        <MainMap
          ref={ref => (this.map = ref)}
          className={stylesheet.map}
          onPhotoClick={onPhotoClick}
          panOnClick={false}
          activePhotoIdentifier={activePhotoIdentifier}
          overlay={overlay}
        />
      </div>
    );
  }
}
