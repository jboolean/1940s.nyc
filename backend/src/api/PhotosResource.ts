import express from 'express';
const router = express.Router();

import querystring from 'querystring';

import { getRepository } from 'typeorm';
import Photo from '../entities/Photo';

const PHOTO_PURCHASE_FORM_URL = 'https://www1.nyc.gov/dorforms/photoform.htm';

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
