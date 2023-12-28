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
        <dd>{photo.address ?? '—'}</dd>

        <dt>Borough / Block / Lot</dt>
        <dd>
          {photo.borough ?? '—'} / {photo.block ?? '—'} / {lot ?? '—'}
        </dd>

        <dt>Placement attempts</dt>
        <dd>
          <dl>
            {photo.geocodeResults
              .map(({ method, lngLat }) => {
                return (
                  <React.Fragment key={method}>
                    <dt key={method}>
                      {method in GEOCODE_METHOD_DISPLAY_NAMES
                        ? GEOCODE_METHOD_DISPLAY_NAMES[
                            method as keyof typeof GEOCODE_METHOD_DISPLAY_NAMES
                          ]
                        : method}
                    </dt>
                    <dd>
                      {lngLat ? (
                        <a
                          href={`https://www.openstreetmap.org/#map=17/${lngLat.lat}/${lngLat.lng}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📍 {lngLat.lat}, {lngLat.lng}
                        </a>
                      ) : (
                        <i>No result</i>
                      )}
                    </dd>
                  </React.Fragment>
                );
              })
              .reverse()}
          </dl>
        </dd>
      </dl>
    </details>
  );
}
