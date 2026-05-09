import React from 'react';

import { NavigateFunction, useMatch, useNavigate } from 'react-router-dom';

import classnames from 'classnames';
import * as maplibregl from 'maplibre-gl';

import { MapInterface, MapProps } from './MapInterface';
import * as overlays from './overlays';

export { OverlayId } from './overlays';

import stylesheet from './MainMap.less';

import { getStyle } from 'screens/App/shared/mapStyles/fourties.protomaps.style';

const PHOTO_LAYER = 'photos-1940s';

interface PropsWithRouter extends MapProps {
  navigate: NavigateFunction;
  identifier?: string;
}

class MapLibreMap
  extends React.PureComponent<PropsWithRouter>
  implements MapInterface
{
  private mapContainer: HTMLElement;
  private map: maplibregl.Map | null = null;

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
      this.props.navigate({
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

    // Expose map instance so Playwright E2E tests can query rendered features.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (window as unknown as Record<string, unknown>).__testMapInstance = map;

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
    if (this.map && !this.map.isStyleLoaded()) {
      void this.map.once('style.load', () => this.syncUI());
    }
    if (
      prevProps.identifier !== this.props.identifier ||
      prevProps.overlay !== this.props.overlay
    ) {
      this.syncUI();
    }
  }

  syncUI(): void {
    if (!this.map) return;
    this.map.setFilter(PHOTO_LAYER + '-active', [
      '==',
      ['get', 'photoIdentifier'],
      this.props.identifier || null,
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
    if (!this.map) return;
    this.map.resize();
  }

  goTo(center: maplibregl.LngLatLike): void {
    if (!this.map) return;
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
        data-testid="map"
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
    const match = useMatch('/map/photo/:identifier');
    const identifier = match?.params.identifier;
    const navigate = useNavigate();

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
        identifier={identifier}
        navigate={navigate}
        {...props}
      />
    );
  });
}

export default withRouterRef(MapLibreMap);
