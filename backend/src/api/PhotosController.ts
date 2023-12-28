import * as express from 'express';
import { BadRequest, NotFound } from 'http-errors';
import {
  Controller,
  Get,
  Path,
  Query,
  Request,
  Route,
  SuccessResponse,
} from 'tsoa';

import querystring from 'querystring';

import { getRepository, In } from 'typeorm';
import Photo from '../entities/Photo';
import getLngLatForIdentifier from '../repositories/getLngLatForIdentifier';

const PHOTO_PURCHASE_FORM_URL =
  'https://dorisorders.nyc.gov/dorisorders/ui/order-reproductions';

// I don't know whether DORIS has analytics, but if they do this will allow them to see my referrals
const UTM_TAGS_FOR_DORIS = {
  utm_source: 'fourtiesnyc',
  utm_campaign: 'order-print',
  utm_medium: 'referral',
};

@Route('photos')
export class PhotosController extends Controller {
  // Get photos by matching lng,lat
  @Get('/')
  public async getPhotos(
    @Request() req: express.Request,
    @Query() lng?: string | number,
    @Query() lat?: string | number,
    @Query() withSameLngLatByIdentifier?: string
  ): Promise<Photo[]> {
    const photoRepo = getRepository(Photo);

    if (withSameLngLatByIdentifier) {
      const lngLatForFromIdentifierResult = await getLngLatForIdentifier(
        withSameLngLatByIdentifier
      );

      if (!lngLatForFromIdentifierResult) {
        throw new NotFound('cannot find by identifier');
      }

      // Use lng, lat from this photo instead of lng, lat parameters
      lng = lngLatForFromIdentifierResult.lng;
      lat = lngLatForFromIdentifierResult.lat;
    }

    if (!lng || !lat) {
      throw new BadRequest('lngLat required');
    }

    const result = (await photoRepo.query(
      'select identifier from effective_geocodes_view where lng_lat ~= point($1, $2)',
      [lng, lat]
    )) as { identifier: string }[];

    const ids = result.map((r) => r.identifier);

    const photos = await photoRepo.find({
      where: { identifier: In(ids) },
      order: { collection: 'ASC' },
      relations: ['geocodeResults'],
      loadEagerRelations: true,
    });

    return photos;
  }

  @Get('/closest')
  public async getClosest(
    @Query() lng: string | number,
    @Query() lat: string | number,
    @Query() collection?: '1940' | '1980'
  ): Promise<Photo> {
    const photoRepo = getRepository(Photo);

    const result = (await photoRepo.query(
      'SELECT *, lng_lat<@>point($1, $2) AS distance FROM effective_geocodes_view WHERE collection = $3 ORDER BY distance LIMIT 1',
      [lng, lat, collection ?? '1940']
    )) as { identifier: string; distance: number }[];

    if (!result.length) {
      throw new NotFound();
    }

    const photo = await photoRepo.findOneByOrFail({
      identifier: result[0].identifier,
    });

    return photo;
  }

  @Get('/outtake-summaries')
  public async getOuttakeSummaries(
    @Query() collection?: '1940' | '1980'
  ): Promise<{ identifier: string }[]> {
    const photoRepo = getRepository(Photo);

    const photos = await photoRepo.find({
      where: { isOuttake: true, collection: collection ?? '1940' },
      select: ['identifier'],
      order: {
        identifier: 'ASC',
      },
    });
    return photos;
  }

  @Get('/{identifier}')
  public async getByIdentifier(@Path() identifier: string): Promise<Photo> {
    const photoRepo = getRepository(Photo);

    const photo = await photoRepo.findOne({
      where: { identifier },
      relations: ['geocodeResults'],
      loadEagerRelations: true,
    });

    if (!photo) {
      throw new NotFound('photo not found');
    }

    return photo;
  }

  @Get('/{identifier}/buy-prints')
  @SuccessResponse(302, 'Redirect to DORIS')
  public async buyPrints(
    @Path() identifier: string,
    @Request() req: express.Request
  ): Promise<void> {
    const photoRepo = getRepository(Photo);

    const photo = await photoRepo.findOneBy({
      identifier: req.params.identifier,
    });

    if (!photo) {
      throw new NotFound();
    }

    const formParams = {
      lot: photo.lot ? Number(photo.lot) : undefined,
      streetName: photo.streetName,
      imageIdentifier: photo.identifier,
      buildingNumber: photo.bldgNumberStart,
      block: photo.block,
      borough: photo.borough,
    };

    const formUrl =
      PHOTO_PURCHASE_FORM_URL +
      '?' +
      querystring.stringify({ ...formParams, ...UTM_TAGS_FOR_DORIS });

    req.res?.redirect(formUrl);
  }
}
