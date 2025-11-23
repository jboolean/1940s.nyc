import { MerchInternalVariant } from 'shared/utils/merch/Order';
import api from 'utils/api';

export async function redirectToCheckout(
  items: { variant: MerchInternalVariant; quantity: number }[],
  successUrl: string,
  cancelUrl: string
): Promise<void> {
  const sessionResp = await api.post<{ sessionId: string; url: string }>(
    '/merch-checkout/session',
    {
      successUrl,
      cancelUrl,
      items,
    },
    { timeout: 5000 }
  );
  const { url } = sessionResp.data;
  window.location.href = url;
}

export interface MerchProductApiResponse {
  variant: MerchInternalVariant;
  priceAmount: number;
}

export function getAvailableProducts(): Promise<MerchProductApiResponse[]> {
  return api
    .get<MerchProductApiResponse[]>('/merch-checkout/available-products')
    .then((resp) => resp.data);
}
