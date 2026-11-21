import { randomUUID } from 'crypto';
import required from '../utils/required';
import {
  createEventSubscription,
  enableEventSubscription,
  listEventSubscriptions,
} from './whccApi';

const API_BASES: Record<string, string> = {
  production: 'https://api.1940s.nyc',
  staging: 'https://api.staging.1940s.nyc',
};

const EVENT_TYPES = [
  'order.accepted',
  'order.rejected',
  'order.shipped',
  'order.cancelled',
] as const;

// Subscriptions belong to the account. Reuse the one for this stage's endpoint.
export default async function registerWhccWebhooks(): Promise<void> {
  const apiBase = API_BASES[process.env.STAGE ?? ''];
  if (!apiBase) {
    console.log(
      'Not registering WHCC webhooks outside the production and staging stages'
    );
    return;
  }

  const callbackUri = `${apiBase}/whcc-webhooks`;
  const { items } = await listEventSubscriptions();
  const existing = items.find((s) => s.destination.callbackUri === callbackUri);
  if (existing) {
    const matches =
      existing.destination.version === 2 &&
      (existing.eventTypes.includes('*') ||
        EVENT_TYPES.every((type) => existing.eventTypes.includes(type)));
    if (!matches) {
      throw new Error(
        `WHCC subscription ${existing.id} already uses ${callbackUri} but has a different version or event types; fix it in WHCC`
      );
    }
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
        process.env.WHCC_SIGNING_SECRET || undefined,
        'WHCC_SIGNING_SECRET'
      ),
    },
    randomUUID()
  );
  await enableEventSubscription(created.id);
}
