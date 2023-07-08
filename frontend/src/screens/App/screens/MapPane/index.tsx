/* eslint-disable @typescript-eslint/ban-ts-comment */
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
import { withRouter, RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import recordEvent from 'shared/utils/recordEvent';
import ExternalIcon from './assets/external.svg?asset';
import { NumericFormat } from 'react-number-format';
import useAmountPresets from '../TipJar/useAmountPresets';
import { useTipJarStore } from '../TipJar';

function SuggestedTip(): JSX.Element {
  const [lowestAmount] = useAmountPresets();
  return <NumericFormat displayType="text" prefix="$" value={lowestAmount} />;
}

interface Props extends TipJarProps {
  className?: string;
}

interface State {
  overlay: OverlayId | null;
}

interface TipJarProps {
  handleOpenTipJar: () => void;
}
function withTipJar<P extends TipJarProps, C extends React.ComponentType<P>>(
  Component: C & React.ComponentType<P>
): React.FunctionComponent<Omit<P, keyof TipJarProps>> {
  function WithTipJar<PassProps extends Omit<P, keyof TipJarProps>>(
    props: PassProps
  ): JSX.Element {
    const { open } = useTipJarStore();
    // @ts-ignore -- I give up
    return <Component {...props} handleOpenTipJar={open} />;
  }
  return WithTipJar;
}
class MapPane extends React.Component<Props & RouteComponentProps, State> {
  map?: typeof MainMap;
  private idPrefix: string;
  historyUnlisten: () => void | null = null;

  constructor(props: Props & RouteComponentProps) {
    super(props);
    this.state = {
      overlay: 'default-map',
    };
    this.idPrefix = uniqueId('MapPane-');

    this.handleOverlayChange = this.handleOverlayChange.bind(this);
    this.handleSearchFeatureSelected =
      this.handleSearchFeatureSelected.bind(this);
    this.handleGeolocated = this.handleGeolocated.bind(this);
    this.openPhoto = this.openPhoto.bind(this);
  }

  componentWillUnmount(): void {
    if (this.historyUnlisten) this.historyUnlisten();
  }

  componentDidMount(): void {
    this.historyUnlisten = this.props.history.listen(() => {
      setTimeout(() => {
        if (this.map) this.map.resize();
      });
    });
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
    const { overlay } = this.state;
    const { className } = this.props;

    return (
      <div className={classnames(stylesheet.container, className)}>
        <div className={stylesheet.links}>
          <Link to="/stories" className={stylesheet.storiesLink}>
            Stories
          </Link>
          <Link to="/outtakes" className={stylesheet.outtakesLink}>
            Outtakes
          </Link>

          <button
            type="button"
            className={stylesheet.tipMeButton}
            data-test="tip-me-button"
            onClick={() => {
              recordEvent({
                category: 'Map',
                action: 'Click Leave Tip',
              });
              this.props.handleOpenTipJar();
            }}
          >
            <SuggestedTip /> Tip?
          </button>
          <a
            href="http://80s.nyc"
            target="_blank"
            rel="noopener noreferrer"
            className={stylesheet.eightiesLink}
            onClick={() => {
              alert('You you leaving 1940s.nyc for an unaffiliated site.');
            }}
          >
            1980s{' '}
            <img
              src={ExternalIcon}
              alt="External link"
              className={stylesheet.externalIcon}
            />
          </a>
        </div>
        <div className={stylesheet.topControls}>
          <Search
            onFeatureSelected={this.handleSearchFeatureSelected}
            className={stylesheet.search}
          />
          <Geolocate onGeolocated={this.handleGeolocated} />
        </div>
        <div className={stylesheet.overlays}>
          {(
            [
              { name: 'Street', value: 'default-map' },
              { name: 'Arial', value: 'default-arial' },
              // { name: 'Street (1937)', value: 'district' },
              // { name: 'Buildings (1916)', value: 'atlas-1916' },
              // { name: 'Buildings (1930)', value: 'atlas-1930' },
              // { name: 'Buildings (1956)', value: 'atlas-1956' },
              // { name: 'Arial (1924)', value: 'arial-1924' },
              // { name: 'Arial (1951)', value: 'arial-1951' },
            ] as { name: string; value: OverlayId }[]
          ).map((option) => (
            <React.Fragment key={option.value}>
              <input
                id={`${this.idPrefix}${option.value}`}
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
          ref={(ref) => (this.map = ref)}
          className={stylesheet.map}
          panOnClick={false}
          overlay={overlay}
        />
      </div>
    );
  }
}

export default withTipJar(withRouter(MapPane));
