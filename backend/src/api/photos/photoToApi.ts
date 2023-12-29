import Photo from '../../entities/Photo';

import { PhotoApiModel } from './PhotoApiModel';

export default function photoToApi(photo: Photo): PhotoApiModel {
  return {
    identifier: photo.identifier,
    collection: photo.collection,
    address: photo.address,
    borough: photo.borough,
    block: photo.block,
    lot: photo.lot,
    effectiveGeocode: photo.effectiveGeocode
      ? {
          method: photo.effectiveGeocode.method,
          lngLat: photo.effectiveGeocode.lngLat,
        }
      : undefined,
  };
}
