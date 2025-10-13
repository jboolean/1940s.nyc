import React from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import classnames from 'classnames';
import * as maplibregl from 'maplibre-gl';

import { MapInterface, MapProps } from './MapInterface';
import * as overlays from './overlays';

export { OverlayId } from './overlays';

import stylesheet from './MainMap.less';

import { getStyle } from 'screens/App/shared/mapStyles/fourties.protomaps.style';

const PHOTO_LAYER = 'photos-1940s';

const MapLibreMap = React.forwardRef<MapInterface, MapProps>(function MapLibreMap(
  { className: propsClassName, overlay, panOnClick },
  ref
) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const navigate = useNavigate();
  const { identifier } = useParams<{ identifier?: string }>();

  const syncUI = React.useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setFilter(`${PHOTO_LAYER}-active`, [
      '==',
      ['get', 'photoIdentifier'],
      identifier || null,
    ]);

    overlays.setOverlay(map, overlay);
  }, [identifier, overlay]);

  React.useEffect(() => {
    let isMounted = true;

    const initialize = async (): Promise<void> => {
      if (!containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
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

      if (!isMounted) {
        map.remove();
        return;
      }

      mapRef.current = map;

      map.on('click', PHOTO_LAYER, (e) => {
        if (!e || !e.features) return;
        const feature = e.features[0];
        const photoIdentifier = feature.properties?.photoIdentifier as string;

        if (panOnClick) map.panTo(e.lngLat);

        navigate(
          {
            pathname: `/map/photo/${photoIdentifier}`,
            hash: window.location.hash,
          },
          { replace: false }
        );
      });

      map.on('mouseenter', PHOTO_LAYER, () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', PHOTO_LAYER, () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('style.load', () => {
        overlays.installLayers(map, PHOTO_LAYER);

        map.setLayoutProperty(`${PHOTO_LAYER}-active`, 'visibility', 'visible');

        syncUI();
      });

      map.on('moveend', () => {
        if (!map.isStyleLoaded()) return;
        syncUI();
      });
    };

    void initialize();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [navigate, panOnClick, syncUI]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!map.isStyleLoaded()) {
      map.once('style.load', syncUI);
      return;
    }

    syncUI();
  }, [syncUI]);

  React.useImperativeHandle(
    ref,
    () => ({
      goTo: (center: { lng: number; lat: number } | [number, number]) => {
        const map = mapRef.current;
        if (!map) return;
        map.easeTo({
          zoom: 17.5,
          center,
        });
      },
      resize: () => {
        mapRef.current?.resize();
      },
    }),
    []
  );

  return (
    <div
      className={classnames(stylesheet.map, propsClassName)}
      ref={containerRef}
    />
  );
});

export default MapLibreMap;
