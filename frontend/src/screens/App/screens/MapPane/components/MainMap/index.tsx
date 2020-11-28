import React from 'react';

import {
  // withRouter,
  useHistory,
  useRouteMatch,
  useLocation,
} from 'react-router-dom';

import mapboxgl from 'mapbox-gl';
import classnames from 'classnames';

import * as overlays from './overlays';

export { OverlayId } from './overlays';

import stylesheet from './MainMap.less';
import { RouteComponentProps } from 'react-router';

const MAPBOX_STYLE = __DEV__
  ? 'mapbox://styles/julianboilen/ck5jrzrs11r1p1imia7qzjkm1/draft'
  : 'mapbox://styles/julianboilen/ck5jrzrs11r1p1imia7qzjkm1';

const PHOTO_LAYER = 'photos-1940s';

interface Props {
  className?: string;
  panOnClick: boolean;
  overlay: overlays.OverlayId;
}

type PropsWithRouter = Props & RouteComponentProps<{ identifier?: string }>;

class MainMap extends React.PureComponent<PropsWithRouter> {
  private mapContainer: Element;
  private map: mapboxgl.Map;

  componentDidMount(): void {
    const map = (this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: MAPBOX_STYLE,
      center: [-73.99397, 40.7093],
      zoom: 13.69,
      maxBounds: [
        [-74.25908989999999, 40.4773991], // SW
        [-73.70027209999999, 40.9175771], // NE
      ],
      hash: true,
    }));

    map.on('click', PHOTO_LAYER, (e) => {
      const { panOnClick } = this.props;
      if (panOnClick) map.panTo(e.lngLat);
      const feature = e.features[0];
      const identifier = feature.properties.photoIdentifier;
      this.props.history.push({
        pathname: '/map/photo/' + identifier,
        hash: window.location.hash,
      });
    });

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', PHOTO_LAYER, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', PHOTO_LAYER, () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('style.load', () => {
      overlays.installLayers(this.map, PHOTO_LAYER);

      map.setLayoutProperty(PHOTO_LAYER + '-active', 'visibility', 'visible');

      this.syncUI();
    });
  }

  componentDidUpdate(prevProps: PropsWithRouter): void {
    // Update the conditional color expression to make the active dot a different color
    if (!this.map.isStyleLoaded()) {
      this.map.once('style.load', () => this.syncUI());
    }
    if (
      prevProps.match.params.identifier !==
        this.props.match.params.identifier ||
      prevProps.overlay !== this.props.overlay
    ) {
      this.syncUI();
    }
  }

  syncUI(): void {
    this.map.setFilter(PHOTO_LAYER + '-active', [
      '==',
      ['get', 'photoIdentifier'],
      this.props.match.params.identifier || null,
    ]);

    overlays.setOverlay(this.map, this.props.overlay);
  }

  componentWillUnmount(): void {
    if (this.map) this.map.remove();
  }

  /**
   * Call if container has resized
   */
  resize(): void {
    this.map.resize();
  }

  goTo(center: mapboxgl.LngLatLike): void {
    this.map.easeTo({
      zoom: 17.5,
      center,
    });
  }

  render(): React.ReactNode {
    const { className: propsClassName } = this.props;

    return (
      <div
        className={classnames(stylesheet.map, propsClassName)}
        ref={(el) => (this.mapContainer = el)}
      />
    );
  }
}

/* This component needs to have public methods. Regular withRouter does not forward the ref needed to use public methods.
Created my own withRouter that forwards refs.
All the types got very confusing, sorry.
*/

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function withRouterRef<
  OuterProps,
  C = React.ComponentType<OuterProps & RouteComponentProps>
>(Component: C) {
  return React.forwardRef<C, OuterProps>((props, ref) => {
    const match = useRouteMatch();
    const location = useLocation();
    const history = useHistory();
    return (
      // I give up on types
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      <Component
        ref={ref}
        match={match}
        location={location}
        history={history}
        {...props}
      />
    );
  });
}

export default (withRouterRef<Props>(
  MainMap
) as unknown) as React.ComponentType<Props & React.RefAttributes<MainMap>> &
  Pick<MainMap, 'goTo'>;
