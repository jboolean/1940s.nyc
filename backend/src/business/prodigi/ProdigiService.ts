import {
  CreateOrderRequest,
  CreateQuoteRequest,
  Order,
  ProdigiApiError,
  ProdigiClient,
  Quote,
} from 'prodigi-print-api';
import isProduction from '../utils/isProduction';
import required from '../utils/required';

let client: ProdigiClient | undefined;

function getClient(): ProdigiClient {
  if (!client) {
    client = new ProdigiClient({
      apiKey: required(process.env.PRODIGI_SK, 'PRODIGI_SK'),
      environment: isProduction() ? 'production' : 'sandbox',
    });
  }
  return client;
}

// Orders on the live API cost real money.
export async function createOrder(request: CreateOrderRequest): Promise<Order> {
  if (isProduction() && process.env.PRODIGI_LIVE_ORDERS_ENABLED !== 'true') {
    throw new Error(
      'Refusing to create a Prodigi order on the live API: PRODIGI_LIVE_ORDERS_ENABLED is not true'
    );
  }
  return (await getClient().orders.create(request)).order;
}

// Prodigi returns 404 for an order held in the account's order edit window.
export async function getOrder(orderId: string): Promise<Order | undefined> {
  try {
    return (await getClient().orders.get(orderId)).order;
  } catch (e) {
    if (e instanceof ProdigiApiError && e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
}

export async function cancelOrder(orderId: string): Promise<void> {
  await getClient().orders.cancel(orderId);
}

export async function getQuotes(request: CreateQuoteRequest): Promise<Quote[]> {
  return (await getClient().quotes.create(request)).quotes;
}
