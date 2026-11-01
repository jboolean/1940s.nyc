import { MerchInternalVariant } from 'shared/utils/merch/Order';
import api from 'utils/api';

export interface PrintProductApiResponse {
  variant: MerchInternalVariant;
  label: string;
  priceAmount: number;
}

export function getAvailablePrintProducts(): Promise<
  PrintProductApiResponse[]
> {
  return api
    .get<PrintProductApiResponse[]>('/print-checkout/available-products')
    .then((resp) => resp.data);
}

export async function createPrintCheckoutSession(
  request: {
    photoIdentifier: string;
    variant: MerchInternalVariant;
    quantity: number;
    colorize: boolean;
  },
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const resp = await api.post<{ sessionId: string; url: string }>(
    '/print-checkout/session',
    { ...request, successUrl, cancelUrl },
    { timeout: 10000 }
  );
  return resp.data.url;
}

export async function createPrintCartCheckoutSession(
  items: {
    photoIdentifier: string;
    variant: MerchInternalVariant;
    quantity: number;
    colorize: boolean;
  }[],
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const resp = await api.post<{ sessionId: string; url: string }>(
    '/print-checkout/cart-session',
    { items, successUrl, cancelUrl },
    { timeout: 10000 }
  );
  return resp.data.url;
}
