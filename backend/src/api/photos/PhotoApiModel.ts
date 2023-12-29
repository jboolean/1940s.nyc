import Collection from '../../enum/Collection';
import GeocodeMethod from '../../enum/GeocodeMethod';

interface Geocode {
  method: GeocodeMethod;
  lngLat: { lng: number; lat: number } | null;
}

interface PhotoApiModel {
  identifier: string;
  collection: Collection;

  address?: string;
  borough?: string;
  block?: number;
  lot?: string;

  effectiveGeocode?: Geocode;
}

export { PhotoApiModel };
