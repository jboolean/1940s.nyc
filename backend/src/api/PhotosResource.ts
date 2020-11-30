import express from 'express';
const router = express.Router();

import querystring from 'querystring';

import { getRepository } from 'typeorm';
import Photo from '../entities/Photo';

const PHOTO_PURCHASE_FORM_URL = 'https://www1.nyc.gov/dorforms/photoform.htm';

// Get photos by matching lngLat
router.get('/', async (req, res) => {
  const photoRepo = getRepository(Photo);

  const { lngLat } = req.query;
  if (!lngLat) {
    res.status(401).send('lngLat required');
    return;
  }
  let x, y;
  try {
    const parsedLngLat = JSON.parse(lngLat) as { x: number; y: number };
    x = parsedLngLat.x;
    y = parsedLngLat.y;
    if (typeof x !== 'number' || typeof y !== 'number')
      throw new Error('Not numbers');
  } catch {
    res.status(401).send('Cannot parse lngLat');
  }
  const result = await photoRepo.query(
    'select identifier from effective_geocodes_view where lng_lat ~= point($1, $2)',
    [x, y]
  );

  const ids = result.map((r) => r.identifier);

  const photos = await photoRepo.findByIds(ids, { order: { address: 'ASC' } });
  res.send(photos);
});

router.get('/closest', async (req, res) => {
  const photoRepo = getRepository(Photo);
  const result = await photoRepo.query(
    'SELECT *, lng_lat<@>point($1, $2) AS distance FROM effective_geocodes_view order by distance limit 1',
    [req.query.lng, req.query.lat]
  );

  if (!result.length) {
    res.status(404);
    res.send();
    return;
  }

  const photo = await photoRepo.findOne(result[0].identifier);
  res.send(photo);
});

router.get('/outtake-summaries', async (req, res) => {
  const photoRepo = getRepository(Photo);

  const photos = await photoRepo.find({
    where: { isOuttake: true },
    select: ['identifier'],
    order: {
      identifier: 'ASC',
    },
  });

  res.send(photos);
});

router.get('/:identifier', async (req, res) => {
  const photoRepo = getRepository(Photo);

  const photo = await photoRepo.findOne(req.params.identifier, {
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

  const photo = await photoRepo.findOne(req.params.identifier);
  if (!photo) {
    res.status(404);
    res.send();
    return;
  }

  const formParams = {
    collection: '1940',
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
