import React from 'react';

import classnames from 'classnames';
import { Feature, Point } from 'geojson';
import noop from 'lodash/noop';
import uniqueId from 'lodash/uniqueId';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { closest } from 'utils/photosApi';
import { OverlayId } from './components/MainMap';
import { MapInterface } from './components/MainMap/MapInterface';
import stylesheet from './MapPane.less';
import Geolocate from './components/Geolocate';
import MainMap from './components/MainMap';
import Search from './components/Search';

import { NumericFormat } from 'react-number-format';
import ExternalIcon from 'shared/components/ExternalIcon';
import recordEvent from 'shared/utils/recordEvent';
import { useTipJarStore } from '../TipJar';
import useAmountPresets from '../TipJar/useAmountPresets';

function SuggestedTip(): JSX.Element {
  const [lowestAmount] = useAmountPresets();
  return <NumericFormat displayType="text" prefix="$" value={lowestAmount} />;
}

interface Props extends TipJarProps {
  className?: string;
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
    const componentProps = {
      ...(props as Omit<P, keyof TipJarProps>),
      handleOpenTipJar: open,
    } as P;
    return <Component {...componentProps} />;
  }
  return WithTipJar;
}

function MapPane({
  className,
  handleOpenTipJar,
}: Props & TipJarProps): JSX.Element {
  const [overlay, setOverlay] = React.useState<OverlayId>('default-map');
  const mapRef = React.useRef<MapInterface | null>(null);
  const setMapRef = React.useCallback((instance: MapInterface | null) => {
    mapRef.current = instance;
  }, []);
  const navigate = useNavigate();
  const location = useLocation();

  const idPrefix = React.useMemo(() => uniqueId('MapPane-'), []);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      mapRef.current?.resize();
    });

    return () => {
      window.clearTimeout(timeout);
    };
  }, [location.pathname, location.search, location.hash]);

  const handleOverlayChange = React.useCallback((nextOverlay: OverlayId) => {
    setOverlay(nextOverlay);
  }, []);

  const openPhoto = React.useCallback(
    (identifier: string) => {
      navigate(
        {
          pathname: `/map/photo/${identifier}`,
          hash: window.location.hash,
        },
        { replace: false }
      );
    },
    [navigate]
  );

  const handleSearchFeatureSelected = React.useCallback(
    (feature: Feature<Point>) => {
      const [lng, lat] = feature.geometry.coordinates;
      mapRef.current?.goTo({ lng, lat });

      closest({ lng, lat }).then(openPhoto, noop);
    },
    [openPhoto]
  );

  const handleGeolocated = React.useCallback(
    (position: { lat: number; lng: number }) => {
      mapRef.current?.goTo(position);
      closest(position).then(openPhoto, noop);
    },
    [openPhoto]
  );

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
            handleOpenTipJar();
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
            recordEvent({
              category: 'Map',
              action: 'Clicks 80s.nyc',
            });
            alert('You you leaving 1940s.nyc for an unaffiliated site.');
          }}
        >
          1980s <ExternalIcon />
        </a>
      </div>
      <div className={stylesheet.topControls}>
        <Search
          onFeatureSelected={handleSearchFeatureSelected}
          className={stylesheet.search}
        />
        <Geolocate onGeolocated={handleGeolocated} />
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
              id={`${idPrefix}${option.value}`}
              key={option.value || 'default'}
              type="radio"
              name="overlay"
              value={option.value}
              onChange={() => handleOverlayChange(option.value)}
              className={classnames(stylesheet.overlayInput)}
              checked={option.value === overlay}
            />
            <label
              htmlFor={idPrefix + option.value}
              className={classnames(stylesheet.overlayLabel)}
            >
              {option.name}
            </label>
          </React.Fragment>
        ))}
      </div>
      <MainMap
        ref={setMapRef}
        className={stylesheet.map}
        panOnClick={false}
        overlay={overlay}
      />
    </div>
  );
}

export default withTipJar(MapPane);
