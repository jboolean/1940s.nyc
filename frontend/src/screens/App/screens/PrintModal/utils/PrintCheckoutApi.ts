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

export interface PrintCheckoutItem {
  photoIdentifier: string;
  variant: MerchInternalVariant;
  quantity: number;
  colorize: boolean;
}

export async function createPrintCheckoutSession(
  items: PrintCheckoutItem[],
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const resp = await api.post<{ sessionId: string; url: string }>(
    '/print-checkout/session',
    { items, successUrl, cancelUrl },
    { timeout: 10000 }
  );
  return resp.data.url;
}
