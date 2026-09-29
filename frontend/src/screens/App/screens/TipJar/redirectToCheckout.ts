import api from 'utils/api';
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
  const sessionResp = await api.post<{ sessionId: string; url: string }>(
    '/tips/session',
    options,
    { timeout: 5000 }
  );
  const { url } = sessionResp.data;
  window.location.href = url;
}
