import * as express from 'express';
import { Forbidden } from 'http-errors';
import { Body, Post, Request, Route, Security } from 'tsoa';
import { getRepository } from 'typeorm';
import * as UserService from '../business/users/UserService';
import GeocodeCorrection from '../entities/GeocodeCorrection';
import LngLat from '../enum/LngLat';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';

type GeocodeCorrectionRequest = {
  photos: string[];
  lngLat: LngLat;
};

@Route('/corrections')
export class CorrectionsController {
  @Post('/geocode')
  @Security('user-token')
  public async createGeocodeCorrection(
    @Body() correctionRequest: GeocodeCorrectionRequest,
    @Request() req: express.Request
  ): Promise<void> {
    const { photos, lngLat } = correctionRequest;

    const userId = await getUserFromRequestOrCreateAndSetCookie(req);

    const user = await UserService.getUser(userId);

    // corrections can only be created by logged in users with an email address
    if (!user || user.isAnonymous) {
      throw new Forbidden(
        'You must be logged into an account with an email address to create corrections'
      );
    }

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
}
