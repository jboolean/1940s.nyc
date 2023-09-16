import express from 'express';
import ipfilter from 'express-ipfilter';
import { Models } from 'postmark';
import isProduction from '../business/utils/isProduction';
import StoryRepository from '../repositories/StoryRepository';
const router = express.Router();

const POSTMARK_IPS = [
  '3.134.147.250',
  '50.31.156.6',
  '50.31.156.77',
  '18.217.206.57',
];

if (!isProduction()) {
  POSTMARK_IPS.push('127.0.0.1');
}

router.use('/', ipfilter.IpFilter(POSTMARK_IPS, { mode: 'allow' }));

router.post<
  '/',
  unknown,
  unknown,
  Models.Bounce & { Metadata: Record<string, string> },
  unknown
>('/', async (req, res) => {
  const event = req.body;
  switch (event.RecordType) {
    case 'Bounce': {
      const metadata = event.Metadata;

      // save bounce record
      if ('storyId' in metadata) {
        const storyId = parseInt(metadata.storyId, 10);
        await StoryRepository().update(storyId, {
          bounce: event,
        });
      }
      break;
    }
    default: {
      console.warn('Unhandled Postmark webhook event', event);
      break;
    }
  }
  res.status(200).send();
});

export default router;
