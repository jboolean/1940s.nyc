import LngLat from '../../enum/LngLat';

const MAPBOX_USER = 'julianboilen';
const MAPBOX_PK =
  'pk.eyJ1IjoianVsaWFuYm9pbGVuIiwiYSI6ImNqb3A0ODg1djFkNGIza214aDQ0NjA2ZHYifQ.nw1o5FE0rdcN5DQLzRFQfQ';
const MAP_STYLE_ID = 'ck5jrzrs11r1p1imia7qzjkm1';
const LAYER_ID = 'photos-1940s';

export default function forgeStaticMapUrl(
  photoIdentifier: string,
  lngLat: LngLat,
  width: number,
  height: number,
  zoomLevel: number,
  retina = false
): string | null {
  if (!lngLat) {
    return null;
  }
  const { lng, lat } = lngLat;
  const mapImageUrl: URL = new URL(
    `/styles/v1/${MAPBOX_USER}/${MAP_STYLE_ID}/static/${lng},${lat},${zoomLevel}/${width}x${height}${
      retina ? '@2x' : ''
    }}`,
    'https://api.mapbox.com'
  );

  const mapImageUrlParams: URLSearchParams = new URLSearchParams();
  mapImageUrlParams.append('access_token', MAPBOX_PK);
  mapImageUrlParams.append(
    'setfilter',
    `["==", ["get", "photoIdentifier"], "${photoIdentifier}"]`
  );
  mapImageUrlParams.append('layer_id', LAYER_ID);

  mapImageUrl.search = mapImageUrlParams.toString();

  return mapImageUrl.toString();
}
