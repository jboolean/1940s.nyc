import express from 'express';
const app = express();

import createConnection from './createConnection';

import PhotosResource from './api/PhotosResource';

app.use(async (req, res, next) => {
  await createConnection();
  next();
});

app.use(PhotosResource);

export default app;
