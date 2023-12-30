import mapboxgl from 'mapbox-gl';
import React from 'react';
import round from 'lodash/round';

import useCorrectionsStore, {
  useCorrectionsStoreComputeds,
} from '../stores/CorrectionsStore';

import FourtiesModal from 'shared/components/Modal';

import stylesheet from './LocationPickerModal.less';

const MAPBOX_STYLE = __DEV__
  ? 'mapbox://styles/julianboilen/ck5jrzrs11r1p1imia7qzjkm1/draft'
  : 'mapbox://styles/julianboilen/ck5jrzrs11r1p1imia7qzjkm1';

const DEFAULT_LNG_LAT = [-73.99397, 40.7093] as const;

export default function LocationPickerModal(): JSX.Element {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);
  const {
    isMapOpen,
    closeMap,
    correctedLng,
    correctedLat,
    setCorrectedLngLat,
  } = useCorrectionsStore(
    ({
      isMapOpen,
      closeMap,
      correctedLng,
      correctedLat,
      setCorrectedLngLat,
    }) => ({
      isMapOpen,
      closeMap,
      correctedLng,
      correctedLat,
      setCorrectedLngLat,
    })
  );
  const { previousLng, previousLat } = useCorrectionsStoreComputeds();

  const renderMap = (): void => {
    const startingPosition = [
      correctedLng ?? previousLng ?? DEFAULT_LNG_LAT[0],
      correctedLat ?? previousLat ?? DEFAULT_LNG_LAT[1],
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
      map.current.removeLayer('photos-1940s');
      map.current.removeLayer('photos-1940s-wide-zoom');

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    });

    map.current.on('moveend', () => {
      const center = map.current.getCenter();
      setCorrectedLngLat(round(center.lng, 6), round(center.lat, 6));
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
      isOpen={isMapOpen}
      onRequestClose={closeMap}
      size="x-large"
      onAfterOpen={renderMap}
      onAfterClose={destroyMap}
    >
      <div className={stylesheet.content}>
        <h2>Move the map to position the pin</h2>
        <div>Close this dialog when complete</div>
        <div ref={mapContainer} className={stylesheet.map} />
      </div>
    </FourtiesModal>
  );
}
