import getStripe from 'utils/getStripe';
import api from 'utils/api';

export default async function redirectToCheckout(
  amount: number
): Promise<void> {
  const successUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?tipSuccess=${window.location.hash}`;
  const cancelUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?noWelcome=${window.location.hash}`;

  const options = {
    amount,
    successUrl,
    cancelUrl,
  };
  const stripe = await getStripe();
  const sessionResp = await api.post<{ sessionId: string }>(
    '/tips/session',
    options,
    { timeout: 5000 }
  );
  const { sessionId } = sessionResp.data;
  const { error } = await stripe.redirectToCheckout({ sessionId });
  if (error) {
    console.warn(error);
    throw error;
  }
}
