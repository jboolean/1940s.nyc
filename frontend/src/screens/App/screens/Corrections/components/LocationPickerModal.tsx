import round from 'lodash/round';
import mapboxgl from 'mapbox-gl';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol as PmTilesProtocol } from 'pmtiles';
import React from 'react';

import { useFeatureFlag } from 'screens/App/shared/stores/FeatureFlagsStore';
import FeatureFlag from 'screens/App/shared/types/FeatureFlag';

import useCorrectionsStore, {
  useCorrectionsStoreComputeds,
} from '../stores/CorrectionsStore';

import FourtiesModal from 'shared/components/Modal';

import {
  installLayers,
  setOverlay,
} from '../../MapPane/components/MainMap/overlays';
import stylesheet from './LocationPickerModal.less';

import mapStyleUrl from 'screens/App/shared/mapStyles/fourties.protomaps.style.json';

const MAPBOX_STYLE = __DEV__
  ? 'mapbox://styles/julianboilen/ck5jrzrs11r1p1imia7qzjkm1/draft'
  : 'mapbox://styles/julianboilen/ck5jrzrs11r1p1imia7qzjkm1';

const DEFAULT_LNG_LAT = [-73.99397, 40.7093] as const;

// Initialize pmtiles protocol for MapLibre
const pmtilesProtocol = new PmTilesProtocol();
if (typeof maplibregl !== 'undefined' && maplibregl.addProtocol) {
  maplibregl.addProtocol('pmtiles', pmtilesProtocol.tile);
}

export default function LocationPickerModal(): JSX.Element {
  const useMapLibre = useFeatureFlag(FeatureFlag.USE_MAPLIBRE);
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<mapboxgl.Map | maplibregl.Map | null>(null);
  const {
    isMapOpen,
    closeMap,
    correctedLng,
    correctedLat,
    setCorrectedLngLat,
    photo,
  } = useCorrectionsStore(
    ({
      isMapOpen,
      closeMap,
      correctedLng,
      correctedLat,
      setCorrectedLngLat,
      photo,
    }) => ({
      isMapOpen,
      closeMap,
      correctedLng,
      correctedLat,
      setCorrectedLngLat,
      photo,
    })
  );
  const { previousLng, previousLat } = useCorrectionsStoreComputeds();

  const renderMap = (): void => {
    const startingPosition = [
      correctedLng ?? previousLng ?? DEFAULT_LNG_LAT[0],
      correctedLat ?? previousLat ?? DEFAULT_LNG_LAT[1],
    ] as [number, number];

    if (useMapLibre) {
      // MapLibre implementation
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyleUrl as unknown as string,
        center: startingPosition,
        maxBounds: [
          [-74.25908989999999, 40.4773991], // SW
          [-73.70027209999999, 40.9175771], // NE
        ],
        zoom: 17,
        hash: false,
        attributionControl: {
          compact: false,
        },
      });

      map.current.on('style.load', () => {
        map.current.setFilter('photos-1940s', [
          '!=',
          ['get', 'photoIdentifier'],
          photo.identifier || null,
        ]);

        (map.current as maplibregl.Map).addControl(
          new maplibregl.NavigationControl(),
          'top-right'
        );
        installLayers(map.current, 'photos-1940s', {
          fadeOverlays: false,
        });
        setOverlay(map.current, ['default-map', 'bbl-label']);
      });

      map.current.on('moveend', () => {
        const center = map.current.getCenter();
        setCorrectedLngLat(round(center.lng, 6), round(center.lat, 6));
      });

      // Add marker for center position
      const marker = new maplibregl.Marker({
        draggable: false,
        color: '#87b6a8',
      })
        .setLngLat(startingPosition)
        .addTo(map.current);

      map.current.on('move', () => {
        marker.setLngLat(map.current.getCenter());
      });
    } else {
      // MapBox implementation
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
        map.current.setFilter('photos-1940s', [
          '!=',
          ['get', 'photoIdentifier'],
          photo.identifier || null,
        ]);
        map.current.removeLayer('photos-1940s-wide-zoom');

        (map.current as mapboxgl.Map).addControl(
          new mapboxgl.NavigationControl(),
          'top-right'
        );
        installLayers(map.current, 'photos-1940s', {
          fadeOverlays: false,
        });
        setOverlay(map.current, ['default-map', 'bbl-label']);
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
    }
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
