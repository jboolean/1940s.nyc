import api from './api';

export interface PhotoSummary {
  identifier: string;
}

export async function closest(latLng: {
  lat: number;
  lng: number;
}): Promise<string> {
  const resp = await api.get('/photos/closest', { params: latLng });
  return resp.data.identifier;
}

export async function getOuttakeSummaries(): Promise<PhotoSummary[]> {
  const resp = await api.get<PhotoSummary[]>('/photos/outtake-summaries');
  return resp.data;
}
