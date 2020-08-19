import getStripe from 'utils/getStripe';
import api from 'utils/api';
import queryString from 'query-string';

export default async function redirectToCheckout(
  amount: number
): Promise<void> {
  const parsedUrl = queryString.parseUrl(window.location.href);
  parsedUrl.query.tipSuccess = '';
  const options = {
    amount,
    successUrl: queryString.stringifyUrl(parsedUrl),
    cancelUrl: window.location.href,
  };
  const stripe = await getStripe();
  const sessionResp = await api.post<{ sessionId: string }>(
    '/tips/session',
    options
  );
  const { sessionId } = sessionResp.data;
  const { error } = await stripe.redirectToCheckout({ sessionId });
  if (error) {
    console.warn(error);
    throw error;
  }
}
