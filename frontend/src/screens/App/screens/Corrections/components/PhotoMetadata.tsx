import React from 'react';
import { Photo } from 'shared/utils/photosApi';

import stylesheet from './PhotoMetadata.less';

const GEOCODE_METHOD_DISPLAY_NAMES = {
  geosearch: 'NYC GeoSearch',
  gmaps: 'Google Maps',
  gmapsPlacesAutocomplete: 'Google Maps Place Autocomplete',
  mapbox: 'Mapbox',
  pluto: 'Primary Land Use Tax Lot Output (PLUTO)',
};

const EMPTY = '—';

export default function PhotoMetadata({
  photo,
}: {
  photo: Photo;
}): JSX.Element {
  // Lot numbers are strings, but can almost always be parsed as numbers and displayed better.
  const lot =
    !!photo.lot && !isNaN(Number(photo.lot ?? ''))
      ? Number(photo.lot)
      : photo.lot;
  return (
    <details className={stylesheet.metadataContainer}>
      <summary>Photo information</summary>
      <dl>
        <dt>Identifier</dt>
        <dd>{photo.identifier}</dd>

        <dt>Address</dt>
        <dd>{photo.address ?? EMPTY}</dd>

        <dt>Borough / Block / Lot</dt>
        <dd>
          {photo.borough ?? EMPTY} / {photo.block ?? EMPTY} / {lot ?? EMPTY}
        </dd>

        <dt>Placed using</dt>
        <dd>
          {GEOCODE_METHOD_DISPLAY_NAMES[
            photo.effectiveGeocode
              ?.method as keyof typeof GEOCODE_METHOD_DISPLAY_NAMES
          ] ||
            photo.effectiveGeocode?.method ||
            EMPTY}
        </dd>
      </dl>
    </details>
  );
}
