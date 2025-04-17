import api from 'utils/api';
import getStripe from 'utils/getStripe';
import Gift from './utils/Gift';
import TipFrequency from './utils/TipFrequency';

export default async function redirectToCheckout(
  amount: number,
  frequency: TipFrequency = TipFrequency.ONCE,
  gift?: Gift['gift']
): Promise<void> {
  const successUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?tipSuccess=&tipAmount=${amount}${window.location.hash}`;
  const cancelUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?noWelcome=&openTipJar=${window.location.hash}`;

  const options = {
    amount,
    successUrl,
    cancelUrl,
    frequency,
    gift,
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
