import express from 'express';
const router = express.Router();
import { createGeojson } from '../business/GeodataService';
import http from 'http';

router.get('/geojson.json', async (req, res: http.ServerResponse) => {
  await createGeojson(res);
});

export default router;
