/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import express from 'express';
const router = express.Router();

import querystring from 'querystring';

import { getRepository, In } from 'typeorm';
import getLngLatForIdentifier from '../repositories/getLngLatForIdentifier';
import Photo from '../entities/Photo';
import ErrorResponse from './ErrorResponse';

const PHOTO_PURCHASE_FORM_URL =
  'https://dorisorders.nyc.gov/dorisorders/ui/order-reproductions';

// Get photos by matching lng,lat
router.get<
  '/',
  unknown,
  Photo[] | ErrorResponse,
  unknown,
  {
    withSameLngLatByIdentifier?: string;
    lng?: string | number;
    lat?: string | number;
  }
>('/', async (req, res) => {
  const photoRepo = getRepository(Photo);

  let { lng, lat } = req.query;

  const { withSameLngLatByIdentifier } = req.query;

  if (withSameLngLatByIdentifier) {
    const lngLatForFromIdentifierResult = await getLngLatForIdentifier(
      withSameLngLatByIdentifier
    );

    if (!lngLatForFromIdentifierResult) {
      res.status(401).send({ error: 'cannot find by identifier' });
      return;
    }

    // Use lng, lat from this photo instead of lng, lat parameters
    lng = lngLatForFromIdentifierResult.lng;
    lat = lngLatForFromIdentifierResult.lat;
  }

  if (!lng || !lat) {
    res.status(401).send({ error: 'lngLat required' });
    return;
  }
  const result = await photoRepo.query(
    'select identifier from effective_geocodes_view where lng_lat ~= point($1, $2)',
    [lng, lat]
  );

  const ids = result.map((r) => r.identifier);

  const photos = await photoRepo.find({
    where: { identifier: In(ids) },
    order: { collection: 'ASC' },
    relations: ['geocodeResults'],
    loadEagerRelations: true,
  });
  res.send(photos);
});

router.get('/closest', async (req, res) => {
  const photoRepo = getRepository(Photo);
  const result = await photoRepo.query(
    'SELECT *, lng_lat<@>point($1, $2) AS distance FROM effective_geocodes_view WHERE collection = $3 ORDER BY distance LIMIT 1',
    [req.query.lng, req.query.lat, req.query.collection ?? '1940']
  );

  if (!result.length) {
    res.status(404);
    res.send();
    return;
  }

  const photo = await photoRepo.findOneBy({ identifier: result[0].identifier });
  res.send(photo);
});

router.get<
  '/outtake-summaries',
  never,
  Photo[],
  never,
  { collection?: string }
>('/outtake-summaries', async (req, res) => {
  const photoRepo = getRepository(Photo);

  const photos = await photoRepo.find({
    where: { isOuttake: true, collection: req.query.collection ?? '1940' },
    select: ['identifier'],
    order: {
      identifier: 'ASC',
    },
  });

  res.send(photos);
});

router.get('/:identifier', async (req, res) => {
  const photoRepo = getRepository(Photo);

  const photo = await photoRepo.find({
    where: { identifier: req.params.identifier },
    relations: ['geocodeResults'],
    loadEagerRelations: true,
  });
  if (!photo) {
    res.status(404);
    res.send();
    return;
  }
  res.send(photo);
});

router.get('/:identifier/buy-prints', async (req, res) => {
  const photoRepo = getRepository(Photo);

  const photo = await photoRepo.findOneBy({
    identifier: req.params.identifier,
  });
  if (!photo) {
    res.status(404);
    res.send();
    return;
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
    PHOTO_PURCHASE_FORM_URL + '?' + querystring.stringify(formParams);
  res.redirect(formUrl);
});

export default router;
