import express from 'express';
const router = express.Router();
import http from 'http';
import GeojsonEncoder from '../business/geodata/GeojsonEncoder';

router.get('/geojson.json', async (req, res: http.ServerResponse) => {
  const encoder = new GeojsonEncoder('geojson');

  (await encoder.createGeojson()).pipe(res);
});

export default router;
