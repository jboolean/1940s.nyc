import Paginated from 'shared/types/Paginated';
import api from './api';

type Collection = '1940' | '1980';
export interface PhotoSummary {
  identifier: string;
}

interface Geocode {
  method: string;
  lngLat: { lng: number; lat: number } | null;
}

export interface Photo {
  identifier: string;
  collection: Collection;

  address?: string;
  borough?: string;
  block?: number;
  lot?: string;

  effectiveGeocode?: Geocode;
}

export async function getPhoto(identifier: string): Promise<Photo | null> {
  const resp = await api.get<Photo>(`/photos/${identifier}`);
  return resp.data ?? null;
}

export async function closest(latLng: {
  lat: number;
  lng: number;
}): Promise<string> {
  const resp = await api.get<Photo>('/photos/closest', {
    params: latLng,
  });
  return resp.data.identifier;
}

export async function getOuttakeSummaries(
  pageSize = 100,
  pageToken?: string
): Promise<Paginated<PhotoSummary>> {
  const resp = await api.get<Paginated<PhotoSummary>>(
    '/photos/outtake-summaries',
    {
      params: {
        pageToken,
        pageSize,
      },
    }
  );
  return resp.data;
}

// Cache allows querying for different identifiers in same result set without hitting the API just to get the same result set again
const alternatePhotosCache = new Map<string, Photo[]>();

export async function getAlternatePhotos(identifier: string): Promise<Photo[]> {
  if (alternatePhotosCache.has(identifier)) {
    return alternatePhotosCache.get(identifier);
  }

  const resp = await api.get<Photo[]>('/photos', {
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
