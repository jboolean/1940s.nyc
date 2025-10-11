import React from 'react';

import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';

import classnames from 'classnames';
import * as maplibregl from 'maplibre-gl';

import { MapInterface, MapProps } from './MapInterface';
import * as overlays from './overlays';

export { OverlayId } from './overlays';

import { RouteComponentProps } from 'react-router';
import stylesheet from './MainMap.less';

import { getStyle } from 'screens/App/shared/mapStyles/fourties.protomaps.style';

const PHOTO_LAYER = 'photos-1940s';

type PropsWithRouter = MapProps & RouteComponentProps<{ identifier?: string }>;

class MapLibreMap
  extends React.PureComponent<PropsWithRouter>
  implements MapInterface
{
  private mapContainer: HTMLElement;
  private map: maplibregl.Map;

  async componentDidMount(): Promise<void> {
    const map: maplibregl.Map = new maplibregl.Map({
      container: this.mapContainer,
      style: await getStyle(),
      center: [-73.99397, 40.7093],
      zoom: 13.69,
      maxBounds: [
        [-74.25908989999999, 40.4773991], // SW
        [-73.70027209999999, 40.9175771], // NE
      ],
      hash: true,
      attributionControl: {
        compact: false,
      },
    });
    this.map = map;

    map.on('click', PHOTO_LAYER, (e) => {
      const { panOnClick } = this.props;
      if (panOnClick) map.panTo(e.lngLat);
      if (!e || !e.features) return;
      const feature = e.features[0];
      const identifier = feature.properties?.photoIdentifier as string;
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

    // Added to remove layers outside the viewport, to make the attribution correct
    map.on('moveend', () => {
      if (!map.isStyleLoaded()) return;
      this.syncUI();
    });
  }

  componentDidUpdate(prevProps: PropsWithRouter): void {
    // Update the conditional color expression to make the active dot a different color
    if (!this.map.isStyleLoaded()) {
      void this.map.once('style.load', () => this.syncUI());
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

  goTo(center: maplibregl.LngLatLike): void {
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

// Simple wrapper to provide router context
function withRouterRef(
  Component: typeof MapLibreMap
): React.ForwardRefExoticComponent<
  MapProps & React.RefAttributes<MapInterface>
> {
  return React.forwardRef<MapInterface, MapProps>(function WithRouterRef(
    props,
    ref
  ) {
    const match = useRouteMatch();
    const location = useLocation();
    const history = useHistory();

    const componentRef = React.useRef<MapLibreMap>(null);

    React.useImperativeHandle(
      ref,
      () => ({
        goTo: (center: { lng: number; lat: number } | [number, number]) => {
          if (componentRef.current) {
            componentRef.current.goTo(center);
          }
        },
        resize: () => {
          if (componentRef.current) {
            componentRef.current.resize();
          }
        },
      }),
      []
    );

    return (
      <Component
        ref={componentRef}
        match={match}
        location={location}
        history={history}
        {...props}
      />
    );
  });
}

export default withRouterRef(MapLibreMap);
