import api from 'utils/api';

export default async function redirectToCustomerPortal(): Promise<void> {
  const returnUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?noWelcome=${window.location.hash}`;

  const options = {
    returnUrl,
  };
  const sessionResp = await api.post<{ url: string }>(
    '/tips/customer-portal-session',
    options,
    { timeout: 5000 }
  );
  const { url } = sessionResp.data;
  window.location.href = url;
}
