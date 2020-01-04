import express from 'express';
const router = express.Router();

import { getRepository } from 'typeorm';
import Photo from '../entities/Photo';

router.get('/photos/:identifier', async (req, res) => {
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

export default router;
