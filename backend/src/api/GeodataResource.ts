import express from 'express';
const router = express.Router();
import { createGeojson } from '../business/GeodataService';
import http from 'http';

router.get('/geojson.json', (req, res: http.ServerResponse) => {
  createGeojson(res);
});

export default router;
