/* eslint-disable @typescript-eslint/ban-ts-ignore */
import React from 'react';

import { OverlayId } from './components/MainMap';
import classnames from 'classnames';
import { Feature, Point } from 'geojson';
import { closest } from 'utils/photosApi';
import noop from 'lodash/noop';
import uniqueId from 'lodash/uniqueId';

import stylesheet from './MapPane.less';
import MainMap from './components/MainMap';
import Search from './components/Search';
import Geolocate from './components/Geolocate';
import TipJar from './components/TipJar';
import { withRouter, RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import recordEvent from 'shared/utils/recordEvent';
import ExternalIcon from '!file-loader!./assets/external.svg';

interface Props {
  className?: string;
}

interface State {
  overlay: OverlayId | null;
  isTipJarOpen: boolean;
}

class MapPane extends React.Component<Props & RouteComponentProps, State> {
  map?: typeof MainMap;
  private idPrefix: string;

  constructor(props: Props & RouteComponentProps) {
    super(props);
    this.state = {
      overlay: 'default-map',
      isTipJarOpen: false,
    };
    this.idPrefix = uniqueId('MapPane-');

    this.handleOverlayChange = this.handleOverlayChange.bind(this);
    this.handleSearchFeatureSelected = this.handleSearchFeatureSelected.bind(
      this
    );
    this.handleGeolocated = this.handleGeolocated.bind(this);
    this.openPhoto = this.openPhoto.bind(this);
  }

  handleOverlayChange(overlay: OverlayId): void {
    this.setState({
      overlay,
    });
  }

  handleSearchFeatureSelected(feature: Feature<Point>): void {
    const [lng, lat] = feature.geometry.coordinates;
    this.map.goTo({ lng, lat });

    closest({ lng, lat }).then(this.openPhoto, noop);
  }

  handleGeolocated(position: { lat: number; lng: number }): void {
    this.map.goTo(position);
    closest(position).then(this.openPhoto, noop);
  }

  openPhoto(identifier: string): void {
    this.props.history.push({
      pathname: '/map/photo/' + identifier,
      hash: window.location.hash,
    });
  }

  render(): React.ReactNode {
    const { overlay, isTipJarOpen } = this.state;
    const { className } = this.props;

    return (
      <div className={classnames(stylesheet.container, className)}>
        <TipJar
          isOpen={isTipJarOpen}
          onRequestClose={() => {
            this.setState({ isTipJarOpen: false });
          }}
        />
        <div className={stylesheet.links}>
          <Link to="/outtakes" className={stylesheet.outtakesLink}>
            Outtakes
          </Link>
          <a
            href="http://80s.nyc"
            target="_blank"
            rel="noopener noreferrer"
            className={stylesheet.eightiesLink}
          >
            1980s{' '}
            <img
              src={ExternalIcon}
              alt="External link"
              className={stylesheet.externalIcon}
            />
          </a>
          <button
            type="button"
            className={stylesheet.tipMeButton}
            data-test="tip-me-button"
            onClick={() => {
              recordEvent({
                category: 'Map',
                action: 'Click Leave Tip',
              });
              this.setState({ isTipJarOpen: true });
            }}
          >
            $2 Tip?
          </button>
        </div>
        <div className={stylesheet.topControls}>
          <Search
            onFeatureSelected={this.handleSearchFeatureSelected}
            className={stylesheet.search}
          />
          <Geolocate onGeolocated={this.handleGeolocated} />
        </div>
        <div className={stylesheet.overlays}>
          {([
            { name: 'Street', value: 'default-map' },
            { name: 'Arial', value: 'default-arial' },
            // { name: 'Street (1937)', value: 'district' },
            // { name: 'Buildings (1916)', value: 'atlas-1916' },
            // { name: 'Buildings (1930)', value: 'atlas-1930' },
            // { name: 'Buildings (1956)', value: 'atlas-1956' },
            // { name: 'Arial (1924)', value: 'arial-1924' },
            // { name: 'Arial (1951)', value: 'arial-1951' },
          ] as { name: string; value: OverlayId | null }[]).map(option => (
            <React.Fragment key={option.value}>
              <input
                id={this.idPrefix + option.value}
                key={option.value || 'default'}
                type="radio"
                name="overlay"
                value={option.value}
                onChange={() => this.handleOverlayChange(option.value)}
                className={classnames(stylesheet.overlayInput)}
                checked={option.value === overlay}
              />
              <label
                htmlFor={this.idPrefix + option.value}
                className={classnames(stylesheet.overlayLabel)}
              >
                {option.name}
              </label>
            </React.Fragment>
          ))}
        </div>
        <MainMap
          // @ts-ignore
          ref={ref => (this.map = ref)}
          className={stylesheet.map}
          panOnClick={false}
          overlay={overlay}
        />
      </div>
    );
  }
}

export default withRouter(MapPane);
