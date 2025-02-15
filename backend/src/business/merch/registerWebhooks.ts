import isProduction from '../utils/isProduction';
import { createWebhook, EventConfigurationRequest } from '../utils/printfulApi';

// Webhooks are only in production, so safe to hardcode
const API_BASE = 'https://api.1940s.nyc';

const INTERESTED_EVENTS = [
  'order_updated',
  // 'order_failed',
  // 'order_canceled',
  // 'shipment_sent',
  // 'mockup_task_finished',
] as const;

export default async function registerWebhooks(): Promise<void> {
  if (!isProduction()) {
    console.log('Not registering webhooks in non-production environment');
    return;
  }

  await createWebhook({
    body: {
      default_url: `${API_BASE}/printful-webhooks`,
      events: INTERESTED_EVENTS.map((type) => ({
        type: type,
      })) as EventConfigurationRequest[],
    },
  });
}
