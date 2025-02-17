import React from 'react';

import mapboxgl from 'mapbox-gl';
import FourtiesModal from 'shared/components/Modal';
import useOrdersStore from '../shared/stores/OrdersStore';

import {
  installLayers,
  setOverlay,
} from 'screens/App/screens/MapPane/components/MainMap/overlays';
import Button from 'shared/components/Button';
import { MerchCustomizationOptions } from '../shared/utils/Order';
import stylesheet from './CustomizeModal.less';

const DEFAULT_LNG_LAT = {
  lng: -73.98196612358352,
  lat: 40.76808966119866,
} as const;

const MAPBOX_STYLE = __DEV__
  ? 'mapbox://styles/julianboilen/ck5jrzrs11r1p1imia7qzjkm1/draft'
  : 'mapbox://styles/julianboilen/ck5jrzrs11r1p1imia7qzjkm1';

export default function CustomizeModal(): JSX.Element {
  const {
    customizing,
    dismissCustomizing,
    draftCustomizationOptions,
    setDraftCustomizationOptions,
    saveCustomization,
  } = useOrdersStore();

  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);

  const customizationOptions: MerchCustomizationOptions | undefined =
    customizing?.customizationOptions;

  const renderMap = (): void => {
    const startingPosition = [
      draftCustomizationOptions?.lng ??
        customizationOptions?.lng ??
        DEFAULT_LNG_LAT.lng,
      draftCustomizationOptions?.lat ??
        customizationOptions?.lat ??
        DEFAULT_LNG_LAT.lat,
    ] as [number, number];
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: startingPosition,
      maxBounds: [
        [-74.25908989999999, 40.4773991], // SW
        [-73.70027209999999, 40.9175771], // NE
      ],
      zoom: 17,
      hash: false,
    });

    map.current.on('style.load', () => {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      installLayers(map.current, 'photos-1940s', {
        fadeOverlays: false,
      });
      setOverlay(map.current, 'default-map');
    });

    map.current.on('moveend', () => {
      const center = map.current.getCenter();
      setDraftCustomizationOptions({
        lng: center.lng,
        lat: center.lat,
        variant: customizing.internalVariant,
      });
      setOverlay(map.current, 'default-map');
    });

    // Add marker for center position
    const marker = new mapboxgl.Marker({
      draggable: false,
      color: '#87b6a8',
    })
      .setLngLat(startingPosition)
      .addTo(map.current);

    map.current.on('move', () => {
      marker.setLngLat(map.current.getCenter());
    });
  };

  const destroyMap = (): void => {
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
  };

  return (
    <FourtiesModal
      isOpen={!!customizing}
      onRequestClose={dismissCustomizing}
      shouldCloseOnEsc
      shouldCloseOnOverlayClick
      size="x-large"
      isCloseButtonVisible={true}
      onAfterOpen={renderMap}
      onAfterClose={destroyMap}
    >
      <div className={stylesheet.content}>
        <h1>Customize</h1>

        <p>
          Your unique tote bag will be printed with a map of your favorite
          neighborhood. Drag the map so the marker is in the center of the area
          you want to feature.
          <br />
          Manhattan has a historic map, and looks great printed. Other areas use
          a modern map. All locations feature tags from the thousands of
          personal stories on the site, and dots for every photo. Printed zoom
          level is not adjustable.
        </p>

        <div ref={mapContainer} className={stylesheet.map} />
        <div>
          <Button
            onClick={(): void => {
              void saveCustomization();
            }}
            disabled={!draftCustomizationOptions}
            buttonStyle={'primary'}
          >
            Send for printing
          </Button>
        </div>
      </div>
    </FourtiesModal>
  );
}
