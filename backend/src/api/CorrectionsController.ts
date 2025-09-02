import { Body, Post, Request, Route, Security } from '@tsoa/runtime';
import * as express from 'express';
import { Forbidden } from 'http-errors';
import { getRepository } from 'typeorm';
import * as UserService from '../business/users/UserService';
import AddressCorrection from '../entities/AddressCorrection';
import GeocodeCorrection from '../entities/GeocodeCorrection';
import LngLat from '../enum/LngLat';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';

interface CorrectionRequest {
  photos: string[];
}

type GeocodeCorrectionRequest = CorrectionRequest & {
  lngLat: LngLat;
};

type AddressCorrectionRequest = CorrectionRequest & {
  address: string;
};

async function getUserIdFromRequestForCorrection(
  req: express.Request
): Promise<number> {
  const userId = await getUserFromRequestOrCreateAndSetCookie(req);

  const user = await UserService.getUser(userId);

  // corrections can only be created by logged in users with an email address
  if (!user || user.isAnonymous || !user.isEmailVerified) {
    throw new Forbidden(
      'You must be logged into an account with a verified email address to create corrections'
    );
  }

  return userId;
}

@Route('/corrections')
export class CorrectionsController {
  @Post('/geocode')
  @Security('user-token')
  public async createGeocodeCorrection(
    @Body() correctionRequest: GeocodeCorrectionRequest,
    @Request() req: express.Request
  ): Promise<void> {
    const { photos, lngLat } = correctionRequest;

    const userId = await getUserIdFromRequestForCorrection(req);

    const correctionsRepository = getRepository(GeocodeCorrection);

    const corrections = photos.map((photo) => {
      const correction = new GeocodeCorrection();
      correction.photo = photo;
      correction.lngLat = lngLat;
      correction.userId = userId;
      return correction;
    });

    await correctionsRepository.save(corrections);
  }

  @Post('/address')
  @Security('user-token')
  public async createAddressCorrection(
    @Body() correctionRequest: AddressCorrectionRequest,
    @Request() req: express.Request
  ): Promise<void> {
    const { photos, address } = correctionRequest;

    const userId = await getUserIdFromRequestForCorrection(req);

    const correctionsRepository = getRepository(AddressCorrection);

    const corrections = photos.map((photo) => {
      const correction = new AddressCorrection();
      correction.photo = photo;
      correction.address = address;
      correction.userId = userId;
      return correction;
    });

    await correctionsRepository.save(corrections);
  }
}
