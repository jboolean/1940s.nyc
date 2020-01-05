import api from './api';

export async function closest(latLng: {
  lat: number;
  lng: number;
}): Promise<string> {
  const resp = await api.get('/photos/closest', { params: latLng });
  return resp.data.identifier;
}
