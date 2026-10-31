import {
  CreateOrderRequest,
  CreateQuoteRequest,
  Order,
  ProdigiApiError,
  ProdigiClient,
  Product,
  Quote,
} from 'prodigi-print-api';
import required from '../utils/required';
import {
  assertOrderCreationAllowed,
  prodigiEnvironmentFromBaseUrl,
} from './prodigiConfig';

let client: ProdigiClient | undefined;

function getClient(): ProdigiClient {
  if (!client) {
    client = new ProdigiClient({
      apiKey: required(process.env.PRODIGI_SK, 'PRODIGI_SK'),
      environment: prodigiEnvironmentFromBaseUrl(
        required(process.env.PRODIGI_BASE_URL, 'PRODIGI_BASE_URL')
      ),
    });
  }
  return client;
}

export async function createOrder(request: CreateOrderRequest): Promise<Order> {
  assertOrderCreationAllowed(
    required(process.env.PRODIGI_BASE_URL, 'PRODIGI_BASE_URL'),
    process.env.PRODIGI_LIVE_ORDERS_ENABLED
  );
  const outcome = await getClient().orders.create(request);
  return outcome.order;
}

// Returns undefined when Prodigi has no such order. An order held by the account's
// order edit window also reads as not found until the hold is released.
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

export async function getQuotes(request: CreateQuoteRequest): Promise<Quote[]> {
  return (await getClient().quotes.create(request)).quotes;
}

export async function getProduct(sku: string): Promise<Product> {
  return (await getClient().products.get(sku)).product;
}
