import api from 'shared/utils/api';

export async function createGeocodeCorrection(
  photoIdentifiers: string[],
  lat: number,
  lng: number
): Promise<void> {
  await api.post(`/corrections/geocode`, {
    photos: photoIdentifiers,
    lngLat: {
      lat,
      lng,
    },
  });
}
