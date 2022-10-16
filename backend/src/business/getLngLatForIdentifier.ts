import { Point } from 'geojson';
import { getRepository } from 'typeorm';
import EffectiveGeocode from '../entities/EffectiveGeocode';

export default async function getLngLatForIdentifier(
  identifier: string
): Promise<Point | null> {
  const geocodeRepo = getRepository(EffectiveGeocode);

  const lngLatForFromIdentifierResult = await geocodeRepo.findOne({
    identifier,
  });

  return lngLatForFromIdentifierResult?.lngLat ?? null;
}
