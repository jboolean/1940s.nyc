import { randomUUID } from 'crypto';
import required from '../utils/required';
import {
  createEventSubscription,
  enableEventSubscription,
  listEventSubscriptions,
} from './whccApi';

// WHCC delivers to the staging API, so only the staging stage registers.
const API_BASE = 'https://api.staging.1940s.nyc';

const EVENT_TYPES = [
  'order.accepted',
  'order.rejected',
  'order.shipped',
  'order.cancelled',
] as const;

// A subscription belongs to the account, so one that already points at this URL with the events we
// need is reused instead of making a second.
export default async function registerWhccWebhooks(): Promise<void> {
  if (process.env.STAGE !== 'staging') {
    console.log('Not registering WHCC webhooks outside the staging stage');
    return;
  }

  const callbackUri = `${API_BASE}/whcc-webhooks`;
  const { items } = await listEventSubscriptions();
  const existing = items.find(
    (s) =>
      s.destination.callbackUri === callbackUri &&
      s.destination.version === 2 &&
      (s.eventTypes.includes('*') ||
        EVENT_TYPES.every((type) => s.eventTypes.includes(type)))
  );
  if (existing) {
    if (existing.status !== 'active') {
      await enableEventSubscription(existing.id);
    }
    return;
  }

  const created = await createEventSubscription(
    {
      destination: { type: 'webhook', callbackUri, version: 2 },
      eventTypes: [...EVENT_TYPES],
      description: 'fourtiesnyc',
      signingSecret: required(
        process.env.WHCC_SIGNING_SECRET,
        'WHCC_SIGNING_SECRET'
      ),
    },
    randomUUID()
  );
  await enableEventSubscription(created.id);
}
