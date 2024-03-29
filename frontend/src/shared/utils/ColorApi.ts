import api from 'utils/api';
import getStripe from 'utils/getStripe';

export async function redirectToCheckout(
  quantity: number,
  unitPriceForAnalytics: number
): Promise<void> {
  const successUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?noWelcome=&creditPurchaseSuccess=&quantity=${quantity}&unitPrice=${unitPriceForAnalytics}${window.location.hash}`;
  const cancelUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?noWelcome=${window.location.hash}`;

  const stripe = await getStripe();
  const sessionResp = await api.post<{ sessionId: string }>(
    '/colorization/billing/buy-credits/sessions',
    {
      quantity,
      successUrl,
      cancelUrl,
    },
    { timeout: 5000 }
  );
  const { sessionId } = sessionResp.data;
  const { error } = await stripe.redirectToCheckout({ sessionId });
  if (error) {
    console.warn(error);
    throw error;
  }
}

export async function getBalance(): Promise<number> {
  const resp = await api.get<{ creditBalance: number }>(
    '/colorization/billing/balance'
  );
  return resp.data.creditBalance;
}

export function getColorizedImageUrl(identifier: string): string {
  return `${api.defaults.baseURL}/colorization/colorized/${identifier}`;
}

export function getPriceAmount(): Promise<number> {
  return api
    .get<{ unitAmount: number }>('/colorization/billing/price')
    .then((resp) => resp.data.unitAmount);
}
