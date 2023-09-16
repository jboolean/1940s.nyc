import cors from 'cors';
import express from 'express';
const app = express();
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { CaptureConsole as CaptureConsoleIntegration } from '@sentry/integrations';
import cookieParser from 'cookie-parser';

import createConnection from './createConnection';

import { NotFound, HttpError } from 'http-errors';
import { RegisterRoutes } from '../tsoa-build/routes';
import GeodataResource from './api/GeodataResource';
import PhotosResource from './api/PhotosResource';

import {
  NextFunction,
  Request as ExRequest,
  Response as ExResponse,
} from 'express';
import { ValidateError } from 'tsoa';
import StripeWebhooksResource from './api/StripeWebhooksResource';
import PostmarkWebhooksResource from './api/PostmarkWebhooksResource';
import { IpDeniedError } from 'express-ipfilter';

// Trust API Gateway
app.set('trust proxy', 1);

Sentry.init({
  dsn: 'https://5c9a98d156614bac899b541f69d9b7f3@o4504630310600704.ingest.sentry.io/4504630315974657',
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
    new CaptureConsoleIntegration({
      // array of methods that should be captured
      // defaults to ['log', 'info', 'warn', 'error', 'debug', 'assert']
      levels: ['warn', 'error'],
    }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  environment: process.env.STAGE,
});
// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(
  Sentry.Handlers.requestHandler({
    ip: true,
  })
);
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: [
      'http://dev.1940s.nyc:8080',
      'http://localhost:8080',
      'https://1940s.nyc',
      /--1940s-nyc\.netlify\.app$/,
    ],
    credentials: true,
  })
);

app.use(async (req, res, next) => {
  await createConnection();
  next();
});

app.use('/photos', PhotosResource);
app.use('/geodata', GeodataResource);
app.use('/stripe-webhooks', StripeWebhooksResource);
app.use('/postmark-webhooks', PostmarkWebhooksResource);

// Tsoa
RegisterRoutes(app);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(function (req, res) {
  throw new NotFound();
});

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

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
  if (err instanceof IpDeniedError) {
    return res.status(403).json({
      error: err.message,
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: err.message,
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
