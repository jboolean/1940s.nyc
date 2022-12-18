import cors from 'cors';
import express from 'express';
const app = express();

import createConnection from './createConnection';

import { NotFound } from 'http-errors';
import { RegisterRoutes } from '../tsoa-build/routes';
import GeodataResource from './api/GeodataResource';
import PhotosResource from './api/PhotosResource';
import TipsResource from './api/TipsResource';

import {
  NextFunction,
  Request as ExRequest,
  Response as ExResponse,
} from 'express';
import { ValidateError } from 'tsoa';

app.use(express.json());

app.use(
  cors({
    origin: [
      'http://dev.1940s.nyc:8080',
      'http://localhost:8080',
      'https://1940s.nyc',
      /--1940s-nyc\.netlify\.app$/,
    ],
  })
);

app.use(async (req, res, next) => {
  await createConnection();
  next();
});

app.use('/photos', PhotosResource);
app.use('/tips', TipsResource);
app.use('/geodata', GeodataResource);

// Tsoa
RegisterRoutes(app);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(function (req, res) {
  throw new NotFound();
});

app.use(function errorHandler(
  err: unknown,
  req: ExRequest,
  res: ExResponse,
  next: NextFunction
): ExResponse | void {
  if (err instanceof ValidateError) {
    console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
    return res.status(422).json({
      error: 'Validation Failed',
      details: err?.fields,
    });
  }
  if (err instanceof Error) {
    console.error('Unhandled error', err);
    return res.status(500).json({
      error: 'Internal Server Error',
    });
  }

  next();
});

export default app;
