import { AppDataSource } from '../createConnection';
import EffectiveGeocode from '../entities/EffectiveGeocode';
import LngLat from '../enum/LngLat';

export default async function getLngLatForIdentifier(
  identifier: string
): Promise<LngLat | null> {
  const geocodeRepo = AppDataSource.getRepository(EffectiveGeocode);

  const lngLatForFromIdentifierResult = await geocodeRepo.findOneBy({
    identifier,
  });

  return lngLatForFromIdentifierResult?.lngLat ?? null;
}
