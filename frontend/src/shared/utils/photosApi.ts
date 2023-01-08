import api from './api';

export interface PhotoSummary {
  identifier: string;
  collection: '1940' | '1980';
}

export interface Photo {
  address?: string;
  borough?: string;
  identifier: string;
}

export async function closest(latLng: {
  lat: number;
  lng: number;
}): Promise<string> {
  const resp = await api.get<PhotoSummary>('/photos/closest', {
    params: latLng,
  });
  return resp.data.identifier;
}

export async function getOuttakeSummaries(): Promise<PhotoSummary[]> {
  const resp = await api.get<PhotoSummary[]>('/photos/outtake-summaries');
  return resp.data;
}

// Cache allows querying for different identifiers in same result set without hitting the API just to get the same result set again
const alternatePhotosCache = new Map<string, PhotoSummary[]>();

export async function getAlternatePhotos(
  identifier: string
): Promise<PhotoSummary[]> {
  if (alternatePhotosCache.has(identifier)) {
    return alternatePhotosCache.get(identifier);
  }

  const resp = await api.get<PhotoSummary[]>('/photos', {
    params: {
      withSameLngLatByIdentifier: identifier,
    },
  });

  const result = resp.data;

  // Set the cache for every photo in the result set
  result.forEach((photo) => {
    alternatePhotosCache.set(photo.identifier, result);
  });
  return result;
}
